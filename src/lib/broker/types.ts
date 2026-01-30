/**
 * Broker Types and Schemas
 *
 * Defines the contract for the ABBA Broker API used for managed publishing.
 * In v1, a local stub transport simulates the publish flow.
 * Future versions will connect to a real hosted broker service.
 */

import { z } from "zod";

// --- Publish Status ---

export const PublishStatusEnum = z.enum([
  "queued",
  "packaging",
  "uploading",
  "building",
  "deploying",
  "ready",
  "failed",
  "cancelled",
]);

export type PublishStatus = z.infer<typeof PublishStatusEnum>;

// --- Publish Start Request/Response ---

export const PublishStartRequestSchema = z.object({
  /** The app ID being published */
  appId: z.number(),
  /** SHA256 hash of the bundle for integrity */
  bundleHash: z.string(),
  /** Size of the bundle in bytes */
  bundleSize: z.number(),
  /** Profile ID of the user publishing */
  profileId: z.string().optional(),
  /** Optional app name for display */
  appName: z.string().optional(),
  /** Local app path (for stub mode to return file:// URL) */
  appPath: z.string().optional(),
});

export type PublishStartRequest = z.infer<typeof PublishStartRequestSchema>;

export const PublishStartResponseSchema = z.object({
  /** Unique identifier for this publish operation */
  publishId: z.string(),
  /** Initial status */
  status: PublishStatusEnum,
  /** Upload URL for the bundle (when using real broker) */
  uploadUrl: z.string().optional(),
});

export type PublishStartResponse = z.infer<typeof PublishStartResponseSchema>;

// --- Publish Status Request/Response ---

export const PublishStatusRequestSchema = z.object({
  /** The publish ID to check */
  publishId: z.string(),
});

export type PublishStatusRequest = z.infer<typeof PublishStatusRequestSchema>;

export const PublishStatusResponseSchema = z.object({
  /** Current status of the publish */
  status: PublishStatusEnum,
  /** Live URL when ready */
  url: z.string().optional(),
  /** Error message if failed */
  error: z.string().optional(),
  /** Progress percentage (0-100) */
  progress: z.number().optional(),
  /** Human-readable status message */
  message: z.string().optional(),
});

export type PublishStatusResponse = z.infer<typeof PublishStatusResponseSchema>;

// --- Publish Cancel Request/Response ---

export const PublishCancelRequestSchema = z.object({
  /** The publish ID to cancel */
  publishId: z.string(),
});

export type PublishCancelRequest = z.infer<typeof PublishCancelRequestSchema>;

export const PublishCancelResponseSchema = z.object({
  /** Whether the cancel was successful */
  success: z.boolean(),
  /** Final status after cancellation */
  status: PublishStatusEnum,
});

export type PublishCancelResponse = z.infer<typeof PublishCancelResponseSchema>;

// --- Bundle Info ---

export const BundleInfoSchema = z.object({
  /** SHA256 hash of the bundle */
  hash: z.string(),
  /** Size in bytes */
  size: z.number(),
  /** Number of files in the bundle */
  fileCount: z.number(),
  /** Path to the bundle file */
  path: z.string(),
});

export type BundleInfo = z.infer<typeof BundleInfoSchema>;

// --- Diagnostics (for error reporting) ---

export interface PublishDiagnostics {
  publishId?: string;
  appId: number;
  status: PublishStatus;
  error?: string;
  bundleHash?: string;
  bundleSize?: number;
  timestamp: string;
  // Sensitive fields are redacted
  brokerUrl?: string; // Redacted to show only domain
}
