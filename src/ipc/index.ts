/**
 * IPC Client Entry Point
 *
 * This module provides a unified entry point for IPC client access.
 * It automatically detects the runtime environment and returns either:
 * - IpcClient: Full Electron IPC client for desktop app
 * - WebIpcClient: Stub implementation for web preview mode
 *
 * Usage:
 *   import { getIpcClient } from "@/ipc";
 *   const ipc = getIpcClient();
 *   await ipc.listApps();
 */

import { isDesktopRuntime } from "@/lib/platform/bridge";
import { WebIpcClient } from "./web_ipc_client";

// Lazy-loaded IpcClient to avoid importing Electron code in web builds
let cachedClient: any = null;

/**
 * Get the appropriate IPC client for the current runtime environment.
 *
 * - In desktop (Electron) environment: Returns the full IpcClient
 * - In web preview (browser) environment: Returns the WebIpcClient stub
 *
 * This function is safe to call in any environment and will never throw
 * due to missing Electron APIs.
 */
export function getIpcClient() {
  if (cachedClient) {
    return cachedClient;
  }

  if (isDesktopRuntime()) {
    // Dynamically import the real IpcClient only when in desktop mode
    // This ensures the Electron import doesn't crash in browser
    const { IpcClient } = require("./ipc_client");
    cachedClient = IpcClient.getInstance();
  } else {
    cachedClient = WebIpcClient.getInstance();
  }

  return cachedClient;
}

// Re-export types for convenience
export type { IpcClientInterface } from "./web_ipc_client";
export { WebIpcClient } from "./web_ipc_client";
