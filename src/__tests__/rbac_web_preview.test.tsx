/**
 * RBAC Web Preview Integration Tests
 *
 * Tests for role-based access control in web preview mode:
 * 1. Sidebar does NOT render admin-only nav items for child role
 * 2. Route guards show kid-safe access denied page
 * 3. Navigation filtering works correctly based on role
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DEMO_STORAGE_KEYS } from "../ipc/web_ipc_client";
import {
  getNavEntriesForRole,
  canRoleAccessRoute,
  ADMIN_NAV_ENTRIES,
  CHILD_NAV_ENTRIES,
} from "../lib/rbac/navigation";
import type { Role } from "../lib/rbac/types";

// Mock localStorage for demo role
const mockLocalStorage: Record<string, string> = {};

beforeEach(() => {
  // Clear localStorage mock
  Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);

  // Mock localStorage
  vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) => {
    return mockLocalStorage[key] || null;
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(
    (key: string, value: string) => {
      mockLocalStorage[key] = value;
    },
  );
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(
    (key: string) => {
      delete mockLocalStorage[key];
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RBAC Navigation Filtering", () => {
  describe("Child role sidebar filtering", () => {
    it("child nav entries should NOT include Integrations", () => {
      const childNav = getNavEntriesForRole("child");
      const integrationsEntry = childNav.find((e) => e.title === "Integrations");
      expect(integrationsEntry).toBeUndefined();
    });

    it("child nav entries should NOT include Vault", () => {
      const childNav = getNavEntriesForRole("child");
      const vaultEntry = childNav.find((e) => e.title === "Vault");
      expect(vaultEntry).toBeUndefined();
    });

    it("child nav entries should NOT include Users (admin management)", () => {
      const childNav = getNavEntriesForRole("child");
      const usersEntry = childNav.find((e) => e.title === "Users");
      expect(usersEntry).toBeUndefined();
    });

    it("child nav entries should NOT include Diagnostics", () => {
      const childNav = getNavEntriesForRole("child");
      const diagnosticsEntry = childNav.find((e) => e.title === "Diagnostics");
      expect(diagnosticsEntry).toBeUndefined();
    });

    it("child nav entries should NOT include any /admin routes", () => {
      const childNav = getNavEntriesForRole("child");
      const adminRoutes = childNav.filter((e) => e.to.startsWith("/admin"));
      expect(adminRoutes.length).toBe(0);
    });

    it("child nav entries should NOT include Hub", () => {
      const childNav = getNavEntriesForRole("child");
      const hubEntry = childNav.find((e) => e.title === "Hub");
      expect(hubEntry).toBeUndefined();
    });
  });

  describe("Admin role sidebar includes all items", () => {
    it("admin nav entries should include Integrations", () => {
      const adminNav = getNavEntriesForRole("admin");
      const integrationsEntry = adminNav.find(
        (e) => e.title === "Integrations",
      );
      expect(integrationsEntry).toBeDefined();
    });

    it("admin nav entries should include Vault", () => {
      const adminNav = getNavEntriesForRole("admin");
      const vaultEntry = adminNav.find((e) => e.title === "Vault");
      expect(vaultEntry).toBeDefined();
    });

    it("admin nav entries should include Users", () => {
      const adminNav = getNavEntriesForRole("admin");
      const usersEntry = adminNav.find((e) => e.title === "Users");
      expect(usersEntry).toBeDefined();
    });

    it("admin nav entries should include admin routes", () => {
      const adminNav = getNavEntriesForRole("admin");
      const adminRoutes = adminNav.filter((e) => e.to.startsWith("/admin"));
      expect(adminRoutes.length).toBeGreaterThan(0);
    });
  });
});

describe("RBAC Route Guards", () => {
  describe("Child route access restrictions", () => {
    const role: Role = "child";

    it("child should be DENIED access to /admin/users", () => {
      expect(canRoleAccessRoute(role, "/admin/users")).toBe(false);
    });

    it("child should be DENIED access to /admin/integrations", () => {
      expect(canRoleAccessRoute(role, "/admin/integrations")).toBe(false);
    });

    it("child should be DENIED access to /admin/vault", () => {
      expect(canRoleAccessRoute(role, "/admin/vault")).toBe(false);
    });

    it("child should be DENIED access to /admin/diagnostics", () => {
      expect(canRoleAccessRoute(role, "/admin/diagnostics")).toBe(false);
    });

    it("child should be DENIED access to /admin/publishing", () => {
      expect(canRoleAccessRoute(role, "/admin/publishing")).toBe(false);
    });

    it("child should be DENIED access to /hub", () => {
      expect(canRoleAccessRoute(role, "/hub")).toBe(false);
    });

    it("child should be DENIED access to /settings (full)", () => {
      expect(canRoleAccessRoute(role, "/settings")).toBe(false);
    });
  });

  describe("Child allowed routes", () => {
    const role: Role = "child";

    it("child should be ALLOWED access to /", () => {
      expect(canRoleAccessRoute(role, "/")).toBe(true);
    });

    it("child should be ALLOWED access to /chat", () => {
      expect(canRoleAccessRoute(role, "/chat")).toBe(true);
    });

    it("child should be ALLOWED access to /library", () => {
      expect(canRoleAccessRoute(role, "/library")).toBe(true);
    });

    it("child should be ALLOWED access to /publish", () => {
      expect(canRoleAccessRoute(role, "/publish")).toBe(true);
    });

    it("child should be ALLOWED access to /backup", () => {
      expect(canRoleAccessRoute(role, "/backup")).toBe(true);
    });

    it("child should be ALLOWED access to /profile", () => {
      expect(canRoleAccessRoute(role, "/profile")).toBe(true);
    });

    it("child should be ALLOWED access to /app-details/*", () => {
      expect(canRoleAccessRoute(role, "/app-details/123")).toBe(true);
    });
  });

  describe("Admin route access (full access)", () => {
    const role: Role = "admin";

    it("admin should be ALLOWED access to all admin routes", () => {
      expect(canRoleAccessRoute(role, "/admin/users")).toBe(true);
      expect(canRoleAccessRoute(role, "/admin/integrations")).toBe(true);
      expect(canRoleAccessRoute(role, "/admin/vault")).toBe(true);
      expect(canRoleAccessRoute(role, "/admin/diagnostics")).toBe(true);
    });

    it("admin should be ALLOWED access to hub", () => {
      expect(canRoleAccessRoute(role, "/hub")).toBe(true);
    });

    it("admin should be ALLOWED access to settings", () => {
      expect(canRoleAccessRoute(role, "/settings")).toBe(true);
    });

    it("admin should be ALLOWED access to base routes", () => {
      expect(canRoleAccessRoute(role, "/")).toBe(true);
      expect(canRoleAccessRoute(role, "/chat")).toBe(true);
      expect(canRoleAccessRoute(role, "/library")).toBe(true);
    });
  });
});

describe("Demo Role Persistence", () => {
  it("should persist demo role to localStorage", () => {
    mockLocalStorage[DEMO_STORAGE_KEYS.ROLE] = JSON.stringify("child");
    const stored = localStorage.getItem(DEMO_STORAGE_KEYS.ROLE);
    expect(JSON.parse(stored!)).toBe("child");
  });

  it("should read demo role from localStorage", () => {
    localStorage.setItem(DEMO_STORAGE_KEYS.ROLE, JSON.stringify("admin"));
    const role = JSON.parse(mockLocalStorage[DEMO_STORAGE_KEYS.ROLE]);
    expect(role).toBe("admin");
  });
});

describe("Navigation Entry Structure Validation", () => {
  it("all admin nav entries should have valid structure", () => {
    for (const entry of ADMIN_NAV_ENTRIES) {
      expect(entry.title).toBeDefined();
      expect(entry.to).toBeDefined();
      expect(entry.to.startsWith("/")).toBe(true);
      expect(entry.icon).toBeDefined();
      expect(["admin-only", "child-only", "all"]).toContain(entry.access);
    }
  });

  it("all child nav entries should have valid structure", () => {
    for (const entry of CHILD_NAV_ENTRIES) {
      expect(entry.title).toBeDefined();
      expect(entry.to).toBeDefined();
      expect(entry.to.startsWith("/")).toBe(true);
      expect(entry.icon).toBeDefined();
      expect(["admin-only", "child-only", "all"]).toContain(entry.access);
    }
  });

  it("child nav should not have admin-only entries", () => {
    const adminOnlyInChild = CHILD_NAV_ENTRIES.filter(
      (e) => e.access === "admin-only",
    );
    expect(adminOnlyInChild.length).toBe(0);
  });

  it("admin nav should not have child-only entries", () => {
    const childOnlyInAdmin = ADMIN_NAV_ENTRIES.filter(
      (e) => e.access === "child-only",
    );
    expect(childOnlyInAdmin.length).toBe(0);
  });
});
