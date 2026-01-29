import { describe, it, expect } from "vitest";
import {
  isBellaMode,
  isBellaModeWithSettings,
  BELLA_MODE_HIDDEN_FEATURES,
  BELLA_MODE_PLACEHOLDER_MESSAGE,
} from "../shared/bella_mode";

describe("bella_mode", () => {
  describe("isBellaMode", () => {
    // Note: Environment-specific tests are difficult to test reliably
    // because the module reads process.env at import time.
    // These tests verify the current behavior in the test environment.

    it("should return a boolean", () => {
      const result = isBellaMode();
      expect(typeof result).toBe("boolean");
    });

    it("should return true in test environment (same as production)", () => {
      // In vitest, NODE_ENV is 'test' which is treated like production
      // Bella Mode is only OFF in 'development' mode
      expect(isBellaMode()).toBe(true);
    });
  });

  describe("isBellaModeWithSettings", () => {
    it("should return false when enableDeveloperMode is true in settings", () => {
      expect(isBellaModeWithSettings({ enableDeveloperMode: true })).toBe(
        false,
      );
    });

    it("should fall back to isBellaMode when enableDeveloperMode is false", () => {
      // In test environment (development), should return false
      expect(isBellaModeWithSettings({ enableDeveloperMode: false })).toBe(
        isBellaMode(),
      );
    });

    it("should fall back to isBellaMode when settings is undefined", () => {
      expect(isBellaModeWithSettings(undefined)).toBe(isBellaMode());
    });

    it("should fall back to isBellaMode when enableDeveloperMode is not set", () => {
      expect(isBellaModeWithSettings({})).toBe(isBellaMode());
    });
  });

  describe("constants", () => {
    it("should have hidden features list", () => {
      expect(BELLA_MODE_HIDDEN_FEATURES).toBeDefined();
      expect(BELLA_MODE_HIDDEN_FEATURES.length).toBeGreaterThan(0);
      expect(BELLA_MODE_HIDDEN_FEATURES).toContain("GitHub Integration");
      expect(BELLA_MODE_HIDDEN_FEATURES).toContain("Supabase Integration");
      expect(BELLA_MODE_HIDDEN_FEATURES).toContain("Vercel Integration");
    });

    it("should have placeholder message", () => {
      expect(BELLA_MODE_PLACEHOLDER_MESSAGE).toBeDefined();
      expect(BELLA_MODE_PLACEHOLDER_MESSAGE.length).toBeGreaterThan(0);
      expect(BELLA_MODE_PLACEHOLDER_MESSAGE).toContain("ABBA");
    });
  });
});
