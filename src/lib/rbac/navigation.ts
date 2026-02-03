/**
 * Navigation Configuration for Admin and Child Roles
 *
 * Source of truth for sidebar navigation entries per role.
 * Based on KB Doc 019: Admin vs Child sidebar map.
 */

import type { NavEntry, Role, RolePolicy } from "./types";

/**
 * Child Mode Navigation Entries
 *
 * Child users have access to:
 * - Home (App Library)
 * - Chat Library
 * - App Library (same as Home, aliased)
 * - Publish (managed by ABBA)
 * - Backup
 * - Profile
 */
export const CHILD_NAV_ENTRIES: NavEntry[] = [
  {
    title: "Home",
    to: "/",
    icon: "Home",
    access: "all",
  },
  {
    title: "Chat",
    to: "/chat",
    icon: "MessageSquare",
    access: "all",
  },
  {
    title: "Library",
    to: "/library",
    icon: "BookOpen",
    access: "all",
  },
  {
    title: "Publish",
    to: "/publish",
    icon: "Upload",
    access: "child-only",
    docRef: "KB-020",
    isStub: true,
  },
  {
    title: "Backup",
    to: "/backup",
    icon: "HardDrive",
    access: "child-only",
    docRef: "KB-021",
    isStub: true,
  },
  {
    title: "Profile",
    to: "/profile",
    icon: "User",
    access: "child-only",
    docRef: "KB-022",
    isStub: true,
  },
];

/**
 * Admin Mode Navigation Entries
 *
 * Admin users have access to:
 * - Home (App Library)
 * - Chat Library (with filter-by-child)
 * - App Library (with filter-by-child)
 * - Users (Hub → Users)
 * - Templates
 * - Bugs & Diagnostics
 * - Publishing Ops
 * - Vault Ops
 * - Integrations
 * - Git Ops
 * - Observability
 * - Settings
 */
export const ADMIN_NAV_ENTRIES: NavEntry[] = [
  {
    title: "Home",
    to: "/",
    icon: "Home",
    access: "all",
  },
  {
    title: "Chat",
    to: "/chat",
    icon: "MessageSquare",
    access: "all",
  },
  {
    title: "Library",
    to: "/library",
    icon: "BookOpen",
    access: "all",
  },
  {
    title: "Users",
    to: "/admin/users",
    icon: "Users",
    access: "admin-only",
    docRef: "KB-023",
    isStub: true,
  },
  {
    title: "Templates",
    to: "/admin/templates",
    icon: "LayoutTemplate",
    access: "admin-only",
    docRef: "KB-024",
    isStub: true,
  },
  {
    title: "Diagnostics",
    to: "/admin/diagnostics",
    icon: "Bug",
    access: "admin-only",
    docRef: "KB-025",
  },
  {
    title: "Publishing",
    to: "/admin/publishing",
    icon: "Rocket",
    access: "admin-only",
    docRef: "KB-026",
    isStub: true,
  },
  {
    title: "Vault",
    to: "/admin/vault",
    icon: "Lock",
    access: "admin-only",
    docRef: "KB-027",
    isStub: true,
  },
  {
    title: "Integrations",
    to: "/admin/integrations",
    icon: "Plug",
    access: "admin-only",
    docRef: "KB-028",
    isStub: true,
  },
  {
    title: "Git Ops",
    to: "/admin/git",
    icon: "GitBranch",
    access: "admin-only",
    docRef: "KB-029",
    isStub: true,
  },
  {
    title: "Observability",
    to: "/admin/observability",
    icon: "Activity",
    access: "admin-only",
    docRef: "KB-030",
    isStub: true,
  },
  {
    title: "Settings",
    to: "/settings",
    icon: "Settings",
    access: "all",
  },
  {
    title: "Hub",
    to: "/hub",
    icon: "Store",
    access: "admin-only",
  },
];

/**
 * Get navigation entries for a specific role.
 */
export function getNavEntriesForRole(role: Role): NavEntry[] {
  if (role === "admin") {
    return ADMIN_NAV_ENTRIES;
  }
  return CHILD_NAV_ENTRIES;
}

/**
 * Get the policy for a specific role.
 */
export function getRolePolicy(role: Role): RolePolicy {
  const navEntries = getNavEntriesForRole(role);

  // Extract allowed routes from nav entries
  const allowedRoutes = navEntries.map((entry) => entry.to);

  // Define allowed route prefixes
  const allowedRoutePrefixes =
    role === "admin"
      ? [
          "/",
          "/chat",
          "/app-details",
          "/settings",
          "/admin",
          "/library",
          "/hub",
        ]
      : [
          "/",
          "/chat",
          "/app-details",
          "/library",
          "/publish",
          "/backup",
          "/profile",
        ];

  return {
    navEntries,
    allowedRoutes,
    allowedRoutePrefixes,
  };
}

/**
 * Check if a role can access a specific route.
 */
export function canRoleAccessRoute(role: Role, path: string): boolean {
  const policy = getRolePolicy(role);

  // Check exact match first
  if (policy.allowedRoutes.includes(path)) {
    return true;
  }

  // Check prefix match
  return policy.allowedRoutePrefixes.some((prefix) => {
    if (prefix === "/") {
      return path === "/";
    }
    return path.startsWith(prefix);
  });
}

/**
 * All admin-only route prefixes for guard enforcement.
 */
export const ADMIN_ONLY_ROUTE_PREFIXES = ["/admin"];

/**
 * All child-only route prefixes for guard enforcement.
 */
export const CHILD_ONLY_ROUTE_PREFIXES = ["/publish", "/backup", "/profile"];
