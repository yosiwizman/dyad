import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Publish IPC Contract Test
 *
 * Verifies that all publish IPC channels are properly registered.
 * This prevents the "No handler registered for 'publish:xxx'" error.
 */

// Expected publish IPC channels (must match preload.ts allowlist)
const PUBLISH_IPC_CHANNELS = [
  "publish:start",
  "publish:status",
  "publish:cancel",
  "publish:diagnostics",
] as const;

describe("Publish IPC Contract", () => {
  const registeredHandlers = new Map<string, Function>();
  const mockHandle = vi.fn((channel: string, handler: Function) => {
    registeredHandlers.set(channel, handler);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    registeredHandlers.clear();

    // Mock electron's ipcMain
    vi.doMock("electron", () => ({
      ipcMain: {
        handle: mockHandle,
      },
      app: {
        getPath: () => "/tmp",
      },
    }));

    // Mock electron-log
    vi.doMock("electron-log", () => ({
      default: {
        scope: () => ({
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
        }),
      },
    }));

    // Mock database
    vi.doMock("../../db", () => ({
      db: {
        query: {
          apps: {
            findFirst: vi.fn(),
          },
        },
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(),
          })),
        })),
      },
    }));

    // Mock paths
    vi.doMock("../../paths/paths", () => ({
      getAbbaAppPath: vi.fn((p) => `/apps/${p}`),
    }));

    // Mock bundle utils
    vi.doMock("../utils/bundle_utils", () => ({
      createBundle: vi.fn(() =>
        Promise.resolve({
          hash: "abc123",
          size: 1024,
          fileCount: 10,
          path: "/tmp/bundle.zip",
        }),
      ),
      cleanupBundle: vi.fn(),
    }));

    // Mock broker client
    vi.doMock("../../lib/broker", () => ({
      publishStart: vi.fn(() =>
        Promise.resolve({
          publishId: "test-123",
          status: "queued",
        }),
      ),
      publishStatus: vi.fn(() =>
        Promise.resolve({
          status: "ready",
          url: "https://abba.app/p/test",
        }),
      ),
      publishCancel: vi.fn(() =>
        Promise.resolve({
          success: true,
          status: "cancelled",
        }),
      ),
      isUsingStubTransport: vi.fn(() => true),
    }));

    // Mock safe_handle
    vi.doMock("./safe_handle", () => ({
      createLoggedHandler: () => mockHandle,
    }));
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("should register all publish IPC channels", async () => {
    // Import after mocks are set up
    const { registerPublishHandlers } = await import(
      "../ipc/handlers/publish_handlers"
    );

    // Call the registration function
    registerPublishHandlers();

    // Verify all channels are registered
    for (const channel of PUBLISH_IPC_CHANNELS) {
      expect(
        registeredHandlers.has(channel),
        `Handler for '${channel}' should be registered`,
      ).toBe(true);
    }
  });

  it("should register exactly the expected number of handlers", async () => {
    const { registerPublishHandlers } = await import(
      "../ipc/handlers/publish_handlers"
    );

    registerPublishHandlers();

    expect(registeredHandlers.size).toBe(PUBLISH_IPC_CHANNELS.length);
  });

  it("should register handlers as functions", async () => {
    const { registerPublishHandlers } = await import(
      "../ipc/handlers/publish_handlers"
    );

    registerPublishHandlers();

    for (const [channel, handler] of registeredHandlers) {
      expect(
        typeof handler,
        `Handler for '${channel}' should be a function`,
      ).toBe("function");
    }
  });
});

describe("Publish IPC Channels Consistency", () => {
  it("should have all channels in the expected list", () => {
    // This serves as documentation and a sanity check
    expect(PUBLISH_IPC_CHANNELS).toHaveLength(4);
    expect(PUBLISH_IPC_CHANNELS).toContain("publish:start");
    expect(PUBLISH_IPC_CHANNELS).toContain("publish:status");
    expect(PUBLISH_IPC_CHANNELS).toContain("publish:cancel");
    expect(PUBLISH_IPC_CHANNELS).toContain("publish:diagnostics");
  });
});
