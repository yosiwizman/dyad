/**
 * Admin Config IPC Handlers
 *
 * Owner-only handlers for configuring broker and vault settings.
 * These should only be accessible via the hidden Admin Config panel
 * (Ctrl+Shift+K / Cmd+Shift+K).
 */

import log from "electron-log";
import crypto from "crypto";
import { createLoggedHandler } from "./safe_handle";
import { readSettings, writeSettings } from "../../main/settings";
import { getBrokerConfig, getBrokerDiagnostics } from "../../lib/broker";
import {
  DEFAULT_VAULT_URL,
  DEFAULT_VAULT_ANON_KEY,
  hasEnvDefaults as hasVaultEnvDefaults,
} from "../../vault/vault_config";

const logger = log.scope("admin-handlers");
const handle = createLoggedHandler(logger);

// Store last auth test result for diagnostics
let lastAuthResult: TestBrokerAuthResult | null = null;
let lastAuthTimestamp: string | null = null;

// --- Types ---

export interface AdminConfigStatus {
  broker: {
    url: string | null;
    hasDeviceToken: boolean;
    isEnabled: boolean;
    configSource: "settings" | "env" | "default" | "none";
  };
  vault: {
    url: string | null;
    hasAnonKey: boolean;
    hasSession: boolean;
    isConfigured: boolean;
  };
}

export interface SaveBrokerConfigParams {
  url?: string;
  deviceToken?: string;
}

export interface TestBrokerAuthResult {
  success: boolean;
  statusCode?: number;
  message: string;
  /** Detailed reason for failure */
  reason?:
    | "token_not_set"
    | "token_missing"
    | "token_invalid"
    | "broker_misconfigured"
    | "connection_error"
    | "server_error";
}

// --- Handlers ---

/**
 * Get current admin config status (no secrets)
 */
async function handleGetConfigStatus(): Promise<AdminConfigStatus> {
  const brokerDiag = getBrokerDiagnostics();
  const settings = readSettings();

  // Vault status
  const vaultUrl = settings.vault?.supabaseUrl || DEFAULT_VAULT_URL || null;
  const hasAnonKey = !!(
    settings.vault?.supabaseAnonKey?.value || DEFAULT_VAULT_ANON_KEY
  );
  const hasSession = !!(
    settings.vault?.authSession?.accessToken?.value &&
    settings.vault?.authSession?.expiresAt &&
    settings.vault.authSession.expiresAt > Date.now()
  );

  return {
    broker: {
      url: brokerDiag.brokerUrl,
      hasDeviceToken: brokerDiag.hasDeviceToken,
      isEnabled: brokerDiag.isEnabled,
      configSource: brokerDiag.configSource,
    },
    vault: {
      url: vaultUrl,
      hasAnonKey,
      hasSession,
      isConfigured: hasVaultEnvDefaults() || !!(vaultUrl && hasAnonKey),
    },
  };
}

/**
 * Normalize device token: trim whitespace, remove trailing newlines
 */
function normalizeDeviceToken(token: string): string {
  return token.trim().replace(/[\r\n]+$/, "");
}

/**
 * Validate device token format
 */
function validateDeviceToken(
  token: string,
): { valid: true } | { valid: false; error: string } {
  if (token.length < 16) {
    return {
      valid: false,
      error: `Device token is too short (${token.length} chars). Token must be at least 16 characters.`,
    };
  }
  return { valid: true };
}

/**
 * Get first 8 chars of SHA256 hash of token (safe fingerprint for diagnostics)
 */
function getTokenHashPrefix(token: string): string {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return hash.substring(0, 8);
}

/**
 * Save broker configuration
 */
async function handleSaveBrokerConfig(
  _event: Electron.IpcMainInvokeEvent,
  params: SaveBrokerConfigParams,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { url, deviceToken } = params;

    const currentSettings = readSettings();
    const brokerSettings = { ...currentSettings.broker };

    // Update URL if provided
    if (url !== undefined) {
      brokerSettings.url = url || undefined;
    }

    // Update device token if provided (with normalization and validation)
    if (deviceToken !== undefined) {
      if (deviceToken) {
        const normalizedToken = normalizeDeviceToken(deviceToken);

        // Validate token
        const validation = validateDeviceToken(normalizedToken);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        brokerSettings.deviceToken = { value: normalizedToken };
        logger.info(
          `Broker token saved (length: ${normalizedToken.length}, hash prefix: ${getTokenHashPrefix(normalizedToken)})`,
        );
      } else {
        brokerSettings.deviceToken = undefined;
      }
    }

    writeSettings({ broker: brokerSettings });
    logger.info("Broker config saved");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    logger.error("Failed to save broker config:", message);
    return { success: false, error: message };
  }
}

/**
 * Test broker authentication by calling /api/health/auth
 * This endpoint validates the device token and returns clear error messages.
 */
