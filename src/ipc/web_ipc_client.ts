/**
 * Web IPC Client Mock
 *
 * Provides safe no-op implementations of IpcClient methods for web preview mode.
 * This allows the app to boot and render UI even without the Electron backend.
 *
 * In demo mode, profile and role data are persisted to localStorage to enable
 * testing of onboarding, navigation, and RBAC functionality.
 *
 * localStorage Keys Used:
 * - abba_demo_profiles: Array of ProfileSummary objects
 * - abba_demo_active_profile: ActiveProfileSession object or null
 * - abba_demo_role: "admin" | "child" for demo role override
 * - abba_demo_settings: User settings object
 */

import { logWebPreviewWarning } from "@/lib/platform/bridge";
import type { UserSettings } from "@/lib/schemas";
import { createDefaultUserSettings } from "@/lib/settings/defaults";
import { mergeProviderSettings } from "@/lib/ai/providers/defaults";
import { authorizeAdminAccess } from "@/lib/rbac/authorization";
import type {
  ProfileSummary,
  CreateProfileInput,
  ActiveProfileSession,
} from "@/profiles/profile_types";

// localStorage keys for demo mode persistence
export const DEMO_STORAGE_KEYS = {
  PROFILES: "abba_demo_profiles",
  ACTIVE_PROFILE: "abba_demo_active_profile",
  ROLE: "abba_demo_role",
  SETTINGS: "abba_demo_settings",
} as const;

// Sentinel value used to indicate web preview mode
const WEB_PREVIEW_ERROR =
  "This feature requires the desktop app. Download ABBA AI for full functionality.";

/**
 * Safe localStorage helper with JSON serialization.
 */
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined" || !window.localStorage) {
    return defaultValue;
  }
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("[WebIpcClient] Failed to write to localStorage:", e);
  }
}

function normalizeUserSettings(raw: unknown): UserSettings {
  const defaults = createDefaultUserSettings();

  if (!raw || typeof raw !== "object") {
    return defaults;
  }

  const partial = raw as Partial<UserSettings>;

  return {
    ...defaults,
    ...partial,
    providerSettings: mergeProviderSettings(partial.providerSettings),
  };
}

/**
 * Clear all demo data from localStorage.
 */
