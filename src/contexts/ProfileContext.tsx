/**
 * ProfileContext
 *
 * Provides global state for the active user profile.
 * In Bella Mode, the app requires an active profile to access main UI.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { IpcClient } from "../ipc/ipc_client";
import type {
  ProfileSummary,
  ActiveProfileSession,
  CreateProfileInput,
} from "../profiles/profile_types";
import { isBellaMode } from "../shared/bella_mode";

interface ProfileContextType {
  /** Whether the profile system is loading initial state */
  isLoading: boolean;

  /** The currently active profile session (null if not logged in) */
  activeProfile: ActiveProfileSession | null;

  /** List of all available profiles */
  profiles: ProfileSummary[];

  /** Whether any profiles exist */
  hasProfiles: boolean;

  /** Whether Bella Mode is active (profiles required) */
  isBellaModeActive: boolean;

  /** Login to a profile with PIN */
  login: (
    profileId: string,
    pin: string,
  ) => Promise<{ success: boolean; error?: string }>;

  /** Logout from current profile */
  logout: () => Promise<void>;

  /** Create a new profile */
  createProfile: (
    input: CreateProfileInput,
  ) => Promise<{ success: boolean; profile?: ProfileSummary; error?: string }>;

  /** Delete a profile */
  deleteProfile: (profileId: string) => Promise<void>;

  /** Refresh the profiles list */
  refreshProfiles: () => Promise<void>;

  /** Whether the lock screen should be shown */
  shouldShowLockScreen: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeProfile, setActiveProfile] =
    useState<ActiveProfileSession | null>(null);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [hasProfiles, setHasProfiles] = useState(false);

  const isBellaModeActive = isBellaMode();

  const refreshProfiles = useCallback(async () => {
    try {
      const ipc = IpcClient.getInstance();
      const [profilesList, hasProfilesResult] = await Promise.all([
        ipc.listProfiles(),
        ipc.hasProfiles(),
      ]);
      setProfiles(profilesList);
      setHasProfiles(hasProfilesResult);
    } catch (error) {
      console.error("Error refreshing profiles:", error);
    }
  }, []);

  // Initialize profile state on mount
  useEffect(() => {
    const initializeProfiles = async () => {
      setIsLoading(true);
      try {
        const ipc = IpcClient.getInstance();

        // Check if Bella Mode is active
        if (isBellaModeActive) {
          // Get active session and profiles
          const [session, profilesList, hasProfilesResult] = await Promise.all([
            ipc.getActiveProfile(),
            ipc.listProfiles(),
            ipc.hasProfiles(),
          ]);

          setActiveProfile(session);
          setProfiles(profilesList);
          setHasProfiles(hasProfilesResult);
        }
      } catch (error) {
        console.error("Error initializing profiles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeProfiles();
  }, [isBellaModeActive]);

  const login = useCallback(
    async (
      profileId: string,
      pin: string,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const ipc = IpcClient.getInstance();
        const result = await ipc.verifyProfilePin(profileId, pin);

        if (result.success && result.session) {
          setActiveProfile(result.session);
          return { success: true };
        }

        return { success: false, error: "Incorrect PIN" };
      } catch (error) {
        console.error("Error logging in:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Login failed",
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      const ipc = IpcClient.getInstance();
      await ipc.logoutProfile();
      setActiveProfile(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, []);

  const createProfile = useCallback(
    async (
      input: CreateProfileInput,
    ): Promise<{
      success: boolean;
      profile?: ProfileSummary;
      error?: string;
    }> => {
      try {
        const ipc = IpcClient.getInstance();
        const profile = await ipc.createProfile(input);

        // Refresh profiles list
        await refreshProfiles();

        // Auto-login to the new profile
        const loginResult = await login(profile.id, input.pin);
        if (!loginResult.success) {
          return {
            success: true,
            profile,
            error: "Profile created but auto-login failed",
          };
        }

        return { success: true, profile };
      } catch (error) {
        console.error("Error creating profile:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to create profile",
        };
      }
    },
    [refreshProfiles, login],
  );

  const deleteProfile = useCallback(
    async (profileId: string) => {
      try {
        const ipc = IpcClient.getInstance();
        await ipc.deleteProfile(profileId);

        // If deleting the active profile, logout
        if (activeProfile?.profileId === profileId) {
          setActiveProfile(null);
        }

        // Refresh profiles list
        await refreshProfiles();
      } catch (error) {
        console.error("Error deleting profile:", error);
        throw error;
      }
    },
    [activeProfile, refreshProfiles],
  );

  // Determine if lock screen should be shown
  const shouldShowLockScreen = useMemo(() => {
    // Don't show lock screen while loading
    if (isLoading) return false;

    // Only show lock screen in Bella Mode
    if (!isBellaModeActive) return false;

    // Show lock screen if no active profile
    return activeProfile === null;
  }, [isLoading, isBellaModeActive, activeProfile]);

  const value = useMemo(
    () => ({
      isLoading,
      activeProfile,
      profiles,
      hasProfiles,
      isBellaModeActive,
      login,
      logout,
      createProfile,
      deleteProfile,
      refreshProfiles,
      shouldShowLockScreen,
    }),
    [
      isLoading,
      activeProfile,
      profiles,
      hasProfiles,
      isBellaModeActive,
      login,
      logout,
      createProfile,
      deleteProfile,
      refreshProfiles,
      shouldShowLockScreen,
    ],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
