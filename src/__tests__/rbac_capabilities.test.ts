/**
 * RBAC Capabilities Unit Tests
 *
 * Security-critical tests ensuring:
 * 1. Child role never has admin-only capabilities (integrations, secrets, etc.)
 * 2. Default-deny behavior for unknown capabilities
 * 3. Authorization helper returns correct 403 responses
 */

import { describe, it, expect } from "vitest";
import {
  Capability,
  getCapabilitiesForRole,
  roleHasCapability,
  createCapabilityChecker,
  ADMIN_ONLY_CAPABILITIES,
  type CapabilityId,
} from "../lib/rbac/capabilities";
import {
  authorizeCapability,
  authorizeAdminAccess,
  createForbiddenError,
  isAuthorizationError,
} from "../lib/rbac/authorization";

describe("RBAC Capabilities", () => {
  describe("Role Capability Mapping", () => {
    it("admin should have all defined capabilities", () => {
      const adminCapabilities = getCapabilitiesForRole("admin");
      expect(adminCapabilities.length).toBeGreaterThan(0);

      // Admin should have all admin-only capabilities
      for (const cap of ADMIN_ONLY_CAPABILITIES) {
        expect(adminCapabilities).toContain(cap);
      }
    });

    it("child should have limited capabilities", () => {
      const childCapabilities = getCapabilitiesForRole("child");
      expect(childCapabilities.length).toBeGreaterThan(0);
      expect(childCapabilities.length).toBeLessThan(
        getCapabilitiesForRole("admin").length,
      );
    });
  });

  describe("Child Role Security (Critical)", () => {
    const childCapabilities = getCapabilitiesForRole("child");

    it("child should NEVER have MANAGE_INTEGRATIONS capability", () => {
      expect(childCapabilities).not.toContain(Capability.MANAGE_INTEGRATIONS);
      expect(roleHasCapability("child", Capability.MANAGE_INTEGRATIONS)).toBe(
        false,
      );
    });

    it("child should NEVER have MANAGE_VAULT capability", () => {
      expect(childCapabilities).not.toContain(Capability.MANAGE_VAULT);
      expect(roleHasCapability("child", Capability.MANAGE_VAULT)).toBe(false);
    });

    it("child should NEVER have MANAGE_USERS capability", () => {
      expect(childCapabilities).not.toContain(Capability.MANAGE_USERS);
      expect(roleHasCapability("child", Capability.MANAGE_USERS)).toBe(false);
    });

    it("child should NEVER have MANAGE_SETTINGS_FULL capability", () => {
      expect(childCapabilities).not.toContain(Capability.MANAGE_SETTINGS_FULL);
      expect(roleHasCapability("child", Capability.MANAGE_SETTINGS_FULL)).toBe(
        false,
      );
    });

    it("child should NEVER have ACCESS_ADMIN_ROUTES capability", () => {
      expect(childCapabilities).not.toContain(Capability.ACCESS_ADMIN_ROUTES);
      expect(roleHasCapability("child", Capability.ACCESS_ADMIN_ROUTES)).toBe(
        false,
      );
    });

    it("child should NEVER have VIEW_DIAGNOSTICS capability", () => {
      expect(childCapabilities).not.toContain(Capability.VIEW_DIAGNOSTICS);
      expect(roleHasCapability("child", Capability.VIEW_DIAGNOSTICS)).toBe(
        false,
      );
    });

    it("child should NEVER have any ADMIN_ONLY_CAPABILITIES", () => {
      for (const adminCap of ADMIN_ONLY_CAPABILITIES) {
        expect(childCapabilities).not.toContain(adminCap);
        expect(roleHasCapability("child", adminCap)).toBe(false);
      }
    });
  });

  describe("Child Role Allowed Capabilities", () => {
    it("child should have CREATE_APPS capability", () => {
      expect(roleHasCapability("child", Capability.CREATE_APPS)).toBe(true);
    });

    it("child should have USE_CHAT capability", () => {
      expect(roleHasCapability("child", Capability.USE_CHAT)).toBe(true);
    });

    it("child should have VIEW_LIBRARY capability", () => {
      expect(roleHasCapability("child", Capability.VIEW_LIBRARY)).toBe(true);
    });

    it("child should have MANAGE_PROFILE capability", () => {
      expect(roleHasCapability("child", Capability.MANAGE_PROFILE)).toBe(true);
    });
  });

  describe("roleHasCapability", () => {
    it("should return true for granted capabilities", () => {
      expect(roleHasCapability("admin", Capability.MANAGE_VAULT)).toBe(true);
      expect(roleHasCapability("child", Capability.CREATE_APPS)).toBe(true);
    });

    it("should return false for ungranted capabilities (default-deny)", () => {
      expect(roleHasCapability("child", Capability.MANAGE_VAULT)).toBe(false);
    });

    it("should return false for unknown capability string", () => {
      expect(
        roleHasCapability("admin", "unknown-capability" as CapabilityId),
      ).toBe(false);
    });
  });

  describe("createCapabilityChecker", () => {
    it("should create a bound checker for admin role", () => {
      const canAdmin = createCapabilityChecker("admin");
      expect(canAdmin(Capability.MANAGE_VAULT)).toBe(true);
      expect(canAdmin(Capability.CREATE_APPS)).toBe(true);
    });

    it("should create a bound checker for child role", () => {
      const canChild = createCapabilityChecker("child");
      expect(canChild(Capability.CREATE_APPS)).toBe(true);
      expect(canChild(Capability.MANAGE_VAULT)).toBe(false);
    });
  });
});