export function clearDemoData(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  Object.values(DEMO_STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
  console.log("[WebIpcClient] Demo data cleared");
}

/**
 * Generate a UUID v4 for profile IDs.
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

  // --- Profile Management (localStorage-backed for demo mode) ---
  public async listProfiles(): Promise<ProfileSummary[]> {
    logWebPreviewWarning("listProfiles");
    return getStorageItem<ProfileSummary[]>(DEMO_STORAGE_KEYS.PROFILES, []);
  }

  public async hasProfiles(): Promise<boolean> {
    logWebPreviewWarning("hasProfiles");
    const profiles = getStorageItem<ProfileSummary[]>(
      DEMO_STORAGE_KEYS.PROFILES,
      [],
    );
    return profiles.length > 0;
  }

  public async getActiveProfile(): Promise<ActiveProfileSession | null> {
    logWebPreviewWarning("getActiveProfile");
    return getStorageItem<ActiveProfileSession | null>(
      DEMO_STORAGE_KEYS.ACTIVE_PROFILE,
      null,
    );
  }

  public async verifyProfilePin(
    profileId: string,
    pin: string,
  ): Promise<{ success: boolean; session?: ActiveProfileSession }> {
    logWebPreviewWarning("verifyProfilePin");
    const profiles = getStorageItem<ProfileSummary[]>(
      DEMO_STORAGE_KEYS.PROFILES,
      [],
    );
    const profile = profiles.find((p) => p.id === profileId);

    if (!profile) {
      return { success: false };
    }

    // In demo mode, any 4+ digit PIN works
    if (pin.length >= 4) {
      const session: ActiveProfileSession = {
        profileId: profile.id,
        profileName: profile.name,
        isAdmin: profile.isAdmin ?? false,
        loginAt: new Date(),
      };
      setStorageItem(DEMO_STORAGE_KEYS.ACTIVE_PROFILE, session);
      return { success: true, session };
    }

    return { success: false };
  }

  public async createProfile(
    input: CreateProfileInput,
  ): Promise<ProfileSummary> {
    logWebPreviewWarning("createProfile");

    const profiles = getStorageItem<ProfileSummary[]>(
      DEMO_STORAGE_KEYS.PROFILES,
      [],
    );

    // Create the new profile
    const newProfile: ProfileSummary = {
      id: generateUUID(),
      name: input.name,
      isAdmin: input.isAdmin ?? false,
      avatarColor: input.avatarColor ?? "#8B5CF6",
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    profiles.push(newProfile);
    setStorageItem(DEMO_STORAGE_KEYS.PROFILES, profiles);

    console.log("[WebIpcClient] Created demo profile:", newProfile.name);
    return newProfile;
  }

  public async deleteProfile(profileId: string): Promise<void> {
    logWebPreviewWarning("deleteProfile");
    const profiles = getStorageItem<ProfileSummary[]>(
      DEMO_STORAGE_KEYS.PROFILES,
      [],
    );
    const filtered = profiles.filter((p) => p.id !== profileId);
    setStorageItem(DEMO_STORAGE_KEYS.PROFILES, filtered);

    // If deleting the active profile, clear session
    const activeProfile = getStorageItem<ActiveProfileSession | null>(
      DEMO_STORAGE_KEYS.ACTIVE_PROFILE,
      null,
    );
    if (activeProfile?.profileId === profileId) {
      setStorageItem(DEMO_STORAGE_KEYS.ACTIVE_PROFILE, null);
    }
  }

  public async logoutProfile(): Promise<void> {
    logWebPreviewWarning("logoutProfile");
    setStorageItem(DEMO_STORAGE_KEYS.ACTIVE_PROFILE, null);
  }

  public async getProfile(profileId: string): Promise<ProfileSummary | null> {
    logWebPreviewWarning("getProfile");
    const profiles = getStorageItem<ProfileSummary[]>(
      DEMO_STORAGE_KEYS.PROFILES,
      [],
    );
    return profiles.find((p) => p.id === profileId) ?? null;
  }

  public async updateProfile(
    profileId: string,
    updates: { name?: string; avatarColor?: string },
  ): Promise<ProfileSummary> {
    logWebPreviewWarning("updateProfile");
    const profiles = getStorageItem<ProfileSummary[]>(
      DEMO_STORAGE_KEYS.PROFILES,
      [],
    );
    const index = profiles.findIndex((p) => p.id === profileId);
    if (index === -1) {
      throw new Error("Profile not found");
    }
    const updated = { ...profiles[index], ...updates };
    profiles[index] = updated;
    setStorageItem(DEMO_STORAGE_KEYS.PROFILES, profiles);
    return updated;
  }

  public async changeProfilePin(): Promise<boolean> {
    logWebPreviewWarning("changeProfilePin");
    // In demo mode, PIN changes always "succeed"
    return true;
  }

  // --- Settings ---
  public async getUserSettings(): Promise<UserSettings> {
    logWebPreviewWarning("getUserSettings");

    const stored = getStorageItem<unknown>(DEMO_STORAGE_KEYS.SETTINGS, null);
    return normalizeUserSettings(stored);
  }

  public async setUserSettings(
    updates: Partial<UserSettings> = {},
  ): Promise<UserSettings> {
    logWebPreviewWarning("setUserSettings");

    const current = await this.getUserSettings();

    const nextProviderSettings = mergeProviderSettings({
      ...current.providerSettings,
      ...updates.providerSettings,
    });

    const next = normalizeUserSettings({
      ...current,
      ...updates,
      providerSettings: nextProviderSettings,
    });

    // Persist only when the UI writes settings.
    setStorageItem(DEMO_STORAGE_KEYS.SETTINGS, next);
    return next;
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
  public async getAppVersion(): Promise<string> {
    logWebPreviewWarning("getAppVersion");
    // Keep contract parity with the desktop IpcClient: return a string version.
    return "web-preview";
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

  // --- MCP Server Management (stubs for web preview) ---
  public async listMcpServers() {
    logWebPreviewWarning("listMcpServers");
    return [];
  }

  public async createMcpServer() {
    logWebPreviewWarning("createMcpServer");
    return { id: 0 };
  }

  public async updateMcpServer() {
    logWebPreviewWarning("updateMcpServer");
  }

  public async deleteMcpServer() {
    logWebPreviewWarning("deleteMcpServer");
  }

  public async listMcpTools() {
    logWebPreviewWarning("listMcpTools");
    return [];
  }

  public async getMcpToolConsents() {
    logWebPreviewWarning("getMcpToolConsents");
    return [];
  }

  public async setMcpToolConsent() {
    logWebPreviewWarning("setMcpToolConsent");
  }

  // --- Agent Tool Methods ---
  public async setAgentToolConsent() {
    logWebPreviewWarning("setAgentToolConsent");
  }

  public respondToAgentConsentRequest() {
    logWebPreviewWarning("respondToAgentConsentRequest");
  }

  // --- GitHub Methods (stubs) ---
  public startGithubDeviceFlow() {
    logWebPreviewWarning("startGithubDeviceFlow");
  }

  public onGithubDeviceFlowUpdate() {
    return () => {};
  }

  public onGithubDeviceFlowSuccess() {
    return () => {};
  }

  public onGithubDeviceFlowError() {
    return () => {};
  }

  public async getGithubUserLogin() {
    logWebPreviewWarning("getGithubUserLogin");
    return null;
  }

  public async listGithubRepos() {
    logWebPreviewWarning("listGithubRepos");
    return [];
  }

  public async getGithubRepoBranches() {
    logWebPreviewWarning("getGithubRepoBranches");
    return [];
  }

  public async getGithubState() {
    logWebPreviewWarning("getGithubState");
    return null;
  }

  public async checkGithubRepoAvailable() {
    logWebPreviewWarning("checkGithubRepoAvailable");
    return { available: false };
  }

  // --- Vercel Methods (stubs) ---
  public async testVercelConnection() {
    logWebPreviewWarning("testVercelConnection");
    return { connected: false };
  }

  public async getVercelDeployments() {
    logWebPreviewWarning("getVercelDeployments");
    return [];
  }

  // --- App Management Methods ---
  public async runApp() {
    logWebPreviewWarning("runApp");
  }

  public async stopApp() {
    logWebPreviewWarning("stopApp");
  }

  public async restartApp() {
    logWebPreviewWarning("restartApp");
  }

  public async addAppToFavorite() {
    logWebPreviewWarning("addAppToFavorite");
  }

  public async renameApp() {
    logWebPreviewWarning("renameApp");
  }

  public async getAppEnvVars() {
    logWebPreviewWarning("getAppEnvVars");
    return {};
  }

  public async setAppEnvVars() {
    logWebPreviewWarning("setAppEnvVars");
  }

  public async listVersions() {
    logWebPreviewWarning("listVersions");
    return [];
  }

  public async getCurrentBranch() {
    logWebPreviewWarning("getCurrentBranch");
    return null;
  }

  public async getAppUpgrades() {
    logWebPreviewWarning("getAppUpgrades");
    return [];
  }

  public async getAppTheme() {
    logWebPreviewWarning("getAppTheme");
    return null;
  }

  public async setAppTheme() {
    logWebPreviewWarning("setAppTheme");
  }

  public async isCapacitor() {
    logWebPreviewWarning("isCapacitor");
    return false;
  }

  // --- Chat Methods ---
  public async updateChat() {
    logWebPreviewWarning("updateChat");
  }

  public async deleteMessages() {
    logWebPreviewWarning("deleteMessages");
  }

  public cancelChatStream() {
    logWebPreviewWarning("cancelChatStream");
  }

  // --- Other commonly used methods ---
  public async countTokens() {
    logWebPreviewWarning("countTokens");
    return { count: 0 };
  }

  public async getProposal() {
    logWebPreviewWarning("getProposal");
    return null;
  }

  public async approveProposal() {
    logWebPreviewWarning("approveProposal");
  }

  public async rejectProposal() {
    logWebPreviewWarning("rejectProposal");
  }

  public async openExternalUrl() {
    logWebPreviewWarning("openExternalUrl");
  }

  public async showItemInFolder() {
    logWebPreviewWarning("showItemInFolder");
  }

  public async getNodejsStatus() {
    logWebPreviewWarning("getNodejsStatus");
    return { installed: false, version: null };
  }

  public async getNodePath() {
    logWebPreviewWarning("getNodePath");
    return null;
  }

  public async doesReleaseNoteExist() {
    logWebPreviewWarning("doesReleaseNoteExist");
    return false;
  }

  public async getChatContextResults() {
    logWebPreviewWarning("getChatContextResults");
    return [];
  }

  public async readAppFile() {
    logWebPreviewWarning("readAppFile");
    return null;
  }

  public async searchAppFiles() {
    logWebPreviewWarning("searchAppFiles");
    return [];
  }

  public async checkAiRules() {
    logWebPreviewWarning("checkAiRules");
    return { hasRules: false };
  }

  public async takeScreenshot() {
    logWebPreviewWarning("takeScreenshot");
    return null;
  }

  public async getChatLogs() {
    logWebPreviewWarning("getChatLogs");
    return [];
  }

  public addLog() {
    logWebPreviewWarning("addLog");
  }

  public async clearLogs() {
    logWebPreviewWarning("clearLogs");
  }

  public async listLocalOllamaModels() {
    logWebPreviewWarning("listLocalOllamaModels");
    return [];
  }

  public async listLocalLMStudioModels() {
    logWebPreviewWarning("listLocalLMStudioModels");
    return [];
  }

// --- Admin Methods ---
  // Admin methods enforce authorization at the boundary.
  // Even in web preview, we check the demo role to demonstrate
  // proper RBAC enforcement patterns.

  public async adminGetConfigStatus() {
    logWebPreviewWarning("adminGetConfigStatus");
    const authResult = authorizeAdminAccess(getDemoRole());
    if (!authResult.ok) {
      console.log(
        `[WebIpcClient] adminGetConfigStatus blocked: ${authResult.reasonCode}`,
      );
      // In web preview, we still return mock data for demo purposes
      // In production, this would return the error
    }
    return { configured: false };
  }

  public async adminGetDiagnostics() {
    logWebPreviewWarning("adminGetDiagnostics");
    const authResult = authorizeAdminAccess(getDemoRole());
    if (!authResult.ok) {
      console.log(
        `[WebIpcClient] adminGetDiagnostics blocked: ${authResult.reasonCode}`,
      );
      // Return 403-style response in demo mode to show the pattern
      return {
        ...authResult,
        broker: null,
        vault: null,
      };
    }
    return {};
  }

  // --- Environment Variables ---
  public async getEnvVars(): Promise<Record<string, string | undefined>> {
    logWebPreviewWarning("getEnvVars");
    // Return minimal env vars indicating web preview mode
    return {
      VITE_WEB_PREVIEW: "true",
    };
  }

  // --- Publish Methods ---
  public async publishStart() {
    logWebPreviewWarning("publishStart");
  }

  public async publishStatus() {
    logWebPreviewWarning("publishStatus");
    return null;
  }

  public async publishCancel() {
    logWebPreviewWarning("publishCancel");
  }

  public async publishDiagnostics() {
    logWebPreviewWarning("publishDiagnostics");
    return {};
  }
}

// Type assertion to make WebIpcClient compatible with IpcClient interface
// This allows it to be used as a drop-in replacement
export type IpcClientInterface =
  | WebIpcClient
  | import("./ipc_client").IpcClient;

// --- Demo Role Helpers ---
import type { Role } from "@/lib/rbac/types";

/**
 * Get the demo role override from localStorage.
 * Returns null if no override is set.
 */
export function getDemoRole(): Role | null {
  const role = getStorageItem<string | null>(DEMO_STORAGE_KEYS.ROLE, null);
  if (role === "admin" || role === "child") {
    return role;
  }
  return null;
}

/**
 * Set the demo role override in localStorage.
 * Pass null to clear the override.
 */
export function setDemoRole(role: Role | null): void {
  if (role === null) {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(DEMO_STORAGE_KEYS.ROLE);
    }
  } else {
    setStorageItem(DEMO_STORAGE_KEYS.ROLE, role);
  }
  console.log("[WebIpcClient] Demo role set to:", role);
}
