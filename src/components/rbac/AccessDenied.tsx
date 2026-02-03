/**
 * AccessDenied Component
 *
 * Displayed when a user attempts to access a route they don't have permission for.
 * This is a hard block, not just a hidden UI element.
 */

import { ShieldX, ArrowLeft } from "lucide-react";
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
}

export function AccessDenied({
  requiredRole,
  currentRole,
  message,
}: AccessDeniedProps) {
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
