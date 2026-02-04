/**
 * RBAC Authorization Helper for IPC/API Boundaries
 *
 * Provides standardized authorization checks and error responses for
 * privileged operations. This is the enforcement layer - UI hiding is
 * NOT a security control.
 *
 * Usage in IPC handlers:
 *   const authResult = authorizeCapability(role, Capability.MANAGE_VAULT);
 *   if (!authResult.ok) {
 *     return authResult; // Returns standardized 403 response
 *   }
 *   // Proceed with operation
 */

import type { Role } from "./types";
import { roleHasCapability, type CapabilityId } from "./capabilities";

/**
 * Standardized authorization error response.
 * Follows OWASP guidelines - no sensitive info in error messages.
 */
export interface AuthorizationError {
  ok: false;
  status: 403;
  reasonCode: "ROLE_MISSING" | "CAPABILITY_DENIED" | "SESSION_INVALID";
  message: string;
  decisionId: string;
}

/**
 * Successful authorization result.
 */
export interface AuthorizationSuccess {
  ok: true;
  role: Role;
  decisionId: string;
}

export type AuthorizationResult = AuthorizationSuccess | AuthorizationError;

/**
 * Generate a unique decision ID for audit logging.
 * Format: authz_<timestamp>_<random>
 */
function generateDecisionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `authz_${timestamp}_${random}`;
}

/**
 * Authorize a role to perform an action requiring a specific capability.
 *
 * @param role The role attempting the action
 * @param requiredCapability The capability required for the action
 * @returns AuthorizationSuccess if allowed, AuthorizationError if denied
 */
export function authorizeCapability(
  role: Role | null | undefined,
  requiredCapability: CapabilityId,
): AuthorizationResult {
  const decisionId = generateDecisionId();

  // Check for valid session/role
  if (!role) {
    return {
      ok: false,
      status: 403,
      reasonCode: "SESSION_INVALID",
      message: "Forbidden",
      decisionId,
    };
  }

  // Check capability
  if (!roleHasCapability(role, requiredCapability)) {
    // Log decision for audit (without sensitive details)
    console.log(
      `[RBAC] Access denied: role=${role} capability=${requiredCapability} decision=${decisionId}`,
    );

    return {
      ok: false,
      status: 403,
      reasonCode: "ROLE_MISSING",
      message: "Forbidden",
      decisionId,
    };
  }

  return {
    ok: true,
    role,
    decisionId,
  };
}

/**
 * Authorize a role to access an admin-only resource.
 * Convenience wrapper for common admin-only checks.
 *
 * @param role The role attempting access
 * @returns AuthorizationResult
 */
export function authorizeAdminAccess(
  role: Role | null | undefined,
): AuthorizationResult {
  const decisionId = generateDecisionId();

  if (!role) {
    return {
      ok: false,
      status: 403,
      reasonCode: "SESSION_INVALID",
      message: "Forbidden",
      decisionId,
    };
  }

  if (role !== "admin") {
    console.log(
      `[RBAC] Admin access denied: role=${role} decision=${decisionId}`,
    );

    return {
      ok: false,
      status: 403,
      reasonCode: "ROLE_MISSING",
      message: "Forbidden",
      decisionId,
    };
  }

  return {
    ok: true,
    role,
    decisionId,
  };
}

/**
 * Create a standardized 403 error for IPC handlers.
 * Use when you need to manually construct an error response.
 *
 * @param reasonCode The reason for denial
 * @returns AuthorizationError object
 */
export function createForbiddenError(
  reasonCode: AuthorizationError["reasonCode"] = "CAPABILITY_DENIED",
): AuthorizationError {
  return {
    ok: false,
    status: 403,
    reasonCode,
    message: "Forbidden",
    decisionId: generateDecisionId(),
  };
}

/**
 * Type guard to check if a result is an authorization error.
 */
export function isAuthorizationError(
  result: AuthorizationResult,
): result is AuthorizationError {
  return !result.ok;
}

/**
 * Assert authorization and throw if denied.
 * Use in contexts where throwing is appropriate.
 *
 * @param role The role to check
 * @param requiredCapability The required capability
 * @throws Error with 403 status if denied
 */
export function assertCapability(
  role: Role | null | undefined,
  requiredCapability: CapabilityId,
): asserts role is Role {
  const result = authorizeCapability(role, requiredCapability);
  if (!result.ok) {
    const error = new Error("Forbidden") as Error & {
      status: number;
      reasonCode: string;
    };
    error.status = 403;
    error.reasonCode = result.reasonCode;
    throw error;
  }
}
