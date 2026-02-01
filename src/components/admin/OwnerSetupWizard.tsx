/**
 * OwnerSetupWizard
 *
 * Guided 3-step wizard for device owner to configure:
 * 1. Publishing (broker URL + device token)
 * 2. Cloud Backup (Vault sign-in)
 * 3. Confirmation
 *
 * Appears automatically when:
 * - Bella Mode is active AND device token is missing
 * - Publish is attempted without token
 * - Vault backup is attempted without auth
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
  Server,
  Cloud,
  PartyPopper,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { VaultAuth } from "@/components/vault/VaultAuth";

interface OwnerSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  /** Initial step to show (0-2) */
  initialStep?: number;
  /** Called when setup is complete */
  onComplete?: () => void;
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

type WizardStep = 0 | 1 | 2;

const STEPS = [
  { title: "Configure Publishing", icon: Server },
  { title: "Connect Cloud Backup", icon: Cloud },
  { title: "All Set!", icon: PartyPopper },
] as const;

export function OwnerSetupWizard({
  isOpen,
  onClose,
  initialStep = 0,
  onComplete,
}: OwnerSetupWizardProps) {
  const [step, setStep] = useState<WizardStep>(initialStep as WizardStep);
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Step 1: Broker config
  const [brokerUrl, setBrokerUrl] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Load current status
  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const configStatus = await IpcClient.getInstance().adminGetConfigStatus();
      setStatus(configStatus);
      if (configStatus.broker.url) {
        setBrokerUrl(configStatus.broker.url);
      }
    } catch (err) {
      console.error("Failed to load config status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setStep(initialStep as WizardStep);
      setDeviceToken("");
      setShowToken(false);
      setTestResult(null);
    }
  }, [isOpen, loadStatus, initialStep]);

  // Save broker config
  const handleSaveBrokerConfig = async () => {
    if (!deviceToken && !status?.broker.hasDeviceToken) {
      showError("Device token is required");
      return;
    }

    setSaving(true);
    setTestResult(null);
    try {
      const result = await IpcClient.getInstance().adminSaveBrokerConfig({
        url: brokerUrl || undefined,
        deviceToken: deviceToken || undefined,
      });

      if (result.success) {
        showSuccess("Publishing configured!");
        setDeviceToken("");
        await loadStatus();
      } else {
        showError(result.error || "Failed to save configuration");
      }
    } catch (err: any) {
      showError(err.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  // Test broker connection
  const handleTestBrokerAuth = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await IpcClient.getInstance().adminTestBrokerAuth();
      setTestResult(result);
      if (result.success) {
        showSuccess("Connection successful!");
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  // Navigate between steps
  const goNext = () => {
    if (step < 2) setStep((step + 1) as WizardStep);
  };

  const goBack = () => {
    if (step > 0) setStep((step - 1) as WizardStep);
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
  };

  // Check if we can proceed from step 1
  const canProceedFromStep1 = status?.broker.hasDeviceToken;

  // Check if Vault is configured (for skip option)
  const vaultConfigured = status?.vault.hasSession;

  // Render step content
  const renderStepContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    switch (step) {
      case 0:
        return (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <Server className="w-12 h-12 mx-auto text-blue-600" />
              <h3 className="text-lg font-semibold">Configure Publishing</h3>
              <p className="text-sm text-muted-foreground">
                Enter your device token to enable publishing your apps to ABBA
                hosting.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="broker-url">Broker URL</Label>
                <Input
                  id="broker-url"
                  placeholder="https://abba-broker.vercel.app"
                  value={brokerUrl}
                  onChange={(e) => setBrokerUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use default broker
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="device-token">
                  Device Token <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="device-token"
                    type={showToken ? "text" : "password"}
                    placeholder={
                      status?.broker.hasDeviceToken
                        ? "••••••••••••••••"
                        : "Enter your device token"
                    }
                    value={deviceToken}
                    onChange={(e) => setDeviceToken(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {status?.broker.hasDeviceToken
                    ? "Token is configured. Enter a new one to replace it."
                    : "Contact ABBA support if you don't have a device token."}
                </p>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                {status?.broker.hasDeviceToken ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-400">
                      Publishing is configured
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-amber-600" />
                    <span className="text-sm text-amber-700 dark:text-amber-400">
                      Device token required
                    </span>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveBrokerConfig}
                  disabled={
                    saving || (!deviceToken && !status?.broker.hasDeviceToken)
                  }
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Configuration"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestBrokerAuth}
                  disabled={testing || !status?.broker.hasDeviceToken}
                >
                  {testing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {testResult && (
                <div
                  className={`text-sm p-3 rounded-lg ${
                    testResult.success
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <Cloud className="w-12 h-12 mx-auto text-green-600" />
              <h3 className="text-lg font-semibold">Connect Cloud Backup</h3>
              <p className="text-sm text-muted-foreground">
                Sign in to Vault to enable cloud backups of your apps.
              </p>
            </div>

            {/* Vault status */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              {status?.vault.hasSession ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400">
                    Vault is connected
                  </span>
                </>
              ) : status?.vault.isConfigured ? (
                <>
                  <XCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-amber-700 dark:text-amber-400">
                    Sign-in required
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Vault not configured
                  </span>
                </>
              )}
            </div>

            {/* Vault auth form */}
            {status?.vault.isConfigured && !status.vault.hasSession && (
              <VaultAuth
                onAuthSuccess={() => {
                  showSuccess("Signed in to Vault!");
                  loadStatus();
                }}
              />
            )}

            {!status?.vault.isConfigured && (
              <div className="text-center text-sm text-muted-foreground p-4 border rounded-lg">
                <p>
                  Vault is not configured for this installation. Cloud backups
                  will not be available.
                </p>
                <p className="mt-2">You can skip this step.</p>
              </div>
            )}

            {status?.vault.hasSession && (
              <div className="text-center text-sm text-green-600 dark:text-green-400 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
                Cloud backup is ready! You can backup your apps to Vault.
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-4">
              <PartyPopper className="w-16 h-16 mx-auto text-purple-600" />
              <h3 className="text-2xl font-bold">You're All Set!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your device is now configured. Kids can publish and backup their
                apps without seeing these settings.
              </p>
            </div>

            {/* Summary */}
            <div className="space-y-3 max-w-sm mx-auto">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Server className="w-5 h-5 text-blue-600" />
                <span className="flex-1">Publishing</span>
                {status?.broker.hasDeviceToken ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Cloud className="w-5 h-5 text-green-600" />
                <span className="flex-1">Cloud Backup</span>
                {status?.vault.hasSession ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : status?.vault.isConfigured ? (
                  <span className="text-xs text-amber-600">Optional</span>
                ) : (
                  <span className="text-xs text-gray-500">N/A</span>
                )}
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              To change these settings later, press{" "}
              <kbd className="px-1.5 py-0.5 font-mono bg-muted rounded">
                Ctrl+Shift+K
              </kbd>
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Owner Setup</DialogTitle>
          <DialogDescription>
            Configure this device for publishing and backups
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 py-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                      ? "bg-green-600 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-12 h-0.5 ${
                    i < step ? "bg-green-600" : "bg-muted"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        {renderStepContent()}

        <DialogFooter className="flex-row justify-between">
          <div>
            {step > 0 && (
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step === 0 && (
              <Button onClick={goNext} disabled={!canProceedFromStep1}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {step === 1 && (
              <>
                <Button variant="outline" onClick={goNext}>
                  {vaultConfigured ? "Next" : "Skip"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
            {step === 2 && <Button onClick={handleComplete}>Done</Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
