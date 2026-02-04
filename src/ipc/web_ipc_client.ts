/**
 * Web IPC Client Mock
 *
 * Provides safe no-op implementations of IpcClient methods for web preview mode.
 * This allows the app to boot and render UI even without the Electron backend.
 *
 * All methods either return sensible defaults or throw a user-friendly error
 * for operations that fundamentally require the desktop backend.
 */

import { logWebPreviewWarning } from "@/lib/platform/bridge";

// Sentinel value used to indicate web preview mode
const WEB_PREVIEW_ERROR =
  "This feature requires the desktop app. Download ABBA AI for full functionality.";

/**
 * WebIpcClient provides stub implementations of all IpcClient methods.
 * This allows the app to boot and render the UI in web preview mode.
 */
export class WebIpcClient {
  private static instance: WebIpcClient;

  private constructor() {
    // Log the warning once when the mock client is created
    logWebPreviewWarning();
  }

  public static getInstance(): WebIpcClient {
    if (!WebIpcClient.instance) {
      WebIpcClient.instance = new WebIpcClient();
    }
    return WebIpcClient.instance;
  }

  // --- Profile Management (critical for boot) ---
  // Return empty/false to allow app to boot without profiles
  public async listProfiles() {
    logWebPreviewWarning("listProfiles");
    return [];
  }

  public async hasProfiles() {
    logWebPreviewWarning("hasProfiles");
    return false;
  }

  public async getActiveProfile() {
    logWebPreviewWarning("getActiveProfile");
    return null;
  }

  public async verifyProfilePin() {
    logWebPreviewWarning("verifyProfilePin");
    return { success: false, error: WEB_PREVIEW_ERROR };
  }

  public async createProfile() {
    logWebPreviewWarning("createProfile");
    throw new Error(WEB_PREVIEW_ERROR);
  }

  public async deleteProfile() {
    logWebPreviewWarning("deleteProfile");
    throw new Error(WEB_PREVIEW_ERROR);
  }

  public async logoutProfile() {
    logWebPreviewWarning("logoutProfile");
  }

  public async getProfile() {
    logWebPreviewWarning("getProfile");
    return null;
  }

  public async updateProfile() {
    logWebPreviewWarning("updateProfile");
    throw new Error(WEB_PREVIEW_ERROR);
  }

  public async changeProfilePin() {
    logWebPreviewWarning("changeProfilePin");
    return false;
  }

  // --- Settings ---
  public async getUserSettings() {
    logWebPreviewWarning("getUserSettings");
    return {};
  }

  public async setUserSettings() {
    logWebPreviewWarning("setUserSettings");
  }

  // --- Apps ---
  public async listApps() {
    logWebPreviewWarning("listApps");
    return { apps: [] };
  }

  public async getApp() {
    logWebPreviewWarning("getApp");
    throw new Error(WEB_PREVIEW_ERROR);
  }

  public async createApp() {
    logWebPreviewWarning("createApp");
    throw new Error(WEB_PREVIEW_ERROR);
  }

  public async deleteApp() {
    logWebPreviewWarning("deleteApp");
    throw new Error(WEB_PREVIEW_ERROR);
  }

  public async searchApps() {
    logWebPreviewWarning("searchApps");
    return [];
  }

  // --- Chats ---
  public async getChats() {
    logWebPreviewWarning("getChats");
    return [];
  }

  public async getChat() {
    logWebPreviewWarning("getChat");
    throw new Error(WEB_PREVIEW_ERROR);
  }

  public async createChat() {
    logWebPreviewWarning("createChat");
    throw new Error(WEB_PREVIEW_ERROR);
  }

  public async deleteChat() {
    logWebPreviewWarning("deleteChat");
    throw new Error(WEB_PREVIEW_ERROR);
  }

  public async searchChats() {
    logWebPreviewWarning("searchChats");
    return [];
  }

  // --- Streaming (no-op) ---
  public streamMessage() {
    logWebPreviewWarning("streamMessage");
  }

  public cancelStream() {
    logWebPreviewWarning("cancelStream");
  }

  public startHelpChat() {
    logWebPreviewWarning("startHelpChat");
  }

  public cancelHelpChat() {
    logWebPreviewWarning("cancelHelpChat");
  }

  // --- Event listeners (return no-op unsubscribe) ---
  public onMcpToolConsentRequest() {
    return () => {};
  }

  public respondToMcpConsentRequest() {
    logWebPreviewWarning("respondToMcpConsentRequest");
  }

