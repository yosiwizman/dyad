/**
 * Publish IPC Handlers
 *
 * Handles IPC communication for managed publishing.
 */

import { app } from "electron";
import { db } from "../../db";
import { apps } from "../../db/schema";
import { eq } from "drizzle-orm";
import path from "node:path";
import log from "electron-log";
import { getAbbaAppPath } from "../../paths/paths";
import { createBundle, cleanupBundle } from "../utils/bundle_utils";
import fs from "node:fs";
import {
  publishStart as brokerPublishStart,
  publishUpload as brokerPublishUpload,
  publishStatus as brokerPublishStatus,
  publishCancel as brokerPublishCancel,
  isUsingStubTransport,
  getBrokerDiagnostics,
  type PublishDiagnostics,
} from "../../lib/broker";
import { createLoggedHandler } from "./safe_handle";

const logger = log.scope("publish-handlers");
const handle = createLoggedHandler(logger);

// --- Types ---

export interface PublishStartParams {
  appId: number;
  profileId?: string;
}

export interface PublishStartResult {
  publishId: string;
  status: string;
  isStub: boolean;
}

export interface PublishStatusParams {
  publishId: string;
}

export interface PublishStatusResult {
  status: string;
  progress?: number;
  message?: string;
  url?: string;
  error?: string;
}

export interface PublishCancelParams {
  publishId: string;
}

export interface PublishCancelResult {
  success: boolean;
  status: string;
}

// --- In-progress publishes tracking ---

interface InProgressPublish {
  publishId: string;
  appId: number;
  bundlePath?: string;
  startTime: number;
}

const inProgressPublishes = new Map<string, InProgressPublish>();

// --- Handlers ---

/**
 * Start a managed publish operation
 */
async function handlePublishStart(
  _event: Electron.IpcMainInvokeEvent,
  params: PublishStartParams,
): Promise<PublishStartResult> {
  const { appId, profileId } = params;

  logger.info(`Starting managed publish for app ${appId}`);

  // Get app details
  const appRecord = await db.query.apps.findFirst({
    where: eq(apps.id, appId),
  });

  if (!appRecord) {
    throw new Error("App not found");
  }

  const appPath = getAbbaAppPath(appRecord.path);
  logger.info(`App path: ${appPath}`);

  // Create bundle
  const bundleDir = path.join(app.getPath("temp"), "abba-publish-bundles");
  const bundlePath = path.join(bundleDir, `app-${appId}-${Date.now()}.zip`);

  logger.info(`Creating bundle at ${bundlePath}`);

  const bundleInfo = await createBundle({
    sourceDir: appPath,
    outputPath: bundlePath,
    onProgress: (progress) => {
      logger.debug(
        `Bundle progress: ${progress.phase} ${progress.filesProcessed}/${progress.totalFiles}`,
      );
    },
  });

  logger.info(
    `Bundle created: ${bundleInfo.fileCount} files, ${bundleInfo.size} bytes`,
  );

  // Start publish with broker
  const response = await brokerPublishStart({
    appId,
    bundleHash: bundleInfo.hash,
    bundleSize: bundleInfo.size,
    profileId,
    appName: appRecord.name,
    appPath, // Pass appPath for stub mode to return local file:// URL
  });

  // Track in-progress publish
  inProgressPublishes.set(response.publishId, {
    publishId: response.publishId,
    appId,
    bundlePath,
    startTime: Date.now(),
  });

  logger.info(`Publish started: ${response.publishId}`);

  // If we have an upload URL (real broker), upload the bundle
  if (response.uploadUrl && !isUsingStubTransport()) {
    logger.info(`Uploading bundle to ${response.uploadUrl}`);
    const bundleBuffer = await fs.promises.readFile(bundlePath);
    await brokerPublishUpload(response.uploadUrl, bundleBuffer);
    logger.info(`Bundle uploaded successfully`);
  }

  return {
    publishId: response.publishId,
    status: response.status,
    isStub: isUsingStubTransport(),
  };
}

