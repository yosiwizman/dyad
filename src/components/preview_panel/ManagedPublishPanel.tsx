/**
 * ManagedPublishPanel
 *
 * Provides one-button publish experience for Bella Mode users.
 * Shows progress steps and final live URL when ready.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IpcClient } from "@/ipc/ipc_client";
import { useProfile } from "@/contexts/ProfileContext";
import { showSuccess, showError } from "@/lib/toast";
import {
  Rocket,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Package,
  Upload,
  Server,
  Globe,
} from "lucide-react";

// --- Types ---

type PublishPhase =
  | "idle"
  | "packaging"
  | "uploading"
  | "building"
  | "deploying"
  | "ready"
  | "failed"
  | "cancelled";

interface ManagedPublishPanelProps {
  appId: number;
  appName: string;
  lastPublishUrl?: string | null;
  onPublishComplete?: (url: string) => void;
}

// --- Progress Step Component ---

interface ProgressStepProps {
  icon: React.ReactNode;
  label: string;
  status: "pending" | "active" | "complete" | "error";
}

function ProgressStep({ icon, label, status }: ProgressStepProps) {
  const getStepStyles = () => {
    switch (status) {
      case "complete":
        return "text-green-600 dark:text-green-400";
      case "active":
        return "text-blue-600 dark:text-blue-400 animate-pulse";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-400 dark:text-gray-600";
    }
  };

  return (
    <div className={`flex items-center gap-2 ${getStepStyles()}`}>
      <div className="w-5 h-5">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
      {status === "complete" && (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      )}
    </div>
  );
}

// --- Main Component ---

export function ManagedPublishPanel({
  appId,
  appName: _appName,
  lastPublishUrl,
  onPublishComplete,
}: ManagedPublishPanelProps) {
  const { activeProfile } = useProfile();
  const [phase, setPhase] = useState<PublishPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [publishId, setPublishId] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(
    lastPublishUrl || null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isStub, setIsStub] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Map status string to phase
  const mapStatusToPhase = (status: string): PublishPhase => {
    switch (status) {
      case "queued":
      case "packaging":
        return "packaging";
      case "uploading":
        return "uploading";
      case "building":
        return "building";
      case "deploying":
        return "deploying";
      case "ready":
        return "ready";
      case "failed":
        return "failed";
      case "cancelled":
        return "cancelled";
      default:
        return "idle";
    }
  };

  // Poll for publish status
  const pollStatus = useCallback(
    async (id: string) => {
      try {
        const result = await IpcClient.getInstance().publishStatus(id);

        setPhase(mapStatusToPhase(result.status));
        setProgress(result.progress || 0);
        setMessage(result.message || null);

        if (result.status === "ready" && result.url) {
          setPublishedUrl(result.url);
          setError(null);
          onPublishComplete?.(result.url);
          showSuccess("Your app is live!");
          // Stop polling
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } else if (result.status === "failed") {
          setError(result.error || "Publish failed");
          showError(result.error || "Publish failed");
          // Stop polling
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } else if (result.status === "cancelled") {
          // Stop polling
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (err) {
        console.error("Failed to poll publish status:", err);
      }
    },
    [onPublishComplete],
  );

  // Start publish
  const handlePublish = async () => {
    if (!appId) return;

    setPhase("packaging");
    setProgress(0);
    setError(null);
    setMessage("Starting publish...");

    try {
      const result = await IpcClient.getInstance().publishStart({
        appId,
        profileId: activeProfile?.profileId,
      });

      setPublishId(result.publishId);
      setIsStub(result.isStub);
      setPhase(mapStatusToPhase(result.status));

      // Start polling
      pollingRef.current = setInterval(() => {
        pollStatus(result.publishId);
      }, 1000);

      // Initial poll
      pollStatus(result.publishId);
    } catch (err: any) {
      setPhase("failed");
      setError(err.message || "Failed to start publish");
      showError(err.message || "Failed to start publish");
    }
  };

  // Cancel publish
  const handleCancel = async () => {
    if (!publishId) return;

    try {
      await IpcClient.getInstance().publishCancel(publishId);
      setPhase("cancelled");
      setMessage("Publish cancelled");
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } catch (err: any) {
      console.error("Failed to cancel publish:", err);
    }
  };

  // Copy diagnostics
  const handleCopyDiagnostics = async () => {
    try {
      const diagnostics = await IpcClient.getInstance().publishDiagnostics({
        publishId: publishId || undefined,
        appId,
      });
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      showSuccess("Diagnostics copied to clipboard");
    } catch (err) {
      console.error("Failed to copy diagnostics:", err);
    }
  };

  // Copy URL
  const handleCopyUrl = async () => {
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      showSuccess("URL copied to clipboard");
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  // Open URL
  const handleOpenUrl = () => {
    if (!publishedUrl) return;
    IpcClient.getInstance().openExternalUrl(publishedUrl);
  };

  // Get step status
  const getStepStatus = (
    stepPhase: PublishPhase,
  ): "pending" | "active" | "complete" | "error" => {
    const phases: PublishPhase[] = [
      "packaging",
      "uploading",
      "building",
      "deploying",
      "ready",
    ];
    const currentIndex = phases.indexOf(phase);
    const stepIndex = phases.indexOf(stepPhase);

    if (phase === "failed") {
      if (stepIndex <= currentIndex) return "error";
      return "pending";
    }

    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  const isPublishing =
    phase !== "idle" &&
    phase !== "ready" &&
    phase !== "failed" &&
    phase !== "cancelled";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Publish Live
        </CardTitle>
        <CardDescription>
          Publish your app to ABBA hosting with one click
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Idle state - show publish button */}
        {phase === "idle" && !publishedUrl && (
          <Button
            onClick={handlePublish}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Publish Live
          </Button>
        )}

        {/* Idle with previous URL */}
        {phase === "idle" && publishedUrl && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Your app is live!
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 text-sm bg-white dark:bg-gray-800 px-3 py-2 rounded border truncate">
                  {publishedUrl}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleOpenUrl}
                  title="Open in browser"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handlePublish}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Publish Update
            </Button>
          </div>
        )}

        {/* Publishing state - show progress */}
        {isPublishing && (
          <div className="space-y-4">
            <div className="space-y-3 py-2">
              <ProgressStep
                icon={<Package className="w-5 h-5" />}
                label="Packaging app"
                status={getStepStatus("packaging")}
              />
              <ProgressStep
                icon={<Upload className="w-5 h-5" />}
                label="Uploading bundle"
                status={getStepStatus("uploading")}
              />
              <ProgressStep
                icon={<Server className="w-5 h-5" />}
                label="Building for production"
                status={getStepStatus("building")}
              />
              <ProgressStep
                icon={<Globe className="w-5 h-5" />}
                label="Deploying to ABBA"
                status={getStepStatus("deploying")}
              />
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Status message */}
            {message && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                {message}
              </p>
            )}

            {/* Cancel button */}
            <Button variant="outline" onClick={handleCancel} className="w-full">
              Cancel
            </Button>

            {/* Stub indicator */}
            {isStub && (
              <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                Using local stub (no real hosting yet)
              </p>
            )}
          </div>
        )}

        {/* Ready state */}
        {phase === "ready" && publishedUrl && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Published successfully!
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 text-sm bg-white dark:bg-gray-800 px-3 py-2 rounded border truncate">
                  {publishedUrl}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleOpenUrl}
                  title="Open in browser"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={() => setPhase("idle")}
              variant="outline"
              className="w-full"
            >
              Done
            </Button>
          </div>
        )}

        {/* Failed state */}
        {phase === "failed" && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-800 dark:text-red-200">
                  Publish failed
                </span>
              </div>
              {error && (
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePublish} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={handleCopyDiagnostics}>
                <AlertCircle className="w-4 h-4 mr-2" />
                Copy Diagnostics
              </Button>
            </div>
          </div>
        )}

        {/* Cancelled state */}
        {phase === "cancelled" && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  Publish cancelled
                </span>
              </div>
            </div>
            <Button onClick={() => setPhase("idle")} className="w-full">
              Start Over
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
