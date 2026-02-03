/**
 * Child-Only Routes
 *
 * Routes available only to child users (not admin).
 */

import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";

// Import child pages
import PublishPage from "@/pages/publish";
import BackupPage from "@/pages/backup";
import ProfilePage from "@/pages/profile";

export const publishRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/publish",
  component: PublishPage,
});

export const backupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/backup",
  component: BackupPage,
});

export const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

/**
 * All child-only routes for the route tree.
 */
export const childRoutes = [publishRoute, backupRoute, profileRoute];
