/**
 * Admin Routes
 *
 * All routes under /admin/* are admin-only and protected by RequireAdmin guards.
 */

import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../root";

// Import admin pages
import AdminUsersPage from "@/pages/admin/users";
import AdminTemplatesPage from "@/pages/admin/templates";
import AdminDiagnosticsPage from "@/pages/admin/diagnostics";
import AdminPublishingPage from "@/pages/admin/publishing";
import AdminVaultPage from "@/pages/admin/vault";
import AdminIntegrationsPage from "@/pages/admin/integrations";
import AdminGitPage from "@/pages/admin/git";
import AdminObservabilityPage from "@/pages/admin/observability";

export const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/users",
  component: AdminUsersPage,
});

export const adminTemplatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/templates",
  component: AdminTemplatesPage,
});

export const adminDiagnosticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/diagnostics",
  component: AdminDiagnosticsPage,
});

export const adminPublishingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/publishing",
  component: AdminPublishingPage,
});

export const adminVaultRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/vault",
  component: AdminVaultPage,
});

export const adminIntegrationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/integrations",
  component: AdminIntegrationsPage,
});

export const adminGitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/git",
  component: AdminGitPage,
});

export const adminObservabilityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/observability",
  component: AdminObservabilityPage,
});

/**
 * All admin routes for the route tree.
 */
export const adminRoutes = [
  adminUsersRoute,
  adminTemplatesRoute,
  adminDiagnosticsRoute,
  adminPublishingRoute,
  adminVaultRoute,
  adminIntegrationsRoute,
  adminGitRoute,
  adminObservabilityRoute,
];
