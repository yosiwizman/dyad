/**
 * Profile IPC Handlers
 *
 * Handles IPC communication for local profile management.
 */

import { ipcMain, IpcMainInvokeEvent } from "electron";
import {
  listProfiles,
  createProfile,
  deleteProfile,
  verifyPinAndLogin,
  getActiveSession,
  clearActiveSession,
  hasProfiles,
  getProfile,
  updateProfile,
  changePin,
} from "../../profiles/profile_storage";
import {
  CreateProfileInput,
  CreateProfileInputSchema,
  ProfileSummary,
  ActiveProfileSession,
} from "../../profiles/profile_types";
import log from "electron-log";

const logger = log.scope("profile-handlers");

/**
 * Register all profile-related IPC handlers
 */
export function registerProfileHandlers(): void {
  // List all profiles
  ipcMain.handle("profile:list", async (): Promise<ProfileSummary[]> => {
    try {
      return listProfiles();
    } catch (error) {
      logger.error("Error listing profiles:", error);
      throw error;
    }
  });

  // Create a new profile
  ipcMain.handle(
    "profile:create",
    async (
      _event: IpcMainInvokeEvent,
      input: CreateProfileInput,
    ): Promise<ProfileSummary> => {
      try {
        // Validate input
        const validated = CreateProfileInputSchema.parse(input);
        return createProfile(validated);
      } catch (error) {
        logger.error("Error creating profile:", error);
        throw error;
      }
    },
  );

  // Delete a profile
  ipcMain.handle(
    "profile:delete",
    async (_event: IpcMainInvokeEvent, profileId: string): Promise<void> => {
      try {
        deleteProfile(profileId);
      } catch (error) {
        logger.error("Error deleting profile:", error);
        throw error;
      }
    },
  );

  // Verify PIN and login
  ipcMain.handle(
    "profile:verify-pin",
    async (
      _event: IpcMainInvokeEvent,
      profileId: string,
      pin: string,
    ): Promise<{ success: boolean; session?: ActiveProfileSession }> => {
      try {
        return verifyPinAndLogin(profileId, pin);
      } catch (error) {
        logger.error("Error verifying PIN:", error);
        throw error;
      }
    },
  );

  // Get active session
  ipcMain.handle(
    "profile:get-active",
    async (): Promise<ActiveProfileSession | null> => {
      try {
        return getActiveSession();
      } catch (error) {
        logger.error("Error getting active session:", error);
        throw error;
      }
    },
  );

  // Logout (clear active session)
  ipcMain.handle("profile:logout", async (): Promise<void> => {
    try {
      clearActiveSession();
    } catch (error) {
      logger.error("Error logging out:", error);
      throw error;
    }
  });

  // Check if profiles exist
  ipcMain.handle("profile:has-profiles", async (): Promise<boolean> => {
    try {
      return hasProfiles();
    } catch (error) {
      logger.error("Error checking profiles:", error);
      throw error;
    }
  });

  // Get profile by ID
  ipcMain.handle(
    "profile:get",
    async (
      _event: IpcMainInvokeEvent,
      profileId: string,
    ): Promise<ProfileSummary | null> => {
      try {
        return getProfile(profileId);
      } catch (error) {
        logger.error("Error getting profile:", error);
        throw error;
      }
    },
  );

  // Update profile
  ipcMain.handle(
    "profile:update",
    async (
      _event: IpcMainInvokeEvent,
      profileId: string,
      updates: { name?: string; avatarColor?: string },
    ): Promise<ProfileSummary> => {
      try {
        return updateProfile(profileId, updates);
      } catch (error) {
        logger.error("Error updating profile:", error);
        throw error;
      }
    },
  );

  // Change PIN
  ipcMain.handle(
    "profile:change-pin",
    async (
      _event: IpcMainInvokeEvent,
      profileId: string,
      currentPin: string,
      newPin: string,
    ): Promise<boolean> => {
      try {
        return changePin(profileId, currentPin, newPin);
      } catch (error) {
        logger.error("Error changing PIN:", error);
        throw error;
      }
    },
  );

  logger.info("Profile IPC handlers registered");
}
