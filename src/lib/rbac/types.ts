/**
 * RBAC (Role-Based Access Control) Types
 *
 * Defines the canonical role types and capabilities for Admin vs Child mode.
 * See docs/ops/ADMIN_CHILD_MODES.md for full documentation.
 *
 * Security Note: UI hiding is NOT a security control. Route guards enforce
 * access at the routing layer, and backend validation should also be applied.
 */

/**
 * User roles in the ABBA AI system.
 *
 * - `admin`: Full access to all features including user management, vault ops,
 *           publishing ops, diagnostics, integrations, and observability.
 * - `child`: Limited access focused on app creation and usage. No access to
 *           admin operations or system configuration.
 */
export type Role = "admin" | "child";

/**
 * Route access levels defining which roles can access a route.
 */
export type RouteAccess = "admin-only" | "child-only" | "all";

/**
 * Navigation entry definition for sidebar items.
 */
export interface NavEntry {
  /** Display title in sidebar */
  title: string;
  /** Route path */
  to: string;
  /** Lucide icon component name */
  icon: string;
  /** Which roles can see/access this entry */
  access: RouteAccess;
  /** Optional: Doc ID reference for stub pages */
  docRef?: string;
  /** Optional: Whether this is a stub/future feature */
  isStub?: boolean;
}

/**
 * Policy object mapping roles to their allowed capabilities.
 */
export interface RolePolicy {
  /** Navigation entries visible to this role */
  navEntries: NavEntry[];
  /** Route paths this role can access (for guards) */
  allowedRoutes: string[];
  /** Route path prefixes this role can access */
  allowedRoutePrefixes: string[];
}

/**
 * Session role context shape for React context.
 */
export interface SessionRoleContext {
  /** Current active role */
  role: Role;
  /** Whether role is still being determined */
  isLoading: boolean;
  /** Check if current role can access a route */
  canAccessRoute: (path: string) => boolean;
  /** Check if current role has a specific capability */
  hasCapability: (capability: string) => boolean;
  /** Dev-only: Switch role for testing */
  switchRole?: (role: Role) => void;
}

/**
 * Route guard result when access is denied.
 */
export interface AccessDeniedResult {
  allowed: false;
  reason: "unauthorized" | "forbidden";
  requiredRole: Role;
  currentRole: Role;
  redirectTo?: string;
}

/**
 * Route guard result when access is allowed.
 */
export interface AccessAllowedResult {
  allowed: true;
}

export type RouteGuardResult = AccessAllowedResult | AccessDeniedResult;
