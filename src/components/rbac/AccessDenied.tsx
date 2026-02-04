/**
 * AccessDenied Component
 *
 * Displayed when a user attempts to access a route they don't have permission for.
 * This is a hard block, not just a hidden UI element.
 *
 * For child users, shows a friendly "Ask owner for help" message.
 * No technical details like stack traces or error codes are exposed.
 */

import { ShieldX, Lock, ArrowLeft, Home } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/rbac/types";

interface AccessDeniedProps {
  /** The role that is required to access this route */
  requiredRole: Role;
  /** The current user's role */
  currentRole: Role;
  /** Optional message to display */
  message?: string;
  /** Whether to show detailed info (false for child mode) */
  showDetails?: boolean;
}

/**
 * Kid-safe access denied page shown to child users.
 * Simple, friendly message without technical details.
 */
function ChildAccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-6 mb-6">
        <Lock className="h-16 w-16 text-amber-600 dark:text-amber-400" />
      </div>

      <h1 className="text-2xl font-bold mb-3">Oops! This area is locked</h1>

      <p className="text-muted-foreground mb-6 max-w-sm text-lg">
        Ask a parent or guardian to help you access this page.
      </p>

      <Button asChild size="lg" className="gap-2">
        <Link to="/">
          <Home className="h-5 w-5" />
          Go Home
        </Link>
      </Button>
    </div>
  );
}

/**
 * Standard access denied page for admin users or when details are requested.
 */
function AdminAccessDenied({
  requiredRole,
  currentRole,
  message,
}: Omit<AccessDeniedProps, "showDetails">) {
  const defaultMessage =
    requiredRole === "admin"
      ? "This page is only accessible to administrators."
      : "This page is only accessible to child profiles.";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-6">
        <ShieldX className="h-12 w-12 text-destructive" />
      </div>

      <h1 className="text-2xl font-bold mb-2">Access Denied</h1>

      <p className="text-muted-foreground mb-2 max-w-md">
        {message || defaultMessage}
      </p>

      <p className="text-sm text-muted-foreground mb-6">
        Your role: <span className="font-medium capitalize">{currentRole}</span>
        {" · "}
        Required: <span className="font-medium capitalize">{requiredRole}</span>
      </p>

      <Button asChild variant="outline">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go to Home
        </Link>
      </Button>
    </div>
  );
}

/**
 * AccessDenied - Shows appropriate access denied UI based on user role.
 *
 * Child users see a friendly, kid-safe message.
 * Admin users (or when explicitly requested) see detailed info.
 */
export function AccessDenied({
  requiredRole,
  currentRole,
  message,
  showDetails,
}: AccessDeniedProps) {
  // For child users trying to access admin content, show kid-safe page
  const isChildBlockedFromAdmin =
    currentRole === "child" && requiredRole === "admin";

  if (isChildBlockedFromAdmin && showDetails !== true) {
    return <ChildAccessDenied />;
  }

  return (
    <AdminAccessDenied
      requiredRole={requiredRole}
      currentRole={currentRole}
      message={message}
    />
  );
}
