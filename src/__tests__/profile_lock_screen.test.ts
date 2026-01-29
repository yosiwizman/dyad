import { describe, it, expect } from "vitest";
import {
  getProfilesRootDirectory,
  getProfileAppsDirectory,
  getLegacyAppsDirectory,
  getProfileAppPath,
  getAbbaAppsBaseDirectory,
} from "../paths/paths";

describe("workspace paths", () => {
  describe("getProfilesRootDirectory", () => {
    it("should return a path ending with /profiles", () => {
      const result = getProfilesRootDirectory();
      expect(result).toMatch(/profiles$/);
    });

    it("should be a child of the base directory", () => {
      const baseDir = getAbbaAppsBaseDirectory();
      const profilesDir = getProfilesRootDirectory();
      expect(profilesDir.startsWith(baseDir)).toBe(true);
    });
  });

  describe("getProfileAppsDirectory", () => {
    it("should return path containing the profile ID", () => {
      const profileId = "test-profile-uuid";
      const result = getProfileAppsDirectory(profileId);
      expect(result).toContain(profileId);
    });

    it("should be under the profiles root directory", () => {
      const profileId = "test-profile-uuid";
      const profilesRoot = getProfilesRootDirectory();
      const profileDir = getProfileAppsDirectory(profileId);
      expect(profileDir.startsWith(profilesRoot)).toBe(true);
    });
  });

  describe("getLegacyAppsDirectory", () => {
    it("should return the same as base directory", () => {
      const legacyDir = getLegacyAppsDirectory();
      const baseDir = getAbbaAppsBaseDirectory();
      expect(legacyDir).toBe(baseDir);
    });
  });

  describe("getProfileAppPath", () => {
    it("should combine profile directory with app path", () => {
      const profileId = "test-profile-uuid";
      const appPath = "my-app";
      const result = getProfileAppPath(profileId, appPath);

      expect(result).toContain(profileId);
      expect(result).toContain(appPath);
    });

    it("should return absolute path as-is", () => {
      const profileId = "test-profile-uuid";
      const absolutePath =
        process.platform === "win32"
          ? "C:\\Users\\test\\custom-path"
          : "/home/test/custom-path";
      const result = getProfileAppPath(profileId, absolutePath);

      expect(result).toBe(absolutePath);
    });
  });
});

describe("profile types", () => {
  it("should have avatar colors defined", async () => {
    const { PROFILE_AVATAR_COLORS } = await import("../profiles/profile_types");
    expect(PROFILE_AVATAR_COLORS).toBeDefined();
    expect(PROFILE_AVATAR_COLORS.length).toBeGreaterThan(0);
    // Each color should be a valid hex color
    for (const color of PROFILE_AVATAR_COLORS) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("should have correct profile schema fields", async () => {
    const { ProfileSchema } = await import("../profiles/profile_types");
    const testProfile = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Test User",
      pinHash: "salt:hash",
      createdAt: new Date().toISOString(),
      isAdmin: false,
      avatarColor: "#8B5CF6",
    };

    const result = ProfileSchema.safeParse(testProfile);
    expect(result.success).toBe(true);
  });
});
