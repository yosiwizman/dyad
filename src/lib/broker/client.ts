/**
 * Broker Client
 *
 * Typed client for the ABBA Broker API. If BROKER_URL environment variable
 * is not set, uses a local stub transport that simulates the publish flow.
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

// --- Configuration ---

/**
 * Get the broker URL from environment, or null to use stub transport
 */
function getBrokerUrl(): string | null {
  const url = process.env.ABBA_BROKER_URL || process.env.BROKER_URL;
  return url || null;
}

/**
 * Check if we should use the stub transport
 */
export function isUsingStubTransport(): boolean {
  return getBrokerUrl() === null;
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
    `${brokerUrl}/v1/publish/start`,
    {
      method: "POST",
      body: JSON.stringify(validated),
    },
    PublishStartResponseSchema,
  );
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
    `${brokerUrl}/v1/publish/status?publishId=${encodeURIComponent(publishId)}`,
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
    `${brokerUrl}/v1/publish/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ publishId }),
    },
    PublishCancelResponseSchema,
  );
}
