/**
 * RBAC Capabilities Module
 *
 * Single source of truth for role-based capabilities in ABBA AI.
 * Defines what actions each role can perform.
 *
 * Security Note: UI hiding is NOT a security control. These capabilities
 * are enforced at:
 * 1. Route guards (navigation layer)
 * 2. IPC/API handlers (backend boundary)
 *
 * Default-deny: If a capability is not explicitly granted, it is denied.
 */

import type { Role } from "./types";
import { isWebPreviewMode } from "@/lib/platform/bridge";
import { getDemoRole } from "@/ipc/web_ipc_client";

/**
 * Canonical capability identifiers.
 *
 * Naming convention: <action>-<resource>
 * - manage: full CRUD access
 * - view: read-only access
 * - use: can invoke/interact with
 */
export const Capability = {
  // === Admin-only capabilities ===
  MANAGE_USERS: "manage-users",
  MANAGE_TEMPLATES: "manage-templates",
  MANAGE_PUBLISHING: "manage-publishing",
  MANAGE_VAULT: "manage-vault",
  MANAGE_INTEGRATIONS: "manage-integrations",
  MANAGE_GIT: "manage-git",
  MANAGE_SETTINGS_FULL: "manage-settings-full",
  VIEW_DIAGNOSTICS: "view-diagnostics",
  VIEW_OBSERVABILITY: "view-observability",
  VIEW_HUB: "view-hub",
  FILTER_BY_CHILD: "filter-by-child",
  ACCESS_ADMIN_ROUTES: "access-admin-routes",

  // === Child capabilities (subset of functionality) ===
  CREATE_APPS: "create-apps",
  USE_CHAT: "use-chat",
  VIEW_LIBRARY: "view-library",
  PUBLISH_APP: "publish-app",
  BACKUP_DATA: "backup-data",
  MANAGE_PROFILE: "manage-profile",
  VIEW_SETTINGS_LIMITED: "view-settings-limited",
} as const;

export type CapabilityId = (typeof Capability)[keyof typeof Capability];

/**
 * Capabilities granted to each role.
 *
 * Admin: Full access to all features
 * Child: Limited access focused on app creation and usage
 */
const ROLE_CAPABILITIES: Record<Role, readonly CapabilityId[]> = {
  admin: [
    // Admin-only
    Capability.MANAGE_USERS,
    Capability.MANAGE_TEMPLATES,
    Capability.MANAGE_PUBLISHING,
    Capability.MANAGE_VAULT,
    Capability.MANAGE_INTEGRATIONS,
    Capability.MANAGE_GIT,
    Capability.MANAGE_SETTINGS_FULL,
    Capability.VIEW_DIAGNOSTICS,
    Capability.VIEW_OBSERVABILITY,
    Capability.VIEW_HUB,
    Capability.FILTER_BY_CHILD,
    Capability.ACCESS_ADMIN_ROUTES,
    // Admin also gets child capabilities
    Capability.CREATE_APPS,
    Capability.USE_CHAT,
    Capability.VIEW_LIBRARY,
    Capability.PUBLISH_APP,
    Capability.BACKUP_DATA,
    Capability.MANAGE_PROFILE,
    Capability.VIEW_SETTINGS_LIMITED,
  ],
  child: [
    Capability.CREATE_APPS,
    Capability.USE_CHAT,
    Capability.VIEW_LIBRARY,
    Capability.PUBLISH_APP,
    Capability.BACKUP_DATA,
    Capability.MANAGE_PROFILE,
    Capability.VIEW_SETTINGS_LIMITED,
  ],
} as const;

/**
 * Admin-only capabilities that child should NEVER have.
 * Used for explicit security assertions in tests.
 */
export const ADMIN_ONLY_CAPABILITIES: readonly CapabilityId[] = [
  Capability.MANAGE_USERS,
  Capability.MANAGE_TEMPLATES,
  Capability.MANAGE_PUBLISHING,
  Capability.MANAGE_VAULT,
  Capability.MANAGE_INTEGRATIONS,
  Capability.MANAGE_GIT,
  Capability.MANAGE_SETTINGS_FULL,
  Capability.VIEW_DIAGNOSTICS,
  Capability.VIEW_OBSERVABILITY,
  Capability.VIEW_HUB,
  Capability.FILTER_BY_CHILD,
  Capability.ACCESS_ADMIN_ROUTES,
] as const;

/**
 * Get capabilities granted to a specific role.
 * @param role The role to get capabilities for
 * @returns Array of capability IDs granted to the role
 */
export function getCapabilitiesForRole(role: Role): readonly CapabilityId[] {
  return ROLE_CAPABILITIES[role] ?? [];
}

/**
 * Check if a role has a specific capability.
 * Default-deny: Returns false if capability is not explicitly granted.
 *
 * @param role The role to check
 * @param capability The capability to check for
 * @returns true if role has the capability, false otherwise
 */
export function roleHasCapability(
  role: Role,
  capability: CapabilityId,
): boolean {
  const capabilities = getCapabilitiesForRole(role);
  return capabilities.includes(capability);
}

/**
 * Get the effective role for the current context.
 *
 * In web preview mode, uses the demo role from localStorage.
 * In production, this should be derived from the authenticated session.
 *
 * @returns The current effective role
 */
export function getEffectiveRole(): Role {
  // In web preview mode, check for demo role override
  if (typeof window !== "undefined" && isWebPreviewMode()) {
    const demoRole = getDemoRole();
    if (demoRole) {
      return demoRole;
    }
  }

  // Default to admin (safest for development, production uses auth)
  // In production, this would check the authenticated user's role
  return "admin";
}

/**
 * Create a capability checker bound to a specific role.
 * Useful for creating role-scoped permission checks.
 *
 * @param role The role to create a checker for
 * @returns A function that checks if the role has a capability
 */
export function createCapabilityChecker(
  role: Role,
): (capability: CapabilityId) => boolean {
  const capabilities = new Set(getCapabilitiesForRole(role));
  return (capability: CapabilityId) => capabilities.has(capability);
}

/**
 * Convenience function: Check if current context can perform an action.
 * Uses getEffectiveRole() to determine the current role.
 *
 * @param capability The capability to check
 * @returns true if current role has the capability
 */
export function can(capability: CapabilityId): boolean {
  const role = getEffectiveRole();
  return roleHasCapability(role, capability);
}
