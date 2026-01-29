/**
 * Profile Storage
 *
 * Manages local profile storage with secure PIN hashing.
 * Profiles are stored in userData/profiles.json.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { getUserDataPath } from "../paths/paths";
import {
  Profile,
  ProfilesStorage,
  ProfilesStorageSchema,
  ProfileSummary,
  CreateProfileInput,
  ActiveProfileSession,
  PROFILE_AVATAR_COLORS,
} from "./profile_types";
import log from "electron-log";

const logger = log.scope("profile-storage");

const PROFILES_FILE = "profiles.json";
const PIN_SALT_LENGTH = 16;
const PIN_HASH_ITERATIONS = 10000;
const PIN_HASH_KEYLEN = 64;
const PIN_HASH_DIGEST = "sha512";

/**
 * In-memory active profile session.
 * Not persisted for security - user must re-authenticate on app restart.
 */
let activeSession: ActiveProfileSession | null = null;

/**
 * Get the profiles storage file path
 */
export function getProfilesFilePath(): string {
  return path.join(getUserDataPath(), PROFILES_FILE);
}

/**
 * Hash a PIN using PBKDF2
 */
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(PIN_SALT_LENGTH).toString("hex");
  const hash = crypto
    .pbkdf2Sync(
      pin,
      salt,
      PIN_HASH_ITERATIONS,
      PIN_HASH_KEYLEN,
      PIN_HASH_DIGEST,
    )
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a PIN against a stored hash
 */
export function verifyPin(pin: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;

    const inputHash = crypto
      .pbkdf2Sync(
        pin,
        salt,
        PIN_HASH_ITERATIONS,
        PIN_HASH_KEYLEN,
        PIN_HASH_DIGEST,
      )
      .toString("hex");

    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(inputHash));
  } catch (error) {
    logger.error("Error verifying PIN:", error);
    return false;
  }
}

/**
 * Read profiles from storage
 */
export function readProfiles(): ProfilesStorage {
  try {
    const filePath = getProfilesFilePath();
    if (!fs.existsSync(filePath)) {
      const defaultStorage: ProfilesStorage = {
        profiles: [],
        version: 1,
      };
      return defaultStorage;
    }

    const data = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(data);
    return ProfilesStorageSchema.parse(parsed);
  } catch (error) {
    logger.error("Error reading profiles:", error);
    return { profiles: [], version: 1 };
  }
}

/**
 * Write profiles to storage
 */
export function writeProfiles(storage: ProfilesStorage): void {
  try {
    const filePath = getProfilesFilePath();
    const validated = ProfilesStorageSchema.parse(storage);
    fs.writeFileSync(filePath, JSON.stringify(validated, null, 2));
  } catch (error) {
    logger.error("Error writing profiles:", error);
    throw error;
  }
}

/**
 * Get all profiles (without sensitive data)
 */
export function listProfiles(): ProfileSummary[] {
  const storage = readProfiles();
  return storage.profiles.map((p) => ({
    id: p.id,
    name: p.name,
    createdAt: p.createdAt,
    lastLoginAt: p.lastLoginAt,
    isAdmin: p.isAdmin,
    avatarColor: p.avatarColor,
  }));
}

/**
 * Create a new profile
 */
export function createProfile(input: CreateProfileInput): ProfileSummary {
  const storage = readProfiles();

  // Check for duplicate name
  if (
    storage.profiles.some(
      (p) => p.name.toLowerCase() === input.name.toLowerCase(),
    )
  ) {
    throw new Error("A profile with this name already exists");
  }

  // Determine if this is the first profile (auto-admin)
  const isFirstProfile = storage.profiles.length === 0;

  const profile: Profile = {
    id: uuidv4(),
    name: input.name,
    pinHash: hashPin(input.pin),
    createdAt: new Date().toISOString(),
    isAdmin: input.isAdmin ?? isFirstProfile, // First profile is admin by default
    avatarColor:
      input.avatarColor ??
      PROFILE_AVATAR_COLORS[
        storage.profiles.length % PROFILE_AVATAR_COLORS.length
      ],
  };

  storage.profiles.push(profile);
  writeProfiles(storage);

  logger.info(`Created profile: ${profile.name} (admin: ${profile.isAdmin})`);

  return {
    id: profile.id,
    name: profile.name,
    createdAt: profile.createdAt,
    isAdmin: profile.isAdmin,
    avatarColor: profile.avatarColor,
  };
}