async function handleTestBrokerAuth(): Promise<TestBrokerAuthResult> {
  try {
    const config = getBrokerConfig();

    if (!config.url) {
      return {
        success: false,
        message: "Broker URL not configured",
        reason: "token_not_set",
      };
    }

    if (!config.deviceToken) {
      return {
        success: false,
        message:
          "Device token not set on this device. Enter your token above and save.",
        reason: "token_not_set",
      };
    }

    // Test the authenticated health endpoint
    const response = await fetch(`${config.url}/api/health/auth`, {
      method: "GET",
      headers: {
        "x-abba-device-token": config.deviceToken,
      },
    });

    if (response.ok) {
      const result: TestBrokerAuthResult = {
        success: true,
        statusCode: response.status,
        message: "Connected + Auth OK ✓",
      };
      lastAuthResult = result;
      lastAuthTimestamp = new Date().toISOString();
      return result;
    }

    // Parse error response
    let errorMessage = "Unknown error";
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || "Unknown error";
    } catch {
      errorMessage = await response.text();
    }

    // Handle 503 BrokerMisconfigured - server doesn't have ABBA_DEVICE_TOKEN set
    if (response.status === 503) {
      const result: TestBrokerAuthResult = {
        success: false,
        statusCode: 503,
        message:
          "Broker server misconfigured: ABBA_DEVICE_TOKEN not set on server. Set it in Vercel env and redeploy.",
        reason: "broker_misconfigured",
      };
      lastAuthResult = result;
      lastAuthTimestamp = new Date().toISOString();
      return result;
    }

    // Handle 401 with specific messages from broker
    if (response.status === 401) {
      let result: TestBrokerAuthResult;
      if (errorMessage.toLowerCase().includes("missing")) {
        result = {
          success: false,
          statusCode: 401,
          message: "Token missing: The token was not sent to the broker.",
          reason: "token_missing",
        };
      } else {
        // Token was sent but doesn't match
        const hashPrefix = getTokenHashPrefix(config.deviceToken);
        result = {
          success: false,
          statusCode: 401,
          message: `Token invalid: Your token (hash: ${hashPrefix}...) does not match the broker's ABBA_DEVICE_TOKEN.`,
          reason: "token_invalid",
        };
      }
      lastAuthResult = result;
      lastAuthTimestamp = new Date().toISOString();
      return result;
    }

    // Handle other server errors
    if (response.status >= 500) {
      const result: TestBrokerAuthResult = {
        success: false,
        statusCode: response.status,
        message: `Broker server error (${response.status}): ${errorMessage}`,
        reason: "server_error",
      };
      lastAuthResult = result;
      lastAuthTimestamp = new Date().toISOString();
      return result;
    }

    const result: TestBrokerAuthResult = {
      success: false,
      statusCode: response.status,
      message: `Broker returned status ${response.status}: ${errorMessage}`,
    };
    lastAuthResult = result;
    lastAuthTimestamp = new Date().toISOString();
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connection failed";
    logger.error("Broker auth test failed:", message);
    const result: TestBrokerAuthResult = {
      success: false,
      message: `Connection error: ${message}`,
      reason: "connection_error",
    };
    lastAuthResult = result;
    lastAuthTimestamp = new Date().toISOString();
    return result;
  }
}

/**
 * Get diagnostics for support (no secrets)
 */
async function handleGetDiagnostics(): Promise<{
  broker: ReturnType<typeof getBrokerDiagnostics> & {
    tokenLength: number | null;
    tokenHashPrefix: string | null;
    lastAuthStatus: string | null;
    lastAuthTimestamp: string | null;
  };
  vault: {
    url: string | null;
    hasAnonKey: boolean;
    hasSession: boolean;
    sessionExpiresAt: string | null;
    envDefaultsAvailable: boolean;
  };
  timestamp: string;
}>
  const brokerDiag = getBrokerDiagnostics();
  const brokerConfig = getBrokerConfig();
  const settings = readSettings();

  // Add token diagnostics (safe - no actual token value)
  const tokenLength = brokerConfig.deviceToken
    ? brokerConfig.deviceToken.length
    : null;
  const tokenHashPrefix = brokerConfig.deviceToken
    ? getTokenHashPrefix(brokerConfig.deviceToken)
    : null;

  const vaultSession = settings.vault?.authSession;
  let sessionExpiresAt: string | null = null;
  if (vaultSession?.expiresAt) {
    try {
      sessionExpiresAt = new Date(vaultSession.expiresAt).toISOString();
    } catch {
      sessionExpiresAt = "[invalid]";
    }
  }

  return {
    broker: {
      ...brokerDiag,
      tokenLength,
      tokenHashPrefix,
      lastAuthStatus: lastAuthResult
        ? lastAuthResult.success
          ? "ok"
          : lastAuthResult.reason || "failed"
        : null,
      lastAuthTimestamp,
    },
    vault: {
      url: settings.vault?.supabaseUrl || DEFAULT_VAULT_URL || null,
      hasAnonKey: !!(
        settings.vault?.supabaseAnonKey?.value || DEFAULT_VAULT_ANON_KEY
      ),
      hasSession: !!(
        vaultSession?.accessToken?.value &&
        vaultSession?.expiresAt &&
        vaultSession.expiresAt > Date.now()
      ),
      sessionExpiresAt,
      envDefaultsAvailable: hasVaultEnvDefaults(),
    },
    timestamp: new Date().toISOString(),
  };
}

// --- Registration ---

export function registerAdminHandlers(): void {
  handle("admin:get-config-status", handleGetConfigStatus);
  handle("admin:save-broker-config", handleSaveBrokerConfig);
  handle("admin:test-broker-auth", handleTestBrokerAuth);
  handle("admin:get-diagnostics", handleGetDiagnostics);

  logger.info("Admin IPC handlers registered");
}
