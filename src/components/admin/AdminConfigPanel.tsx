/**
 * AdminConfigPanel
 *
 * Owner-only panel for configuring broker and vault settings.
 * Accessible via Ctrl+Shift+K / Cmd+Shift+K shortcut.
 * This allows device owners to configure tokens without exposing settings to kids.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IpcClient } from "@/ipc/ipc_client";
import { showSuccess, showError } from "@/lib/toast";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Server,
  Cloud,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { VaultAuth } from "@/components/vault/VaultAuth";

interface AdminConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConfigStatus {
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

export function AdminConfigPanel({ isOpen, onClose }: AdminConfigPanelProps) {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Broker config form
  const [brokerUrl, setBrokerUrl] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showVaultSignIn, setShowVaultSignIn] = useState(false);
  const [resettingVault, setResettingVault] = useState(false);

  // Load current status
  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const configStatus = await IpcClient.getInstance().adminGetConfigStatus();
      setStatus(configStatus);
      // Pre-fill broker URL from current config
      if (configStatus.broker.url) {
        setBrokerUrl(configStatus.broker.url);
      }
    } catch (err) {
      console.error("Failed to load admin config status:", err);
      showError("Failed to load configuration status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      // Reset form state
      setDeviceToken("");
      setShowToken(false);
      setTestResult(null);
    }
  }, [isOpen, loadStatus]);

  // Save broker config
  const handleSaveBrokerConfig = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      const result = await IpcClient.getInstance().adminSaveBrokerConfig({
        url: brokerUrl || undefined,
        deviceToken: deviceToken || undefined,
      });

      if (result.success) {
        showSuccess("Broker configuration saved");
        setDeviceToken(""); // Clear token field after save
        await loadStatus(); // Refresh status
      } else {
        showError(result.error || "Failed to save configuration");
      }
    } catch (err: any) {
      showError(err.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  // Test broker auth
  const handleTestBrokerAuth = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await IpcClient.getInstance().adminTestBrokerAuth();
      setTestResult(result);
      if (result.success) {
        showSuccess("Broker connection successful!");
      } else {
        showError(result.message);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Test failed" });
      showError(err.message || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  // Copy diagnostics
  const handleCopyDiagnostics = async () => {
    try {
      const diagnostics = await IpcClient.getInstance().adminGetDiagnostics();
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      showSuccess("Diagnostics copied to clipboard");
    } catch (err) {
      console.error("Failed to copy diagnostics:", err);
      showError("Failed to copy diagnostics");
    }
  };

  // Reset Vault session
  const handleResetVault = async () => {
    setResettingVault(true);
    try {
      const result = await IpcClient.getInstance().vaultReset();
      if (result.success) {
        showSuccess(result.message);
        await loadStatus();
        setShowVaultSignIn(true); // Show sign-in form after reset
      } else {
        showError(result.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to reset Vault session");
    } finally {
      setResettingVault(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Admin Configuration
          </DialogTitle>
          <DialogDescription>
            Owner-only settings for device configuration. These settings are
            required for publishing and cloud backup.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Broker Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium">ABBA Broker</h3>
                {status?.broker.hasDeviceToken ? (
                  <span className="ml-auto flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Configured
                  </span>
                ) : (
                  <span className="ml-auto flex items-center gap-1 text-xs text-amber-600">
                    <XCircle className="w-3 h-3" />
                    Token Required
                  </span>
                )}
              </div>

              <div className="space-y-3 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="broker-url">Broker URL</Label>
                  <Input
                    id="broker-url"
                    placeholder="https://broker.abba.ai"
                    value={brokerUrl}
                    onChange={(e) => setBrokerUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use default:{" "}
                    {status?.broker.url || "https://broker.abba.ai"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="device-token">Device Token</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="device-token"
                        type={showToken ? "text" : "password"}
                        placeholder={
                          status?.broker.hasDeviceToken
                            ? "••••••••••••••••"
                            : "Enter device token"
                        }
                        value={deviceToken}
                        onChange={(e) => setDeviceToken(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {status?.broker.hasDeviceToken
                      ? "Leave empty to keep existing token, or enter a new one to replace."
                      : "Required for publishing. Contact ABBA support for your device token."}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveBrokerConfig}
                    disabled={saving}
                    size="sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Broker Config"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestBrokerAuth}
                    disabled={testing || !status?.broker.hasDeviceToken}
                    size="sm"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>

                {testResult && (
                  <div
                    className={`text-sm p-2 rounded ${testResult.success ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}
                  >
                    {testResult.message}
                  </div>
                )}
              </div>
            </div>

            {/* Vault Configuration */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-green-600" />
                <h3 className="font-medium">Cloud Backup (Vault)</h3>
                {status?.vault.hasSession ? (
                  <span className="ml-auto flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Signed In
                  </span>
                ) : status?.vault.isConfigured ? (
                  <span className="ml-auto flex items-center gap-1 text-xs text-amber-600">
                    <XCircle className="w-3 h-3" />
                    Sign-in Required
                  </span>
                ) : (
                  <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                    <XCircle className="w-3 h-3" />
                    Not Configured
                  </span>
                )}
              </div>

              <div className="space-y-3 pl-6">
                <p className="text-sm text-muted-foreground">
                  {status?.vault.hasSession
                    ? "Vault is connected and ready for cloud backup."
                    : status?.vault.isConfigured
                      ? "Vault is configured. Sign in below to enable cloud backups."
                      : "Vault is not configured. Contact ABBA support for configuration."}
                </p>
                {status?.vault.url && (
                  <p className="text-xs text-muted-foreground">
                    URL: {status.vault.url}
                  </p>
                )}

                {/* Vault Sign-in Section (collapsible) */}
                {status?.vault.isConfigured && !status?.vault.hasSession && (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVaultSignIn(!showVaultSignIn)}
                      className="w-full justify-between"
                    >
                      <span>Sign in to Vault</span>
                      {showVaultSignIn ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                    {showVaultSignIn && (
                      <div className="mt-3">
                        <VaultAuth
                          onAuthSuccess={() => {
                            setShowVaultSignIn(false);
                            loadStatus();
                          }}
                          compact
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Reset Vault Session button */}
                {status?.vault.isConfigured && (
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetVault}
                      disabled={resettingVault}
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    >
                      {resettingVault ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4 mr-2" />
                      )}
                      Reset Vault Session
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clear cached tokens if Vault auth is stuck
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostics */}
            <div className="border-t pt-4">
              <Button variant="ghost" size="sm" onClick={handleCopyDiagnostics}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Diagnostics (for support)
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <p className="text-xs text-muted-foreground mr-auto">
            Shortcut: Ctrl+Shift+K (Windows) / Cmd+Shift+K (Mac)
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