/**
 * Get the status of a publish operation
 */
async function handlePublishStatus(
  _event: Electron.IpcMainInvokeEvent,
  params: PublishStatusParams,
): Promise<PublishStatusResult> {
  const { publishId } = params;

  const response = await brokerPublishStatus(publishId);

  // If publish is complete (ready or failed), clean up
  if (response.status === "ready" || response.status === "failed") {
    const inProgress = inProgressPublishes.get(publishId);
    if (inProgress) {
      // Update app with publish URL if ready
      if (response.status === "ready" && response.url) {
        await db
          .update(apps)
          .set({ vercelDeploymentUrl: response.url }) // Reuse existing column for now
          .where(eq(apps.id, inProgress.appId));

        logger.info(`App ${inProgress.appId} published to ${response.url}`);
      }

      // Clean up bundle
      if (inProgress.bundlePath) {
        await cleanupBundle(inProgress.bundlePath);
      }

      inProgressPublishes.delete(publishId);
    }
  }

  return {
    status: response.status,
    progress: response.progress,
    message: response.message,
    url: response.url,
    error: response.error,
  };
}

/**
 * Cancel a publish operation
 */
async function handlePublishCancel(
  _event: Electron.IpcMainInvokeEvent,
  params: PublishCancelParams,
): Promise<PublishCancelResult> {
  const { publishId } = params;

  logger.info(`Cancelling publish: ${publishId}`);

  const response = await brokerPublishCancel(publishId);

  // Clean up if cancelled
  if (response.success) {
    const inProgress = inProgressPublishes.get(publishId);
    if (inProgress?.bundlePath) {
      await cleanupBundle(inProgress.bundlePath);
    }
    inProgressPublishes.delete(publishId);
  }

  return {
    success: response.success,
    status: response.status,
  };
}

/**
 * Get diagnostics for error reporting (with sensitive data redacted)
 */
async function handlePublishDiagnostics(
  _event: Electron.IpcMainInvokeEvent,
  params: { publishId?: string; appId: number },
): Promise<PublishDiagnostics> {
  const { publishId, appId } = params;

  const inProgress = publishId ? inProgressPublishes.get(publishId) : undefined;

  // Get broker diagnostics from centralized config
  const brokerDiag = getBrokerDiagnostics();

  const diagnostics: PublishDiagnostics = {
    publishId,
    appId,
    status: inProgress ? "queued" : "failed",
    timestamp: new Date().toISOString(),
    brokerUrl: brokerDiag.brokerUrl || "[stub-transport]",
    brokerConfigSource: brokerDiag.configSource,
    brokerEnabled: brokerDiag.isEnabled,
  };

  if (inProgress) {
    // Get current status
    try {
      const status = await brokerPublishStatus(inProgress.publishId);
      diagnostics.status = status.status;
      diagnostics.error = status.error;
    } catch (error) {
      diagnostics.error = String(error);
    }
  }

  return diagnostics;
}

/**
 * Get broker hosting status for UI display
 */
interface BrokerStatusResult {
  isEnabled: boolean;
  isStub: boolean;
  hostingStatus: "connected" | "not-configured";
  brokerHost: string | null;
}

async function handleBrokerStatus(): Promise<BrokerStatusResult> {
  const diag = getBrokerDiagnostics();
  return {
    isEnabled: diag.isEnabled,
    isStub: !diag.isEnabled,
    hostingStatus: diag.isEnabled ? "connected" : "not-configured",
    brokerHost: diag.brokerUrl,
  };
}

// --- Registration ---

export function registerPublishHandlers(): void {
  handle("publish:start", handlePublishStart);
  handle("publish:status", handlePublishStatus);
  handle("publish:cancel", handlePublishCancel);
  handle("publish:diagnostics", handlePublishDiagnostics);
  handle("publish:broker-status", handleBrokerStatus);

  logger.info("Publish IPC handlers registered");
}