/**
 * Delete a profile
 */
export function deleteProfile(profileId: string): void {
  const storage = readProfiles();
  const index = storage.profiles.findIndex((p) => p.id === profileId);

  if (index === -1) {
    throw new Error("Profile not found");
  }

  const profile = storage.profiles[index];
  storage.profiles.splice(index, 1);
  writeProfiles(storage);

  logger.info(`Deleted profile: ${profile.name}`);

  // Clear active session if this profile was active
  if (activeSession?.profileId === profileId) {
    activeSession = null;
  }
}

/**
 * Verify PIN and create session
 */
export function verifyPinAndLogin(
  profileId: string,
  pin: string,
): { success: boolean; session?: ActiveProfileSession } {
  const storage = readProfiles();
  const profile = storage.profiles.find((p) => p.id === profileId);

  if (!profile) {
    return { success: false };
  }

  if (!verifyPin(pin, profile.pinHash)) {
    logger.warn(`Failed PIN verification for profile: ${profile.name}`);
    return { success: false };
  }

  // Update last login time
  profile.lastLoginAt = new Date().toISOString();
  writeProfiles(storage);

  // Create session
  activeSession = {
    profileId: profile.id,
    profileName: profile.name,
    isAdmin: profile.isAdmin,
    loginAt: new Date(),
  };

  logger.info(`Profile logged in: ${profile.name}`);

  return { success: true, session: activeSession };
}

/**
 * Get the active profile session
 */
export function getActiveSession(): ActiveProfileSession | null {
  return activeSession;
}

/**
 * Clear the active profile session (logout)
 */
export function clearActiveSession(): void {
  if (activeSession) {
    logger.info(`Profile logged out: ${activeSession.profileName}`);
  }
  activeSession = null;
}

/**
 * Check if any profiles exist
 */
export function hasProfiles(): boolean {
  const storage = readProfiles();
  return storage.profiles.length > 0;
}

/**
 * Get profile by ID
 */
export function getProfile(profileId: string): ProfileSummary | null {
  const storage = readProfiles();
  const profile = storage.profiles.find((p) => p.id === profileId);

  if (!profile) return null;

  return {
    id: profile.id,
    name: profile.name,
    createdAt: profile.createdAt,
    lastLoginAt: profile.lastLoginAt,
    isAdmin: profile.isAdmin,
    avatarColor: profile.avatarColor,
  };
}

/**
 * Update profile (name, avatar color - not PIN)
 */
export function updateProfile(
  profileId: string,
  updates: { name?: string; avatarColor?: string },
): ProfileSummary {
  const storage = readProfiles();
  const profile = storage.profiles.find((p) => p.id === profileId);

  if (!profile) {
    throw new Error("Profile not found");
  }

  if (updates.name) {
    // Check for duplicate name
    if (
      storage.profiles.some(
        (p) =>
          p.id !== profileId &&
          p.name.toLowerCase() === updates.name!.toLowerCase(),
      )
    ) {
      throw new Error("A profile with this name already exists");
    }
    profile.name = updates.name;
  }

  if (updates.avatarColor) {
    profile.avatarColor = updates.avatarColor;
  }

  writeProfiles(storage);

  return {
    id: profile.id,
    name: profile.name,
    createdAt: profile.createdAt,
    lastLoginAt: profile.lastLoginAt,
    isAdmin: profile.isAdmin,
    avatarColor: profile.avatarColor,
  };
}

/**
 * Change PIN for a profile
 */
export function changePin(
  profileId: string,
  currentPin: string,
  newPin: string,
): boolean {
  const storage = readProfiles();
  const profile = storage.profiles.find((p) => p.id === profileId);

  if (!profile) {
    throw new Error("Profile not found");
  }

  // Verify current PIN
  if (!verifyPin(currentPin, profile.pinHash)) {
    return false;
  }

  // Update to new PIN
  profile.pinHash = hashPin(newPin);
  writeProfiles(storage);

  logger.info(`PIN changed for profile: ${profile.name}`);
  return true;
}
