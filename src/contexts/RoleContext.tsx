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
} from "react";
import type { Role, SessionRoleContext } from "@/lib/rbac/types";
import {
  canRoleAccessRoute,
  getNavEntriesForRole,
} from "@/lib/rbac/navigation";
import { useProfile } from "./ProfileContext";

/**
 * Environment check for dev-only features.
 * Role switching is only available in development mode.
 */
const isDevelopment = process.env.NODE_ENV === "development";

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

  // In development, allow role switching for testing
  const [devOverrideRole, setDevOverrideRole] = useState<Role | null>(null);

  /**
   * Determine the current role based on:
   * 1. Dev override (if set, development only)
   * 2. Active profile (if in Bella Mode)
   * 3. Default to admin for non-Bella Mode
   */
  const role = useMemo((): Role => {
    // Dev override takes precedence in development
    if (isDevelopment && devOverrideRole !== null) {
      return devOverrideRole;
    }

    // In Bella Mode with an active profile, determine role from profile
    // For now, profiles default to "child" role
    // Admin role requires explicit profile flag (future: profile.isAdmin)
    if (isBellaModeActive && activeProfile) {
      // Future: check activeProfile.isAdmin or similar
      // For now, default to child in Bella Mode
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

  // Dev-only role switcher
  const switchRole = useMemo(() => {
    if (!isDevelopment) {
      return undefined;
    }
    return (newRole: Role) => {
      console.log(`[RoleContext] Dev role switch: ${role} -> ${newRole}`);
      setDevOverrideRole(newRole);
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
