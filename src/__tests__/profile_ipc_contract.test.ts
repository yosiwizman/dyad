import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Profile IPC Contract Test
 *
 * Verifies that all profile IPC channels are properly registered.
 * This prevents the "No handler registered for 'profile:xxx'" error
 * that occurs when channels are defined but not registered.
 */

// Expected profile IPC channels (must match preload.ts allowlist)
const PROFILE_IPC_CHANNELS = [
  "profile:list",
  "profile:create",
  "profile:delete",
  "profile:verify-pin",
  "profile:get-active",
  "profile:logout",
  "profile:has-profiles",
  "profile:get",
  "profile:update",
  "profile:change-pin",
] as const;

describe("Profile IPC Contract", () => {
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

    // Mock profile_storage functions
    vi.doMock("../../profiles/profile_storage", () => ({
      listProfiles: vi.fn(),
      createProfile: vi.fn(),
      deleteProfile: vi.fn(),
      verifyPinAndLogin: vi.fn(),
      getActiveSession: vi.fn(),
      clearActiveSession: vi.fn(),
      hasProfiles: vi.fn(),
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
      changePin: vi.fn(),
    }));

    // Mock profile_types
    vi.doMock("../../profiles/profile_types", () => ({
      CreateProfileInputSchema: {
        parse: vi.fn((input: unknown) => input),
      },
    }));
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("should register all profile IPC channels", async () => {
    // Import after mocks are set up
    const { registerProfileHandlers } = await import(
      "../ipc/handlers/profile_handlers"
    );

    // Call the registration function
    registerProfileHandlers();

    // Verify all channels are registered
    for (const channel of PROFILE_IPC_CHANNELS) {
      expect(
        registeredHandlers.has(channel),
        `Handler for '${channel}' should be registered`,
      ).toBe(true);
    }
  });

  it("should register exactly the expected number of handlers", async () => {
    const { registerProfileHandlers } = await import(
      "../ipc/handlers/profile_handlers"
    );

    registerProfileHandlers();

    expect(registeredHandlers.size).toBe(PROFILE_IPC_CHANNELS.length);
  });

  it("should register handlers as functions", async () => {
    const { registerProfileHandlers } = await import(
      "../ipc/handlers/profile_handlers"
    );

    registerProfileHandlers();

    for (const [channel, handler] of registeredHandlers) {
      expect(
        typeof handler,
        `Handler for '${channel}' should be a function`,
      ).toBe("function");
    }
  });
});

describe("Profile IPC Channels Consistency", () => {
  it("should have all channels in the expected list", () => {
    // This serves as documentation and a sanity check
    expect(PROFILE_IPC_CHANNELS).toHaveLength(10);
    expect(PROFILE_IPC_CHANNELS).toContain("profile:list");
    expect(PROFILE_IPC_CHANNELS).toContain("profile:create");
    expect(PROFILE_IPC_CHANNELS).toContain("profile:delete");
    expect(PROFILE_IPC_CHANNELS).toContain("profile:verify-pin");
    expect(PROFILE_IPC_CHANNELS).toContain("profile:get-active");
    expect(PROFILE_IPC_CHANNELS).toContain("profile:logout");
    expect(PROFILE_IPC_CHANNELS).toContain("profile:has-profiles");
    expect(PROFILE_IPC_CHANNELS).toContain("profile:get");
    expect(PROFILE_IPC_CHANNELS).toContain("profile:update");
    expect(PROFILE_IPC_CHANNELS).toContain("profile:change-pin");
  });
});