  public onAgentTodosUpdate() {
    return () => {};
  }

  public onChatStreamStart() {
    return () => {};
  }

  public onChatStreamEnd() {
    return () => {};
  }

  public onAgentToolConsentRequest() {
    return () => {};
  }

  public onTelemetryEvent() {
    return () => {};
  }

  public onAgentProblemsUpdate() {
    return () => {};
  }

  public onDeepLinkReceived() {
    return () => {};
  }

  public onForceCloseDetected() {
    return () => {};
  }

  public onGitHubFlowUpdate() {
    return () => {};
  }

  public onGitHubFlowSuccess() {
    return () => {};
  }

  public onGitHubFlowError() {
    return () => {};
  }

  public onAppOutput() {
    return () => {};
  }

  // --- Language models ---
  public async getLanguageModels() {
    logWebPreviewWarning("getLanguageModels");
    return [];
  }

  public async getLanguageModelProviders() {
    logWebPreviewWarning("getLanguageModelProviders");
    return [];
  }

  public async getLanguageModelsByProviders() {
    logWebPreviewWarning("getLanguageModelsByProviders");
    return [];
  }

  // --- Templates & Themes ---
  public async getTemplates() {
    logWebPreviewWarning("getTemplates");
    return [];
  }

  public async getThemes() {
    logWebPreviewWarning("getThemes");
    return [];
  }

  // --- System Info ---
  public async getAppVersion() {
    logWebPreviewWarning("getAppVersion");
    return { version: "web-preview", environment: "production" as const };
  }

  public async getSystemDebugInfo() {
    logWebPreviewWarning("getSystemDebugInfo");
    return {
      platform: "web",
      arch: "unknown",
      nodeVersion: "N/A",
      electronVersion: "N/A",
      chromeVersion: "N/A",
      appVersion: "web-preview",
    };
  }

  public async getSystemPlatform() {
    logWebPreviewWarning("getSystemPlatform");
    return "web" as "darwin" | "win32" | "linux";
  }

  // --- Window controls (no-op in web) ---
  public async minimizeWindow() {
    logWebPreviewWarning("minimizeWindow");
  }

  public async maximizeWindow() {
    logWebPreviewWarning("maximizeWindow");
  }

  public async closeWindow() {
    logWebPreviewWarning("closeWindow");
  }

  // --- Generic invoke (for any other IPC calls) ---
  public async invoke(channel: string) {
    logWebPreviewWarning(`invoke:${channel}`);
    throw new Error(WEB_PREVIEW_ERROR);
  }

  // --- Methods that need empty returns for UI to work ---
  public async getContextPaths() {
    logWebPreviewWarning("getContextPaths");
    return { paths: [] };
  }

  public async listPrompts() {
    logWebPreviewWarning("listPrompts");
    return [];
  }

  public async getMcpServers() {
    logWebPreviewWarning("getMcpServers");
    return [];
  }

  public async getMcpTools() {
    logWebPreviewWarning("getMcpTools");
    return [];
  }

  public async getAgentTools() {
    logWebPreviewWarning("getAgentTools");
    return [];
  }

  public async getUserBudget() {
    logWebPreviewWarning("getUserBudget");
    return null;
  }

  public async nodeJsStatus() {
    logWebPreviewWarning("nodeJsStatus");
    return { installed: false, version: null };
  }

  // --- Admin/Vault/Publish ---
  public async getAdminConfigStatus() {
    logWebPreviewWarning("getAdminConfigStatus");
    return { configured: false };
  }

  public async vaultGetStatus() {
    logWebPreviewWarning("vaultGetStatus");
    return { connected: false };
  }

  public async vaultAuthStatus() {
    logWebPreviewWarning("vaultAuthStatus");
    return { authenticated: false };
  }

  // --- GitHub/Vercel/Supabase (return disconnected state) ---
  public async listGitHubRepos() {
    logWebPreviewWarning("listGitHubRepos");
    return [];
  }

  public async listVercelProjects() {
    logWebPreviewWarning("listVercelProjects");
    return [];
  }

  public async listSupabaseOrganizations() {
    logWebPreviewWarning("listSupabaseOrganizations");
    return [];
  }

  // For any method not explicitly stubbed, provide a catch-all that
  // allows property access without throwing, returning a stub function
}

// Type assertion to make WebIpcClient compatible with IpcClient interface
// This allows it to be used as a drop-in replacement
export type IpcClientInterface =
  | WebIpcClient
  | import("./ipc_client").IpcClient;
