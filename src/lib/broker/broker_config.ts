/**
 * Broker Configuration
 *
 * Provides configuration for the ABBA Broker API.
 * Configuration is resolved in the following priority:
 * 1. User settings (if set)
 * 2. Environment variables
 * 3. Built-in defaults
 */

import { readSettings } from "../../main/settings";
import log from "electron-log";

const logger = log.scope("broker-config");

// Default broker URL for production ABBA builds
// This can be overridden via settings or environment variables
export const DEFAULT_BROKER_URL = "https://abba-broker.vercel.app";

/**
 * Broker configuration interface
 */
export interface BrokerConfig {
  url: string | null;
  deviceToken: string | null;
  isEnabled: boolean;
}

/**
 * Get broker configuration from settings with fallback to env vars and defaults.
 *
 * Priority:
 * 1. settings.broker.url / settings.broker.deviceToken
 * 2. process.env.ABBA_BROKER_URL / process.env.ABBA_DEVICE_TOKEN
 * 3. DEFAULT_BROKER_URL (no default token - requires explicit config)
 */
export function getBrokerConfig(): BrokerConfig {
  let url: string | null = null;
  let deviceToken: string | null = null;

  // Try to read from settings (main process only)
  try {
    const settings = readSettings();
    if (settings.broker?.url) {
      url = settings.broker.url;
    }
    if (settings.broker?.deviceToken?.value) {
      deviceToken = settings.broker.deviceToken.value;
    }
  } catch (error) {
    // Settings might not be available (e.g., in renderer process tests)
    logger.debug("Could not read broker settings:", error);
  }

  // Fall back to environment variables
  if (!url) {
    url = process.env.ABBA_BROKER_URL || process.env.BROKER_URL || null;
  }
  if (!deviceToken) {
    deviceToken = process.env.ABBA_DEVICE_TOKEN || null;
  }

  // Use default URL if nothing is configured
  // In production ABBA builds, we want to use the default broker
  if (!url && process.env.NODE_ENV !== "development") {
    url = DEFAULT_BROKER_URL;
    logger.info(`Using default broker URL: ${DEFAULT_BROKER_URL}`);
  }

  // Broker is enabled if URL is set
  // Note: deviceToken is optional for public publish endpoints
  const isEnabled = !!url;

  return { url, deviceToken, isEnabled };
}

/**
 * Check if broker is configured and enabled
 */
export function isBrokerEnabled(): boolean {
  return getBrokerConfig().isEnabled;
}

/**
 * Check if device token is configured (required for authenticated broker operations)
 */
export function isDeviceTokenConfigured(): boolean {
  return !!getBrokerConfig().deviceToken;
}

/**
 * Check if broker auth is fully configured (URL + token)
 */
export function isBrokerAuthConfigured(): boolean {
  const config = getBrokerConfig();
  return config.isEnabled && !!config.deviceToken;
}

/**
 * Get diagnostics-safe broker info (no secrets)
 */
export function getBrokerDiagnostics(): {
  brokerUrl: string | null;
  hasBrokerUrl: boolean;
  hasDeviceToken: boolean;
  isEnabled: boolean;
  configSource: "settings" | "env" | "default" | "none";
} {
  const config = getBrokerConfig();

  // Determine config source
  let configSource: "settings" | "env" | "default" | "none" = "none";
  try {
    const settings = readSettings();
    if (settings.broker?.url) {
      configSource = "settings";
    } else if (process.env.ABBA_BROKER_URL || process.env.BROKER_URL) {
      configSource = "env";
    } else if (config.url === DEFAULT_BROKER_URL) {
      configSource = "default";
    }
  } catch {
    if (process.env.ABBA_BROKER_URL || process.env.BROKER_URL) {
      configSource = "env";
    } else if (config.url === DEFAULT_BROKER_URL) {
      configSource = "default";
    }
  }

  // Redact the broker URL to host only
  let redactedUrl: string | null = null;
  if (config.url) {
    try {
      const parsed = new URL(config.url);
      redactedUrl = `${parsed.protocol}//${parsed.host}`;
    } catch {
      redactedUrl = "[invalid-url]";
    }
  }

  return {
    brokerUrl: redactedUrl,
    hasBrokerUrl: !!config.url,
    hasDeviceToken: !!config.deviceToken,
    isEnabled: config.isEnabled,
    configSource,
  };
}
