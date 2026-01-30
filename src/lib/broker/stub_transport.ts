/**
 * Stub Transport for Managed Publish
 *
 * Simulates the ABBA Broker API locally for development and testing.
 * Provides a realistic publish flow that transitions through states
 * over ~15 seconds before returning a fake live URL.
 */

import { v4 as uuidv4 } from "uuid";
import type {
  PublishStartRequest,
  PublishStartResponse,
  PublishStatusResponse,
  PublishCancelResponse,
  PublishStatus,
} from "./types";

// --- In-memory state for stub publishes ---

interface StubPublishState {
  publishId: string;
  appId: number;
  appName?: string;
  appPath?: string;
  status: PublishStatus;
  progress: number;
  startTime: number;
  cancelled: boolean;
}

const stubPublishes = new Map<string, StubPublishState>();

// --- Timing configuration ---

const PHASE_DURATIONS: Record<PublishStatus, number> = {
  queued: 1000, // 1 second
  packaging: 3000, // 3 seconds
  uploading: 4000, // 4 seconds
  building: 4000, // 4 seconds
  deploying: 3000, // 3 seconds
  ready: 0,
  failed: 0,
  cancelled: 0,
};

const STATUS_PROGRESSION: PublishStatus[] = [
  "queued",
  "packaging",
  "uploading",
  "building",
  "deploying",
  "ready",
];

// --- Stub Implementation ---

/**
 * Start a simulated publish operation
 */
export async function stubPublishStart(
  request: PublishStartRequest,
): Promise<PublishStartResponse> {
  const publishId = `stub-${uuidv4().slice(0, 8)}`;

  const state: StubPublishState = {
    publishId,
    appId: request.appId,
    appName: request.appName,
    appPath: request.appPath,
    status: "queued",
    progress: 0,
    startTime: Date.now(),
    cancelled: false,
  };

  stubPublishes.set(publishId, state);

  return {
    publishId,
    status: "queued",
  };
}

/**
 * Get the current status of a simulated publish
 */
export async function stubPublishStatus(
  publishId: string,
): Promise<PublishStatusResponse> {
  const state = stubPublishes.get(publishId);

  if (!state) {
    return {
      status: "failed",
      error: "Publish not found",
    };
  }

  if (state.cancelled) {
    return {
      status: "cancelled",
      message: "Publish was cancelled",
    };
  }

  // Calculate current status based on elapsed time
  const elapsed = Date.now() - state.startTime;
  let cumulativeTime = 0;
  let currentStatus: PublishStatus = "queued";
  let progress = 0;

  for (const status of STATUS_PROGRESSION) {
    const duration = PHASE_DURATIONS[status];
    if (elapsed < cumulativeTime + duration) {
      currentStatus = status;
      // Calculate progress within this phase
      const phaseProgress = (elapsed - cumulativeTime) / duration;
      const statusIndex = STATUS_PROGRESSION.indexOf(status);
      progress = Math.floor(
        ((statusIndex + phaseProgress) / (STATUS_PROGRESSION.length - 1)) * 100,
      );
      break;
    }
    cumulativeTime += duration;
    if (status === "deploying") {
      currentStatus = "ready";
      progress = 100;
    }
  }

  state.status = currentStatus;
  state.progress = progress;

  const response: PublishStatusResponse = {
    status: currentStatus,
    progress,
    message: getStatusMessage(currentStatus),
  };

  if (currentStatus === "ready") {
    // In stub mode, return a local file:// URL to the app directory
    // This allows users to verify their app without a dead link
    if (state.appPath) {
      // Convert Windows path to file:// URL format
      const normalizedPath = state.appPath.replace(/\\/g, "/");
      response.url = `file:///${normalizedPath}`;
    } else {
      // Fallback to stub indicator if no appPath provided
      response.url = `stub://local/${state.publishId}`;
    }
  }

  return response;
}

/**
 * Cancel a simulated publish
 */
export async function stubPublishCancel(
  publishId: string,
): Promise<PublishCancelResponse> {
  const state = stubPublishes.get(publishId);

  if (!state) {
    return {
      success: false,
      status: "failed",
    };
  }

  // Can only cancel if not already finished
  if (state.status === "ready" || state.status === "failed") {
    return {
      success: false,
      status: state.status,
    };
  }

  state.cancelled = true;
  state.status = "cancelled";

  return {
    success: true,
    status: "cancelled",
  };
}

/**
 * Get a human-readable message for the current status
 */
function getStatusMessage(status: PublishStatus, isStub: boolean = true): string {
  switch (status) {
    case "queued":
      return "Preparing to publish...";
    case "packaging":
      return "Packaging your app...";
    case "uploading":
      return isStub ? "Simulating upload..." : "Uploading bundle...";
    case "building":
      return isStub ? "Simulating build..." : "Building for production...";
    case "deploying":
      return isStub ? "Generating local preview..." : "Deploying to ABBA hosting...";
    case "ready":
      return isStub ? "Ready (local preview)" : "Your app is live!";
    case "failed":
      return "Publish failed";
    case "cancelled":
      return "Publish cancelled";
  }
}

/**
 * Clean up old stub publishes (call periodically to prevent memory leaks)
 */
export function cleanupStubPublishes(): void {
  const MAX_AGE = 60 * 60 * 1000; // 1 hour
  const now = Date.now();

  for (const [publishId, state] of stubPublishes) {
    if (now - state.startTime > MAX_AGE) {
      stubPublishes.delete(publishId);
    }
  }
}
