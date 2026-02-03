/**
 * RBAC Navigation Tests
 *
 * Tests for role-based navigation configuration and route access.
 */

import { describe, it, expect } from "vitest";
import {
  ADMIN_NAV_ENTRIES,
  CHILD_NAV_ENTRIES,
  getNavEntriesForRole,
  getRolePolicy,
  canRoleAccessRoute,
  ADMIN_ONLY_ROUTE_PREFIXES,
  CHILD_ONLY_ROUTE_PREFIXES,
} from "../lib/rbac/navigation";
import type { Role } from "../lib/rbac/types";

describe("RBAC Navigation", () => {
  describe("Navigation Entry Configuration", () => {
    it("should have admin nav entries defined", () => {
      expect(ADMIN_NAV_ENTRIES).toBeDefined();
      expect(ADMIN_NAV_ENTRIES.length).toBeGreaterThan(0);
    });

    it("should have child nav entries defined", () => {
      expect(CHILD_NAV_ENTRIES).toBeDefined();
      expect(CHILD_NAV_ENTRIES.length).toBeGreaterThan(0);
    });

    it("admin nav should include admin-only routes", () => {
      const adminRoutes = ADMIN_NAV_ENTRIES.filter(
        (e) => e.access === "admin-only",
      );
      expect(adminRoutes.length).toBeGreaterThan(0);
      expect(adminRoutes.some((r) => r.to.startsWith("/admin"))).toBe(true);
    });

    it("child nav should include child-only routes", () => {
      const childRoutes = CHILD_NAV_ENTRIES.filter(
        (e) => e.access === "child-only",
      );
      expect(childRoutes.length).toBeGreaterThan(0);
      expect(childRoutes.some((r) => r.title === "Publish")).toBe(true);
      expect(childRoutes.some((r) => r.title === "Backup")).toBe(true);
      expect(childRoutes.some((r) => r.title === "Profile")).toBe(true);
    });

    it("admin nav should NOT include child-only routes", () => {
      const childOnlyInAdmin = ADMIN_NAV_ENTRIES.filter(
        (e) => e.access === "child-only",
      );
      expect(childOnlyInAdmin.length).toBe(0);
    });

    it("child nav should NOT include admin-only routes", () => {
      const adminOnlyInChild = CHILD_NAV_ENTRIES.filter(
        (e) => e.access === "admin-only",
      );
      expect(adminOnlyInChild.length).toBe(0);
    });
  });

  describe("getNavEntriesForRole", () => {
    it("should return admin nav entries for admin role", () => {
      const entries = getNavEntriesForRole("admin");
      expect(entries).toBe(ADMIN_NAV_ENTRIES);
    });

    it("should return child nav entries for child role", () => {
      const entries = getNavEntriesForRole("child");
      expect(entries).toBe(CHILD_NAV_ENTRIES);
    });
  });

  describe("getRolePolicy", () => {
    it("should return policy with nav entries for admin", () => {
      const policy = getRolePolicy("admin");
      expect(policy.navEntries).toBe(ADMIN_NAV_ENTRIES);
      expect(policy.allowedRoutes.length).toBeGreaterThan(0);
      expect(policy.allowedRoutePrefixes).toContain("/admin");
    });

    it("should return policy with nav entries for child", () => {
      const policy = getRolePolicy("child");
      expect(policy.navEntries).toBe(CHILD_NAV_ENTRIES);
      expect(policy.allowedRoutes.length).toBeGreaterThan(0);
      expect(policy.allowedRoutePrefixes).not.toContain("/admin");
    });

    it("child policy should include child-only prefixes", () => {
      const policy = getRolePolicy("child");
      expect(policy.allowedRoutePrefixes).toContain("/publish");
      expect(policy.allowedRoutePrefixes).toContain("/backup");
      expect(policy.allowedRoutePrefixes).toContain("/profile");
    });
  });

  describe("canRoleAccessRoute", () => {
    describe("Admin role access", () => {
      const role: Role = "admin";

      it("should allow admin to access home", () => {
        expect(canRoleAccessRoute(role, "/")).toBe(true);
      });

      it("should allow admin to access chat", () => {
        expect(canRoleAccessRoute(role, "/chat")).toBe(true);
      });

      it("should allow admin to access settings", () => {
        expect(canRoleAccessRoute(role, "/settings")).toBe(true);
      });

      it("should allow admin to access admin routes", () => {
        expect(canRoleAccessRoute(role, "/admin/users")).toBe(true);
        expect(canRoleAccessRoute(role, "/admin/diagnostics")).toBe(true);
        expect(canRoleAccessRoute(role, "/admin/vault")).toBe(true);
      });

      it("should allow admin to access hub", () => {
        expect(canRoleAccessRoute(role, "/hub")).toBe(true);
      });
    });

    describe("Child role access", () => {
      const role: Role = "child";

      it("should allow child to access home", () => {
        expect(canRoleAccessRoute(role, "/")).toBe(true);
      });

      it("should allow child to access chat", () => {
        expect(canRoleAccessRoute(role, "/chat")).toBe(true);
      });

      it("should allow child to access child-only routes", () => {
        expect(canRoleAccessRoute(role, "/publish")).toBe(true);
        expect(canRoleAccessRoute(role, "/backup")).toBe(true);
        expect(canRoleAccessRoute(role, "/profile")).toBe(true);
      });

      it("should DENY child access to admin routes", () => {
        expect(canRoleAccessRoute(role, "/admin/users")).toBe(false);
        expect(canRoleAccessRoute(role, "/admin/diagnostics")).toBe(false);
        expect(canRoleAccessRoute(role, "/admin/vault")).toBe(false);
        expect(canRoleAccessRoute(role, "/admin/publishing")).toBe(false);
      });

      it("should DENY child access to hub", () => {
        expect(canRoleAccessRoute(role, "/hub")).toBe(false);
      });

      it("should DENY child access to settings", () => {
        // Settings is admin-only in child mode
        expect(canRoleAccessRoute(role, "/settings")).toBe(false);
      });
    });
  });

  describe("Route prefix constants", () => {
    it("should define admin-only route prefixes", () => {
      expect(ADMIN_ONLY_ROUTE_PREFIXES).toContain("/admin");
    });

    it("should define child-only route prefixes", () => {
      expect(CHILD_ONLY_ROUTE_PREFIXES).toContain("/publish");
      expect(CHILD_ONLY_ROUTE_PREFIXES).toContain("/backup");
      expect(CHILD_ONLY_ROUTE_PREFIXES).toContain("/profile");
    });
  });
});

describe("Navigation Entry Structure", () => {
  it("all nav entries should have required fields", () => {
    const allEntries = [...ADMIN_NAV_ENTRIES, ...CHILD_NAV_ENTRIES];

    for (const entry of allEntries) {
      expect(entry.title).toBeDefined();
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.to).toBeDefined();
      expect(entry.to.startsWith("/")).toBe(true);
      expect(entry.icon).toBeDefined();
      expect(["admin-only", "child-only", "all"]).toContain(entry.access);
    }
  });

  it("stub entries should have docRef", () => {
    const allEntries = [...ADMIN_NAV_ENTRIES, ...CHILD_NAV_ENTRIES];
    const stubEntries = allEntries.filter((e) => e.isStub);

    for (const entry of stubEntries) {
      expect(entry.docRef).toBeDefined();
      expect(entry.docRef?.length).toBeGreaterThan(0);
    }
  });
});
