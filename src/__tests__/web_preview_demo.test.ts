import { describe, it, expect } from "vitest";

/**
 * Web Preview Demo Mode Tests
 *
 * These tests validate the exported constants and helper types from web_ipc_client.
 * Due to the singleton pattern and module caching, full integration tests of
 * localStorage persistence are better done via E2E tests or manual testing
 * in the actual web preview environment.
 */

describe("web preview demo mode", () => {
  describe("DEMO_STORAGE_KEYS constant", () => {
    it("should export the correct localStorage key names", async () => {
      const { DEMO_STORAGE_KEYS } = await import("../ipc/web_ipc_client");

      expect(DEMO_STORAGE_KEYS).toEqual({
        PROFILES: "abba_demo_profiles",
        ACTIVE_PROFILE: "abba_demo_active_profile",
        ROLE: "abba_demo_role",
        SETTINGS: "abba_demo_settings",
      });
    });
  });

  describe("WebIpcClient stub methods", () => {
    it("should have profile management methods that return expected types", async () => {
      // Import in browser-like environment
      global.window = {
        location: { hostname: "localhost" },
      } as any;

      const { WebIpcClient } = await import("../ipc/web_ipc_client");
      const client = WebIpcClient.getInstance();

      // Profile methods should exist and return correct types
      expect(typeof client.listProfiles).toBe("function");
      expect(typeof client.hasProfiles).toBe("function");
      expect(typeof client.getActiveProfile).toBe("function");
      expect(typeof client.createProfile).toBe("function");
      expect(typeof client.deleteProfile).toBe("function");
      expect(typeof client.verifyProfilePin).toBe("function");
      expect(typeof client.logoutProfile).toBe("function");
    });

    it("should export demo role helper functions", async () => {
      const { getDemoRole, setDemoRole, clearDemoData } = await import(
        "../ipc/web_ipc_client"
      );

      expect(typeof getDemoRole).toBe("function");
      expect(typeof setDemoRole).toBe("function");
      expect(typeof clearDemoData).toBe("function");
    });
  });

  describe("createProfile return value", () => {
    it("should return a profile summary with required fields", async () => {
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

      const profile = await client.createProfile({
        name: "Test User",
        pin: "1234",
        isAdmin: true,
        avatarColor: "#ff0000",
      });

      // Verify the returned profile has the expected structure
      expect(profile).toBeDefined();
      expect(profile.name).toBe("Test User");
      expect(profile.isAdmin).toBe(true);
      expect(profile.avatarColor).toBe("#ff0000");
      expect(typeof profile.id).toBe("string");
      expect(profile.id.length).toBeGreaterThan(0);
      expect(profile.createdAt).toBeDefined();
    });
  });

  describe("verifyProfilePin behavior", () => {
    it("should return an object with success property", async () => {
      global.window = {
        location: { hostname: "localhost" },
        localStorage: {
          getItem: () => "[]",
          setItem: () => {},
          removeItem: () => {},
        },
      } as any;

      const { WebIpcClient } = await import("../ipc/web_ipc_client");
      const client = WebIpcClient.getInstance();

      // Just verify the method returns the expected shape
      const result = await client.verifyProfilePin("any-id", "1234");
      expect(typeof result.success).toBe("boolean");
    });
  });
});
