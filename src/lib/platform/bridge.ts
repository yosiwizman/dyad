/**
 * Platform Bridge Module
 *
 * Provides runtime detection and a unified interface for platform-specific
 * functionality. This allows the web preview to safely boot without crashing
 * when desktop IPC is unavailable.
 */

/**
 * Detect if running in a desktop (Electron) environment.
 *
 * Returns true if window.electron.ipcRenderer is available.
 * Returns false in web browsers, including GitHub Pages preview.
 */
export function isDesktopRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const electron = (window as any).electron;
  return !!(
    electron &&
    typeof electron === "object" &&
    electron.ipcRenderer &&
    typeof electron.ipcRenderer.invoke === "function"
  );
}

/**
 * Detect if running in web preview mode.
 *
 * Web preview is detected by:
 * 1. VITE_WEB_PREVIEW env var set to "true", OR
 * 2. Hostname ending in .github.io
 */
export function isWebPreviewMode(): boolean {
  // Check environment variable first (set at build time)
  // @ts-ignore - Vite injects this at build time
  if (import.meta.env?.VITE_WEB_PREVIEW === "true") {
    return true;
  }

  // Fallback: check hostname for GitHub Pages
  if (typeof window !== "undefined" && window.location?.hostname) {
    return window.location.hostname.endsWith(".github.io");
  }

  return false;
}

// Track whether we've shown the web preview warning
let hasShownWebPreviewWarning = false;

/**
 * Show a one-time console warning for web preview mode.
 * This is called when IPC operations are attempted in web preview.
 */
export function logWebPreviewWarning(operation?: string): void {
  if (!hasShownWebPreviewWarning) {
    console.warn(
      "[ABBA AI] Running in Web Preview Mode. Desktop backend features are unavailable.",
    );
    hasShownWebPreviewWarning = true;
  }
  if (operation) {
    console.debug(`[Web Preview] Stubbed operation: ${operation}`);
  }
}
