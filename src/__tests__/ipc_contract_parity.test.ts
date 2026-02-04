import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * IPC Contract Parity Tests
 *
 * These tests ensure WebIpcClient implements all methods that the UI code
 * might call via IpcClient.getInstance(). This prevents runtime errors
 * like "X is not a function" in web preview mode.
 *
 * When adding new IPC methods to IpcClient, if a test here fails,
 * you must also add a stub implementation to WebIpcClient.
 */

/**
 * Critical IPC methods that must exist on WebIpcClient for the app to function.
 * These are methods called during normal navigation and rendering.
 * Add new methods here as they are used in the UI.
 */
const REQUIRED_IPC_METHODS = [
  // Profile management
  "listProfiles",
  "hasProfiles",
  "getActiveProfile",
  "verifyProfilePin",
  "createProfile",
  "deleteProfile",
  "logoutProfile",
  "getProfile",
  "updateProfile",
  "changeProfilePin",

  // Settings
  "getUserSettings",
  "setUserSettings",

  // Apps
  "listApps",
  "getApp",
  "createApp",
  "deleteApp",
  "searchApps",
  "runApp",
  "stopApp",
  "restartApp",
  "addAppToFavorite",
  "renameApp",
  "getAppEnvVars",
  "setAppEnvVars",
  "getAppUpgrades",
  "getAppTheme",
  "setAppTheme",
  "isCapacitor",

  // Chats
  "getChats",
  "getChat",
  "createChat",
  "deleteChat",
  "searchChats",
  "updateChat",
  "deleteMessages",

  // Streaming
  "streamMessage",
  "cancelStream",
  "cancelChatStream",
  "startHelpChat",
  "cancelHelpChat",

  // MCP (Model Context Protocol)
  "listMcpServers",
  "createMcpServer",
  "updateMcpServer",
  "deleteMcpServer",
  "listMcpTools",
  "getMcpToolConsents",
  "setMcpToolConsent",
  "onMcpToolConsentRequest",
  "respondToMcpConsentRequest",

  // Agent tools
  "getAgentTools",
  "setAgentToolConsent",
  "onAgentToolConsentRequest",
  "respondToAgentConsentRequest",
  "onAgentTodosUpdate",
  "onAgentProblemsUpdate",

  // Event listeners
  "onChatStreamStart",
  "onChatStreamEnd",
  "onTelemetryEvent",
  "onDeepLinkReceived",
  "onForceCloseDetected",
  "onAppOutput",

  // GitHub
  "startGithubDeviceFlow",
  "onGithubDeviceFlowUpdate",
  "onGithubDeviceFlowSuccess",
  "onGithubDeviceFlowError",
  "getGithubUserLogin",
  "listGithubRepos",
  "getGithubRepoBranches",
  "getGithubState",
  "checkGithubRepoAvailable",
  "onGitHubFlowUpdate",
  "onGitHubFlowSuccess",
  "onGitHubFlowError",

  // Vercel
  "listVercelProjects",
  "testVercelConnection",
  "getVercelDeployments",

  // Supabase
  "listSupabaseOrganizations",

  // Language models
  "getLanguageModels",
  "getLanguageModelProviders",
  "getLanguageModelsByProviders",

  // Templates & Themes
  "getTemplates",
  "getThemes",

  // System info
  "getAppVersion",
  "getSystemDebugInfo",
  "getSystemPlatform",
  "getNodejsStatus",
  "getNodePath",
  "nodeJsStatus",

  // Window controls
  "minimizeWindow",
  "maximizeWindow",
  "closeWindow",

  // Misc UI methods
  "getContextPaths",
  "listPrompts",
  "getUserBudget",
  "countTokens",
  "getProposal",
  "approveProposal",
  "rejectProposal",
  "openExternalUrl",
  "showItemInFolder",
  "doesReleaseNoteExist",
  "getChatContextResults",
  "readAppFile",
  "searchAppFiles",
  "checkAiRules",
  "takeScreenshot",
  "getChatLogs",
  "addLog",
  "clearLogs",
  "listLocalOllamaModels",
  "listLocalLMStudioModels",
  "listVersions",
  "getCurrentBranch",

  // Admin
  "getAdminConfigStatus",
  "adminGetConfigStatus",
  "adminGetDiagnostics",
  "vaultGetStatus",
  "vaultAuthStatus",

  // Publish
  "publishStart",
  "publishStatus",
  "publishCancel",
  "publishDiagnostics",

  // Generic
  "invoke",
];

