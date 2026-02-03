/**
 * Admin Diagnostics Page
 *
 * View system diagnostics, broker status, and debug information.
 * Integrates with the existing AdminConfigPanel diagnostic features.
 */

import {
  Bug,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RequireAdmin } from "@/components/rbac";
import { IpcClient } from "@/ipc/ipc_client";

interface DiagnosticsData {
  broker: {
    brokerUrl: string | null;
    hasDeviceToken: boolean;
    isEnabled: boolean;
    configSource: string;
  };
  vault: {
    url: string | null;
    hasAnonKey: boolean;
    hasSession: boolean;
    sessionExpiresAt: string | null;
    envDefaultsAvailable: boolean;
  };
  timestamp: string;
}

export default function AdminDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const ipc = IpcClient.getInstance();
      const data = await ipc.adminGetDiagnostics();
      setDiagnostics(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch diagnostics",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <RequireAdmin>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Bug className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Diagnostics</h1>
              <p className="text-muted-foreground">
                System status and broker diagnostics
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={fetchDiagnostics}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-6">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        )}

        {diagnostics && (
          <div className="space-y-6">
            {/* Broker Configuration */}
            <section className="rounded-lg border p-4">
              <h2 className="font-semibold mb-4">Broker Configuration</h2>
              <div className="grid gap-3">
                <DiagnosticRow
                  label="Broker URL"
                  value={diagnostics.broker.brokerUrl || "Not configured"}
                  status={diagnostics.broker.brokerUrl ? "success" : "warning"}
                />
                <DiagnosticRow
                  label="Config Source"
                  value={diagnostics.broker.configSource}
                />
                <DiagnosticRow
                  label="Token Configured"
                  value={diagnostics.broker.hasDeviceToken ? "Yes" : "No"}
                  status={
                    diagnostics.broker.hasDeviceToken ? "success" : "error"
                  }
                />
                <DiagnosticRow
                  label="Broker Enabled"
                  value={diagnostics.broker.isEnabled ? "Yes" : "No"}
                  status={diagnostics.broker.isEnabled ? "success" : "neutral"}
                />
              </div>
            </section>

            {/* Vault Status */}
            <section className="rounded-lg border p-4">
              <h2 className="font-semibold mb-4">Vault Status</h2>
              <div className="grid gap-3">
                <DiagnosticRow
                  label="Vault URL"
                  value={diagnostics.vault.url || "Not configured"}
                  status={diagnostics.vault.url ? "success" : "warning"}
                />
                <DiagnosticRow
                  label="Has Anon Key"
                  value={diagnostics.vault.hasAnonKey ? "Yes" : "No"}
                  status={diagnostics.vault.hasAnonKey ? "success" : "neutral"}
                />
                <DiagnosticRow
                  label="Has Session"
                  value={diagnostics.vault.hasSession ? "Yes" : "No"}
                  status={diagnostics.vault.hasSession ? "success" : "neutral"}
                />
                {diagnostics.vault.sessionExpiresAt && (
                  <DiagnosticRow
                    label="Session Expires"
                    value={new Date(
                      diagnostics.vault.sessionExpiresAt,
                    ).toLocaleString()}
                  />
                )}
              </div>
            </section>

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground text-center">
              Last updated: {new Date(diagnostics.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </RequireAdmin>
  );
}

interface DiagnosticRowProps {
  label: string;
  value: string;
  status?: "success" | "warning" | "error" | "neutral";
  mono?: boolean;
}

function DiagnosticRow({
  label,
  value,
  status = "neutral",
  mono,
}: DiagnosticRowProps) {
  const statusIcon = {
    success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
    error: <XCircle className="h-4 w-4 text-destructive" />,
    neutral: null,
  };

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {statusIcon[status]}
        <span className={mono ? "font-mono text-sm" : ""}>{value}</span>
      </div>
    </div>
  );
}
