/**
 * Broker Client
 *
 * Typed client for the ABBA Broker API. Uses the centralized broker config
 * which resolves settings → env vars → defaults. If no broker URL is
 * configured, uses a local stub transport that simulates the publish flow.
 */

import { z } from "zod";
import {
  PublishStartRequestSchema,
  PublishStartResponseSchema,
  PublishStatusResponseSchema,
  PublishCancelResponseSchema,
  type PublishStartRequest,
  type PublishStartResponse,
  type PublishStatusResponse,
  type PublishCancelResponse,
} from "./types";
import {
  stubPublishStart,
  stubPublishStatus,
  stubPublishCancel,
} from "./stub_transport";
import { getBrokerConfig, isBrokerEnabled } from "./broker_config";

// --- Configuration ---

/**
 * Get the broker URL from centralized config
 */
function getBrokerUrl(): string | null {
  return getBrokerConfig().url;
}

/**
 * Get the device token for authentication from centralized config
 */
function getDeviceToken(): string | null {
  return getBrokerConfig().deviceToken;
}

/**
 * Check if we should use the stub transport
 */
export function isUsingStubTransport(): boolean {
  return !isBrokerEnabled();
}

/**
 * Get auth headers for broker requests
 */
function getAuthHeaders(): Record<string, string> {
  const token = getDeviceToken();
  if (token) {
    return { "x-abba-device-token": token };
  }
  return {};
}

// --- HTTP Transport ---

async function httpFetch<T>(
  url: string,
  options: RequestInit,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Broker request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return schema.parse(data);
}

// --- Client Methods ---

/**
 * Start a publish operation
 *
 * @param request - The publish start request
 * @returns The publish start response with publishId
 */
export async function publishStart(
  request: PublishStartRequest,
): Promise<PublishStartResponse> {
  // Validate request
  const validated = PublishStartRequestSchema.parse(request);

  const brokerUrl = getBrokerUrl();
  if (!brokerUrl) {
    // Use stub transport
    return stubPublishStart(validated);
  }

  // Use real HTTP transport
  return httpFetch(
    `${brokerUrl}/api/v1/publish/start`,
    {
      method: "POST",
      body: JSON.stringify(validated),
    },
    PublishStartResponseSchema,
  );
}

/**
 * Upload a bundle to the broker
 *
 * @param uploadUrl - The upload URL from publishStart response
 * @param bundlePath - Path to the bundle file
 * @returns Success indicator
 */
export async function publishUpload(
  uploadUrl: string,
  bundleBuffer: Buffer,
): Promise<{ success: boolean; message?: string }> {
  const brokerUrl = getBrokerUrl();
  if (!brokerUrl) {
    // Stub mode - upload is simulated, just return success
    return { success: true, message: "Stub upload simulated" };
  }

  // Resolve the upload URL (might be relative)
  const fullUrl = uploadUrl.startsWith("http")
    ? uploadUrl
    : `${brokerUrl}${uploadUrl}`;

  const response = await fetch(fullUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream",
      ...getAuthHeaders(),
    },
    // Convert Buffer to Uint8Array for TypeScript compatibility with fetch BodyInit
    body: new Uint8Array(bundleBuffer),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return { success: true, message: data.message };
}

/**
 * Get the status of a publish operation
 *
 * @param publishId - The publish ID to check
 * @returns The current publish status
 */
export async function publishStatus(
  publishId: string,
): Promise<PublishStatusResponse> {
  const brokerUrl = getBrokerUrl();
  if (!brokerUrl) {
    // Use stub transport
    return stubPublishStatus(publishId);
  }

  // Use real HTTP transport
  return httpFetch(
    `${brokerUrl}/api/v1/publish/status?publishId=${encodeURIComponent(publishId)}`,
    { method: "GET" },
    PublishStatusResponseSchema,
  );
}

/**
 * Cancel a publish operation
 *
 * @param publishId - The publish ID to cancel
 * @returns The cancel response
 */
export async function publishCancel(
  publishId: string,
): Promise<PublishCancelResponse> {
  const brokerUrl = getBrokerUrl();
  if (!brokerUrl) {
    // Use stub transport
    return stubPublishCancel(publishId);
  }

  // Use real HTTP transport
  return httpFetch(
    `${brokerUrl}/api/v1/publish/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ publishId }),
    },
    PublishCancelResponseSchema,
  );
}