describe("IPC contract parity", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it("WebIpcClient should implement all required IPC methods", async () => {
    global.window = {
      location: { hostname: "localhost" },
      localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    } as any;

    const { WebIpcClient } = await import("../ipc/web_ipc_client");
    const client = WebIpcClient.getInstance();

    const missingMethods: string[] = [];

    for (const methodName of REQUIRED_IPC_METHODS) {
      if (typeof (client as any)[methodName] !== "function") {
        missingMethods.push(methodName);
      }
    }

    if (missingMethods.length > 0) {
      throw new Error(
        `WebIpcClient is missing the following methods that are required for web preview:\n` +
          `  ${missingMethods.join(", ")}\n\n` +
          `Add stub implementations to src/ipc/web_ipc_client.ts for these methods.`,
      );
    }

    expect(missingMethods).toHaveLength(0);
  });

  describe("MCP method regression tests", () => {
    it("getMcpToolConsents should return an empty array", async () => {
      global.window = {
        location: { hostname: "localhost" },
        localStorage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        },
      } as any;

      const { WebIpcClient } = await import("../ipc/web_ipc_client");
      const client = WebIpcClient.getInstance();

      const consents = await client.getMcpToolConsents();
      expect(consents).toEqual([]);
    });

    it("listMcpServers should return an empty array", async () => {
      global.window = {
        location: { hostname: "localhost" },
      } as any;

      const { WebIpcClient } = await import("../ipc/web_ipc_client");
      const client = WebIpcClient.getInstance();

      const servers = await client.listMcpServers();
      expect(servers).toEqual([]);
    });

    it("listMcpTools should return an empty array", async () => {
      global.window = {
        location: { hostname: "localhost" },
      } as any;

      const { WebIpcClient } = await import("../ipc/web_ipc_client");
      const client = WebIpcClient.getInstance();

      const tools = await client.listMcpTools();
      expect(tools).toEqual([]);
    });

    it("setMcpToolConsent should not throw", async () => {
      global.window = {
        location: { hostname: "localhost" },
      } as any;

      const { WebIpcClient } = await import("../ipc/web_ipc_client");
      const client = WebIpcClient.getInstance();

      expect(() => client.setMcpToolConsent()).not.toThrow();
    });

    it("createMcpServer should return an object with id", async () => {
      global.window = {
        location: { hostname: "localhost" },
      } as any;

      const { WebIpcClient } = await import("../ipc/web_ipc_client");
      const client = WebIpcClient.getInstance();

      const result = await client.createMcpServer();
      expect(result).toHaveProperty("id");
    });
  });

  describe("Critical navigation methods", () => {
    it("all navigation-critical methods should exist and be callable", async () => {
      global.window = {
        location: { hostname: "localhost" },
        localStorage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        },
      } as any;

      const { WebIpcClient } = await import("../ipc/web_ipc_client");
      const client = WebIpcClient.getInstance();

      // These are methods that can be called during initial page load/navigation
      const criticalMethods = [
        "listProfiles",
        "hasProfiles",
        "getActiveProfile",
        "getUserSettings",
        "listApps",
        "getChats",
        "getMcpToolConsents",
        "listMcpServers",
        "getAgentTools",
        "getLanguageModels",
        "getTemplates",
        "getAppVersion",
      ];

      for (const method of criticalMethods) {
        const fn = (client as any)[method];
        expect(typeof fn).toBe("function");

        // Should not throw when called
        await expect(fn.call(client)).resolves.not.toThrow();
      }
    });
  });
});
