/**
 * Workspace Migration
 *
 * Handles migration of legacy apps (created before profiles existed)
 * to the new profile-based workspace structure.
 *
 * Migration rules:
 * 1. If legacy apps exist AND no profiles exist:
 *    - After creating first profile, prompt user: "Move existing apps to this profile?"
 *    - Yes: Move ~/abba-ai-apps/* → ~/abba-ai-apps/profiles/<profileId>/
 *    - No: Keep apps under "Legacy (Admin)" read-only section
 * 2. If profiles already exist: Never auto-migrate, show legacy in sidebar only
 */

import fs from "node:fs";
import path from "node:path";
import {
  getAbbaAppsBaseDirectory,
  getProfileAppsDirectory,
  getProfilesRootDirectory,
} from "../paths/paths";
import log from "electron-log";

const logger = log.scope("workspace-migration");

/**
 * Files/directories to ignore when checking for legacy apps
 */
const IGNORE_LIST = [
  "profiles", // Profiles directory
  ".DS_Store", // macOS
  "Thumbs.db", // Windows
  "desktop.ini", // Windows
];

/**
 * Check if there are legacy apps in the base directory
 * Legacy apps are directories directly in ~/abba-ai-apps/ (not in profiles/)
 */
export function hasLegacyApps(): boolean {
  try {
    const baseDir = getAbbaAppsBaseDirectory();

    if (!fs.existsSync(baseDir)) {
      return false;
    }

    const entries = fs.readdirSync(baseDir, { withFileTypes: true });

    // Look for directories that aren't in the ignore list
    const appDirs = entries.filter(
      (entry) => entry.isDirectory() && !IGNORE_LIST.includes(entry.name),
    );

    return appDirs.length > 0;
  } catch (error) {
    logger.error("Error checking for legacy apps:", error);
    return false;
  }
}

/**
 * Get list of legacy app directories
 */
export function listLegacyApps(): string[] {
  try {
    const baseDir = getAbbaAppsBaseDirectory();

    if (!fs.existsSync(baseDir)) {
      return [];
    }

    const entries = fs.readdirSync(baseDir, { withFileTypes: true });

    return entries
      .filter(
        (entry) => entry.isDirectory() && !IGNORE_LIST.includes(entry.name),
      )
      .map((entry) => entry.name);
  } catch (error) {
    logger.error("Error listing legacy apps:", error);
    return [];
  }
}

/**
 * Get the full path of a legacy app
 */
export function getLegacyAppPath(appName: string): string {
  return path.join(getAbbaAppsBaseDirectory(), appName);
}

/**
 * Migrate a single legacy app to a profile's workspace
 *
 * @param appName - Name of the app directory
 * @param profileId - Target profile ID
 * @returns Success boolean
 */
export function migrateLegacyApp(
  appName: string,
  profileId: string,
): { success: boolean; error?: string } {
  try {
    const sourcePath = getLegacyAppPath(appName);
    const targetPath = path.join(getProfileAppsDirectory(profileId), appName);

    // Ensure source exists
    if (!fs.existsSync(sourcePath)) {
      return { success: false, error: `Source app not found: ${appName}` };
    }

    // Ensure target directory exists
    const profileDir = getProfileAppsDirectory(profileId);
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    // Check if target already exists
    if (fs.existsSync(targetPath)) {
      return {
        success: false,
        error: `App already exists in profile: ${appName}`,
      };
    }

    // Move the directory
    fs.renameSync(sourcePath, targetPath);

    logger.info(`Migrated legacy app: ${appName} → profile ${profileId}`);
    return { success: true };
  } catch (error) {
    logger.error(`Error migrating legacy app ${appName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Migration failed",
    };
  }
}

/**
 * Migrate all legacy apps to a profile's workspace
 *
 * @param profileId - Target profile ID
 * @returns Results for each app
 */
export function migrateAllLegacyApps(profileId: string): {
  results: Array<{ appName: string; success: boolean; error?: string }>;
  totalMigrated: number;
  totalFailed: number;
} {
  const legacyApps = listLegacyApps();
  const results: Array<{ appName: string; success: boolean; error?: string }> =
    [];

  let totalMigrated = 0;
  let totalFailed = 0;

  for (const appName of legacyApps) {
    const result = migrateLegacyApp(appName, profileId);
    results.push({ appName, ...result });

    if (result.success) {
      totalMigrated++;
    } else {
      totalFailed++;
    }
  }

  logger.info(
    `Migration complete: ${totalMigrated} migrated, ${totalFailed} failed`,
  );

  return { results, totalMigrated, totalFailed };
}

/**
 * Ensure the profiles directory exists
 */
export function ensureProfilesDirectory(): void {
  const profilesDir = getProfilesRootDirectory();
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }
}

/**
 * Ensure a profile's apps directory exists
 */
export function ensureProfileAppsDirectory(profileId: string): void {
  const profileDir = getProfileAppsDirectory(profileId);
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }
}

/**
 * Check migration status
 */
export interface MigrationStatus {
  hasLegacyApps: boolean;
  legacyAppCount: number;
  legacyApps: string[];
  profilesDirectoryExists: boolean;
}

export function getMigrationStatus(): MigrationStatus {
  const legacyApps = listLegacyApps();
  const profilesDir = getProfilesRootDirectory();

  return {
    hasLegacyApps: legacyApps.length > 0,
    legacyAppCount: legacyApps.length,
    legacyApps,
    profilesDirectoryExists: fs.existsSync(profilesDir),
  };
}
