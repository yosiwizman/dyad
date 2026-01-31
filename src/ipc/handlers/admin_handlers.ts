/**
 * Admin Config IPC Handlers
 *
 * Owner-only handlers for configuring broker and vault settings.
 * These should only be accessible via the hidden Admin Config panel
 * (Ctrl+Shift+K / Cmd+Shift+K).
 */

import log from "electron-log";
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

    // Update device token if provided (encrypt it)
    if (deviceToken !== undefined) {
      if (deviceToken) {
        brokerSettings.deviceToken = { value: deviceToken };
      } else {
        brokerSettings.deviceToken = undefined;
      }
    }

    writeSettings({ broker: brokerSettings });
    logger.info("Broker config saved (token masked)");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    logger.error("Failed to save broker config:", message);
    return { success: false, error: message };
  }
}

/**
 * Test broker authentication by calling /api/health
 */
async function handleTestBrokerAuth(): Promise<TestBrokerAuthResult> {
  try {
    const config = getBrokerConfig();

    if (!config.url) {
      return {
        success: false,
        message: "Broker URL not configured",
      };
    }

    if (!config.deviceToken) {
      return {
        success: false,
        message: "Device token not configured",
      };
    }

    // Test the broker health endpoint with auth header
    const response = await fetch(`${config.url}/api/health`, {
      method: "GET",
      headers: {
        "x-abba-device-token": config.deviceToken,
      },
    });

    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        message: "Broker connection successful",
      };
    }

    // Handle specific error codes
    if (response.status === 401) {
      return {
        success: false,
        statusCode: 401,
        message: "Invalid device token. Please check and try again.",
      };
    }

    return {
      success: false,
      statusCode: response.status,
      message: `Broker returned status ${response.status}`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connection failed";
    logger.error("Broker auth test failed:", message);
    return {
      success: false,
      message: `Connection error: ${message}`,
    };
  }
}

/**
 * Get diagnostics for support (no secrets)
 */
async function handleGetDiagnostics(): Promise<{
  broker: ReturnType<typeof getBrokerDiagnostics>;
  vault: {
    url: string | null;
    hasAnonKey: boolean;
    hasSession: boolean;
    sessionExpiresAt: string | null;
    envDefaultsAvailable: boolean;
  };
  timestamp: string;
}> {
  const brokerDiag = getBrokerDiagnostics();
  const settings = readSettings();

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
    broker: brokerDiag,
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
