/**
 * RequireRole Component
 *
 * Route guard component that enforces role-based access control.
 * Wraps page content and blocks access if the user's role doesn't match.
 *
 * Security Note: This is defense-in-depth. Backend validation should also
 * be applied for any sensitive operations.
 */

import type { ReactNode } from "react";
import { useRole } from "@/contexts/RoleContext";
import type { Role } from "@/lib/rbac/types";
import { AccessDenied } from "./AccessDenied";

interface RequireRoleProps {
  /** The role required to view this content */
  requiredRole: Role;
  /** Content to render if access is allowed */
  children: ReactNode;
  /** Optional: Allow multiple roles */
  allowedRoles?: Role[];
  /** Optional custom message for access denied */
  deniedMessage?: string;
}

/**
 * RequireRole - Enforces role-based access at the component/route level.
 *
 * Usage:
 * ```tsx
 * <RequireRole requiredRole="admin">
 *   <AdminOnlyContent />
 * </RequireRole>
 * ```
 */
export function RequireRole({
  requiredRole,
  children,
  allowedRoles,
  deniedMessage,
}: RequireRoleProps) {
  const { role: currentRole, isLoading } = useRole();

  // While loading, show nothing (could show skeleton if desired)
  if (isLoading) {
    return null;
  }

  // Check access
  const allowed = allowedRoles
    ? allowedRoles.includes(currentRole)
    : currentRole === requiredRole;

  if (!allowed) {
    return (
      <AccessDenied
        requiredRole={requiredRole}
        currentRole={currentRole}
        message={deniedMessage}
      />
    );
  }

  return <>{children}</>;
}

/**
 * RequireAdmin - Convenience wrapper for admin-only content.
 */
export function RequireAdmin({
  children,
  deniedMessage,
}: {
  children: ReactNode;
  deniedMessage?: string;
}) {
  return (
    <RequireRole requiredRole="admin" deniedMessage={deniedMessage}>
      {children}
    </RequireRole>
  );
}

/**
 * RequireChild - Convenience wrapper for child-only content.
 */
export function RequireChild({
  children,
  deniedMessage,
}: {
  children: ReactNode;
  deniedMessage?: string;
}) {
  return (
    <RequireRole requiredRole="child" deniedMessage={deniedMessage}>
      {children}
    </RequireRole>
  );
}
