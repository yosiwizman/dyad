import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Web Boot Tests
 *
 * These tests verify that the app can initialize and IpcClient.getInstance()
 * can be called without crashing when running in a browser environment
 * (no Electron APIs available).
 */

describe("web boot (no desktop globals)", () => {
  // Store original window
  const originalWindow = global.window;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset modules to ensure fresh state
    vi.resetModules();
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it("should not crash when IpcClient.getInstance is called without Electron", async () => {
    // Ensure no Electron API is available (simulating browser)
    global.window = {
      location: { hostname: "localhost" },
    } as any;

    // Dynamically import to get fresh module state
    const { IpcClient } = await import("../ipc/ipc_client");

    // This should NOT throw - it should return WebIpcClient instead
    expect(() => {
      IpcClient.getInstance();
    }).not.toThrow();
  });

  it("should return a client with web preview behavior when in browser", async () => {
    // Simulate browser environment
    global.window = {
      location: { hostname: "localhost" },
    } as any;

    const { IpcClient } = await import("../ipc/ipc_client");

    const client = IpcClient.getInstance();

    // Should have web preview behavior - listProfiles returns empty array
    const profiles = await client.listProfiles();
    expect(profiles).toEqual([]);
  });

  it("should have working stub methods in WebIpcClient", async () => {
    global.window = {
      location: { hostname: "localhost" },
    } as any;

    const { WebIpcClient } = await import("../ipc/web_ipc_client");
    const client = WebIpcClient.getInstance();

    // Profile methods should return safe defaults
    const profiles = await client.listProfiles();
    expect(profiles).toEqual([]);

    const hasProfiles = await client.hasProfiles();
    expect(hasProfiles).toBe(false);

    const activeProfile = await client.getActiveProfile();
    expect(activeProfile).toBeNull();

    // Apps should return empty
    const apps = await client.listApps();
    expect(apps).toEqual({ apps: [] });

    // Chats should return empty
    const chats = await client.getChats();
    expect(chats).toEqual([]);

    // Settings should return empty object
    const settings = await client.getUserSettings();
    expect(settings).toEqual({});
  });

  it("should return no-op unsubscribe functions for event listeners", async () => {
    global.window = {
      location: { hostname: "localhost" },
    } as any;

    const { WebIpcClient } = await import("../ipc/web_ipc_client");
    const client = WebIpcClient.getInstance();

    // Event listener methods should return functions
    const unsubMcp = client.onMcpToolConsentRequest();
    expect(typeof unsubMcp).toBe("function");
    expect(() => unsubMcp()).not.toThrow();

    const unsubAgent = client.onAgentToolConsentRequest();
    expect(typeof unsubAgent).toBe("function");
    expect(() => unsubAgent()).not.toThrow();

    const unsubTodos = client.onAgentTodosUpdate();
    expect(typeof unsubTodos).toBe("function");
    expect(() => unsubTodos()).not.toThrow();

    const unsubStream = client.onChatStreamStart();
    expect(typeof unsubStream).toBe("function");
    expect(() => unsubStream()).not.toThrow();
  });

  it("should provide version info in web mode", async () => {
    global.window = {
      location: { hostname: "localhost" },
    } as any;

    const { WebIpcClient } = await import("../ipc/web_ipc_client");
    const client = WebIpcClient.getInstance();

    const version = await client.getAppVersion();
    expect(version.version).toBe("web-preview");
    expect(version.environment).toBe("production");
  });

  it("should gracefully handle streaming methods without throwing", async () => {
    global.window = {
      location: { hostname: "localhost" },
    } as any;

    const { WebIpcClient } = await import("../ipc/web_ipc_client");
    const client = WebIpcClient.getInstance();

    // These should not throw
    expect(() => client.streamMessage()).not.toThrow();
    expect(() => client.cancelStream()).not.toThrow();
    expect(() => client.startHelpChat()).not.toThrow();
    expect(() => client.cancelHelpChat()).not.toThrow();
  });
});
