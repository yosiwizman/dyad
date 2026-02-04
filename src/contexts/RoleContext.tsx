/**
 * RoleContext
 *
 * Provides global state for the current user's role (admin or child).
 * Determines navigation entries and route access based on role.
 *
 * Security Note: UI hiding is NOT a security control. Route guards and
 * backend validation provide actual enforcement.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import type { Role, SessionRoleContext } from "@/lib/rbac/types";
import {
  canRoleAccessRoute,
  getNavEntriesForRole,
} from "@/lib/rbac/navigation";
import { useProfile } from "./ProfileContext";
import { isWebPreviewMode } from "@/lib/platform/bridge";
import { getDemoRole, setDemoRole } from "@/ipc/web_ipc_client";

/**
 * Environment check for dev-only features.
 * Role switching is available in development mode OR web preview mode.
 */
const isDevelopment = process.env.NODE_ENV === "development";
const isWebPreview = typeof window !== "undefined" && isWebPreviewMode();

/**
 * Capabilities that can be checked per role.
 */
const ROLE_CAPABILITIES: Record<Role, string[]> = {
  admin: [
    "manage-users",
    "manage-templates",
    "view-diagnostics",
    "manage-publishing",
    "manage-vault",
    "manage-integrations",
    "manage-git",
    "view-observability",
    "manage-settings",
    "view-hub",
    "filter-by-child",
  ],
  child: [
    "create-apps",
    "use-chat",
    "view-library",
    "publish-app",
    "backup-data",
    "manage-profile",
  ],
};

const RoleContext = createContext<SessionRoleContext | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { activeProfile, isBellaModeActive } = useProfile();

  // In development or web preview, allow role switching for testing
  const [devOverrideRole, setDevOverrideRole] = useState<Role | null>(null);

  // Load persisted demo role from localStorage in web preview mode
  useEffect(() => {
    if (isWebPreview) {
      const persistedRole = getDemoRole();
      if (persistedRole) {
        setDevOverrideRole(persistedRole);
      }
    }
  }, []);

  /**
   * Determine the current role based on:
   * 1. Dev/demo override (if set, in development or web preview)
   * 2. Active profile (if in Bella Mode)
   * 3. Default to admin for non-Bella Mode
   */
  const role = useMemo((): Role => {
    // Dev/demo override takes precedence in development or web preview
    if ((isDevelopment || isWebPreview) && devOverrideRole !== null) {
      return devOverrideRole;
    }

    // In Bella Mode with an active profile, determine role from profile
    // For now, profiles default to "child" role
    // Admin role requires explicit profile flag (future: profile.isAdmin)
    if (isBellaModeActive && activeProfile) {
      // Check if profile is admin
      if (activeProfile.isAdmin) {
        return "admin";
      }
      return "child";
    }

    // Non-Bella Mode (development or developer mode enabled) = admin
    if (!isBellaModeActive) {
      return "admin";
    }

    // Fallback: child (safest default)
    return "child";
  }, [isBellaModeActive, activeProfile, devOverrideRole]);

  const canAccessRoute = useCallback(
    (path: string): boolean => {
      return canRoleAccessRoute(role, path);
    },
    [role],
  );

  const hasCapability = useCallback(
    (capability: string): boolean => {
      return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
    },
    [role],
  );

  // Role switcher available in development OR web preview mode
  const switchRole = useMemo(() => {
    if (!isDevelopment && !isWebPreview) {
      return undefined;
    }
    return (newRole: Role) => {
      console.log(`[RoleContext] Role switch: ${role} -> ${newRole}`);
      setDevOverrideRole(newRole);
      // Persist to localStorage in web preview mode
      if (isWebPreview) {
        setDemoRole(newRole);
      }
    };
  }, [role]);

  const value = useMemo(
    (): SessionRoleContext => ({
      role,
      isLoading: false, // Role is determined synchronously from profile
      canAccessRoute,
      hasCapability,
      switchRole,
    }),
    [role, canAccessRoute, hasCapability, switchRole],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

/**
 * Hook to access the current role context.
 */
export function useRole(): SessionRoleContext {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}

/**
 * Hook to get navigation entries for the current role.
 */
export function useRoleNavigation() {
  const { role } = useRole();
  return useMemo(() => getNavEntriesForRole(role), [role]);
}