describe("RBAC Authorization Helper", () => {
  describe("authorizeCapability", () => {
    it("should return success for valid role with capability", () => {
      const result = authorizeCapability("admin", Capability.MANAGE_VAULT);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.role).toBe("admin");
        expect(result.decisionId).toBeDefined();
      }
    });

    it("should return 403 for role without capability", () => {
      const result = authorizeCapability("child", Capability.MANAGE_VAULT);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(403);
        expect(result.reasonCode).toBe("ROLE_MISSING");
        expect(result.message).toBe("Forbidden");
        expect(result.decisionId).toBeDefined();
      }
    });

    it("should return 403 for null role", () => {
      const result = authorizeCapability(null, Capability.MANAGE_VAULT);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(403);
        expect(result.reasonCode).toBe("SESSION_INVALID");
      }
    });

    it("should return 403 for undefined role", () => {
      const result = authorizeCapability(undefined, Capability.MANAGE_VAULT);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reasonCode).toBe("SESSION_INVALID");
      }
    });
  });

  describe("authorizeAdminAccess", () => {
    it("should return success for admin role", () => {
      const result = authorizeAdminAccess("admin");
      expect(result.ok).toBe(true);
    });

    it("should return 403 for child role", () => {
      const result = authorizeAdminAccess("child");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(403);
        expect(result.reasonCode).toBe("ROLE_MISSING");
      }
    });

    it("should return 403 for null role", () => {
      const result = authorizeAdminAccess(null);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reasonCode).toBe("SESSION_INVALID");
      }
    });
  });

  describe("createForbiddenError", () => {
    it("should create a standardized 403 error", () => {
      const error = createForbiddenError();
      expect(error.ok).toBe(false);
      expect(error.status).toBe(403);
      expect(error.reasonCode).toBe("CAPABILITY_DENIED");
      expect(error.message).toBe("Forbidden");
      expect(error.decisionId).toBeDefined();
    });

    it("should accept custom reason code", () => {
      const error = createForbiddenError("SESSION_INVALID");
      expect(error.reasonCode).toBe("SESSION_INVALID");
    });
  });

  describe("isAuthorizationError", () => {
    it("should return true for error results", () => {
      const errorResult = authorizeCapability("child", Capability.MANAGE_VAULT);
      expect(isAuthorizationError(errorResult)).toBe(true);
    });

    it("should return false for success results", () => {
      const successResult = authorizeCapability(
        "admin",
        Capability.MANAGE_VAULT,
      );
      expect(isAuthorizationError(successResult)).toBe(false);
    });
  });
});

describe("Capability Constants Integrity", () => {
  it("ADMIN_ONLY_CAPABILITIES should contain integrations-related caps", () => {
    expect(ADMIN_ONLY_CAPABILITIES).toContain(Capability.MANAGE_INTEGRATIONS);
  });

  it("ADMIN_ONLY_CAPABILITIES should contain vault-related caps", () => {
    expect(ADMIN_ONLY_CAPABILITIES).toContain(Capability.MANAGE_VAULT);
  });

  it("ADMIN_ONLY_CAPABILITIES should contain settings full access", () => {
    expect(ADMIN_ONLY_CAPABILITIES).toContain(Capability.MANAGE_SETTINGS_FULL);
  });

  it("all ADMIN_ONLY_CAPABILITIES should be granted to admin role", () => {
    const adminCaps = getCapabilitiesForRole("admin");
    for (const cap of ADMIN_ONLY_CAPABILITIES) {
      expect(adminCaps).toContain(cap);
    }
  });
});
