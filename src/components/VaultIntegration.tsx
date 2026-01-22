import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Shield } from "lucide-react";
import { IpcClient } from "@/ipc/ipc_client";
import { showSuccess, showError } from "@/lib/toast";
import { useQuery } from "@tanstack/react-query";
import { VaultBackupList } from "./vault/VaultBackupList";

interface VaultStatus {
  isAuthenticated: boolean;
  organizationName?: string;
}

interface VaultConfig {
  url: string;
  configured: boolean;
}

export function VaultIntegration() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get vault status
  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery<VaultStatus>({
    queryKey: ["vault-status"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return (ipcClient as any).invoke("vault:get-status");
    },
  });

  // Get vault config
  const { data: config } = useQuery<VaultConfig>({
    queryKey: ["vault-config"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return (ipcClient as any).invoke("vault:get-config");
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchStatus();
      showSuccess("Vault status refreshed");
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to refresh status"
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading Vault status...
      </div>
    );
  }

  // Check if Vault is configured
  if (!config?.configured) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Vault (Cloud Backup)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cloud backup and restore for your ABBA AI projects.
            </p>
          </div>
        </div>
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Vault is not configured. Contact your administrator to set up cloud
            backup.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!status?.isAuthenticated) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Vault (Cloud Backup)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cloud backup and restore for your ABBA AI projects.
            </p>
          </div>
        </div>
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Connect to Supabase above to enable Vault cloud backup.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            Vault (Cloud Backup)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Connected via {status.organizationName || "Supabase"}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Backup List */}
      <div className="mt-4">
        <VaultBackupList />
      </div>
    </div>
  );
}
