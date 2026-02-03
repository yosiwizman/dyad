/**
 * StubPage Component
 *
 * A reusable stub page for admin features that are planned but not yet implemented.
 * Displays clear "FUTURE" labeling with doc references.
 */

import { Construction, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequireAdmin } from "@/components/rbac";
import type { LucideIcon } from "lucide-react";

interface StubPageProps {
  /** Page title */
  title: string;
  /** Brief description of the feature */
  description: string;
  /** KB document reference ID */
  docRef?: string;
  /** Icon to display */
  icon?: LucideIcon;
}

export function StubPage({
  title,
  description,
  docRef,
  icon: Icon = Construction,
}: StubPageProps) {
  return (
    <RequireAdmin>
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="rounded-full bg-amber-500/10 p-4 mb-6">
          <Icon className="h-12 w-12 text-amber-500" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-4">
          <Construction className="h-4 w-4" />
          FUTURE
        </div>

        <h1 className="text-2xl font-bold mb-2">{title}</h1>

        <p className="text-muted-foreground mb-4 max-w-md">{description}</p>

        {docRef && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <span>Reference:</span>
            <code className="px-2 py-0.5 rounded bg-muted font-mono">
              {docRef}
            </code>
          </div>
        )}

        <Button variant="outline" asChild>
          <a
            href="https://github.com/yosiwizman/dyad/tree/main/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Documentation
          </a>
        </Button>
      </div>
    </RequireAdmin>
  );
}
