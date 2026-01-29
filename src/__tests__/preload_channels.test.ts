import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Tests to verify that all Vault IPC channels are properly allowlisted
 * in the preload script for contextBridge security.
 */
describe("preload channel allowlist", () => {
  // Read the preload.ts file to extract the allowlist
  const preloadPath = path.join(__dirname, "..", "preload.ts");
  const preloadContent = fs.readFileSync(preloadPath, "utf-8");

  // Extract the validInvokeChannels array content
  const channelListMatch = preloadContent.match(
    /const validInvokeChannels = \[([\s\S]*?)\];/,
  );
  const channelListContent = channelListMatch ? channelListMatch[1] : "";

  // Required Vault channels that must be in the allowlist
  const requiredVaultChannels = [
    "vault:get-status",
    "vault:get-config",
    "vault:get-settings",
    "vault:save-settings",
    "vault:test-connection",
    "vault:get-diagnostics",
    "vault:list-backups",
    "vault:create-backup",
    "vault:restore-backup",
    "vault:delete-backup",
  ];

  // Required Vercel channels that must be in the allowlist (including direct deploy)
  const requiredVercelChannels = [
    "vercel:save-token",
    "vercel:list-projects",
    "vercel:is-project-available",
    "vercel:create-project",
    "vercel:connect-existing-project",
    "vercel:get-deployments",
    "vercel:disconnect",
    "vercel:test-connection",
    "vercel:deploy",
  ];

  describe("Vault channels", () => {
    it.each(requiredVaultChannels)(
      "should include %s in validInvokeChannels",
      (channel) => {
        expect(channelListContent).toContain(`"${channel}"`);
      },
    );

    it("should have all required Vault channels", () => {
      const missingChannels = requiredVaultChannels.filter(
        (channel) => !channelListContent.includes(`"${channel}"`),
      );
      expect(missingChannels).toEqual([]);
    });
  });

  describe("Vercel channels", () => {
    it.each(requiredVercelChannels)(
      "should include %s in validInvokeChannels",
      (channel) => {
        expect(channelListContent).toContain(`"${channel}"`);
      },
    );

    it("should have all required Vercel channels", () => {
      const missingChannels = requiredVercelChannels.filter(
        (channel) => !channelListContent.includes(`"${channel}"`),
      );
      expect(missingChannels).toEqual([]);
    });
  });

  describe("channel validation behavior", () => {
    it("preload should throw error for invalid channels", () => {
      // The preload script should contain error throwing logic
      expect(preloadContent).toContain("Invalid channel:");
      expect(preloadContent).toContain("throw new Error");
    });

    it("preload should validate channels before invoking", () => {
      // Should check if channel is in the allowlist before invoking
      expect(preloadContent).toContain("validInvokeChannels.includes(channel)");
    });
  });
});
