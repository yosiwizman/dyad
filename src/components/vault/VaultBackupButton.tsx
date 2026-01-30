import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, Loader2, Copy, AlertTriangle } from "lucide-react";
import { IpcClient } from "@/ipc/ipc_client";
import { showSuccess, showError, showWarning } from "@/lib/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { VaultAuth } from "./VaultAuth";

/**
 * Check if an error is an auth-related error
 */
function isAuthError(error: Error): boolean {
  const message = error.message?.toLowerCase() || "";
  return (
    message.includes("401") ||
    message.includes("expired") ||
    (message.includes("invalid") && message.includes("token")) ||
    message.includes("unauthorized") ||
    message.includes("not authenticated") ||
    message.includes("session")
  );
}

/**
 * Check if an error is a network-related error
 */
function isNetworkError(error: Error): boolean {
  const message = error.message?.toLowerCase() || "";
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("enotfound") ||
    message.includes("timeout") ||
    message.includes("cannot reach")
  );
}

interface VaultBackupButtonProps {
  appId: number;
  appName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function VaultBackupButton({
  appId,
  appName,
  variant = "outline",
  size = "sm",
}: VaultBackupButtonProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  /**
   * Copy vault diagnostics to clipboard for support
   */
  const handleCopyDiagnostics = useCallback(async () => {
    try {
      const ipcClient = IpcClient.getInstance();
      const diagnostics = await ipcClient.invoke<any>("vault:get-diagnostics");
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      showSuccess("Diagnostics copied to clipboard");
    } catch (err) {
      console.error("Failed to copy diagnostics:", err);
      showError("Failed to copy diagnostics");
    }
  }, []);

  /**
   * Attempt to refresh vault session
   */
  const attemptRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const ipcClient = IpcClient.getInstance();
      const result = await ipcClient.invoke<{
        success: boolean;
        error?: string;
      }>("vault:auth-refresh");
      return result.success;
    } catch (err) {
      console.error("Session refresh failed:", err);
      return false;
    }
  }, []);

  /**
   * Perform backup with automatic retry on auth errors
   */
  const performBackupWithRetry = useCallback(
    async (appIdParam: number, notesParam?: string) => {
      const ipcClient = IpcClient.getInstance();

      try {
        await ipcClient.invoke<void>("vault:create-backup", {
          appId: appIdParam,
          notes: notesParam,
        });
        return { success: true };
      } catch (error) {
        if (error instanceof Error && isAuthError(error)) {
          // Try to refresh the session
          console.log("Auth error detected, attempting session refresh...");
          setIsRetrying(true);

          const refreshed = await attemptRefresh();
          if (refreshed) {
            // Retry the backup once
            console.log("Session refreshed, retrying backup...");
            showWarning("Session refreshed, retrying...");
            try {
              await ipcClient.invoke<void>("vault:create-backup", {
                appId: appIdParam,
                notes: notesParam,
              });
              setIsRetrying(false);
              return { success: true };
            } catch (retryError) {
              setIsRetrying(false);
              throw retryError;
            }
          } else {
            // Refresh failed, show auth dialog
            setIsRetrying(false);
            setAuthError(
              "Your Vault session has expired. Please sign in again.",
            );
            setShowAuthDialog(true);
            return { success: false, needsAuth: true };
          }
        }
        throw error;
      }
    },
    [attemptRefresh],
  );

  const backupMutation = useMutation({
    mutationFn: async ({ appId, notes }: { appId: number; notes?: string }) => {
      const result = await performBackupWithRetry(appId, notes);
      if (!result.success && result.needsAuth) {
        // Don't treat as mutation error - we're showing auth dialog
        return;
      }
    },
    onSuccess: () => {
      // Only show success if we actually completed the backup
      if (!showAuthDialog) {
        showSuccess(`Backup created for "${appName}"`);
        queryClient.invalidateQueries({ queryKey: ["vault-backups"] });
        setIsDialogOpen(false);
        setNotes("");
      }
    },
    onError: (error: Error) => {
      // Categorize errors for better UX
      if (isAuthError(error)) {
        // Should have been handled by retry logic, but just in case
        setAuthError("Session expired. Please sign in to Vault.");
        setShowAuthDialog(true);
      } else if (isNetworkError(error)) {
        showError("Cannot reach Vault. Please check your internet connection.");
      } else {
        showError(error.message || "Failed to create backup");
      }
    },
  });

  const handleBackup = () => {
    setAuthError(null);
    backupMutation.mutate({ appId, notes: notes || undefined });
  };

  /**
   * Called after successful sign-in from auth dialog
   */
  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    setAuthError(null);
    // Retry the backup
    showSuccess("Signed in successfully. Retrying backup...");
    backupMutation.mutate({ appId, notes: notes || undefined });
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center gap-2"
      >
        <CloudUpload className="h-4 w-4" />
        Backup to Vault
      </Button>

      {/* Main backup dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Backup to Vault</DialogTitle>
            <DialogDescription>
              Create a cloud backup of "{appName}" to Vault. You can restore
              this backup later.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="e.g., Before major refactor..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={backupMutation.isPending || isRetrying}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={backupMutation.isPending || isRetrying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBackup}
              disabled={backupMutation.isPending || isRetrying}
              className="flex items-center gap-2"
            >
              {backupMutation.isPending || isRetrying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isRetrying ? "Retrying..." : "Backing up..."}
                </>
              ) : (
                <>
                  <CloudUpload className="h-4 w-4" />
                  Create Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth error dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Vault Session Expired
            </DialogTitle>
            <DialogDescription>
              {authError ||
                "Your Vault session has expired. Please sign in again to continue."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <VaultAuth onAuthSuccess={handleAuthSuccess} compact />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyDiagnostics}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Diagnostics
            </Button>
            <Button variant="ghost" onClick={() => setShowAuthDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
