/**
 * Child Publish Page
 *
 * Child-friendly publishing interface managed by ABBA.
 * Future: simple publish flow, status tracking, share links.
 */

import { Upload, Construction, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequireChild } from "@/components/rbac";

export default function PublishPage() {
  return (
    <RequireChild>
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-6">
          <Upload className="h-12 w-12 text-primary" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-4">
          <Construction className="h-4 w-4" />
          COMING SOON
        </div>

        <h1 className="text-2xl font-bold mb-2">Publish Your App</h1>

        <p className="text-muted-foreground mb-4 max-w-md">
          Share your creations with the world! ABBA handles all the technical
          details so you can focus on building awesome apps.
        </p>

        <p className="text-sm text-muted-foreground mb-6">
          Publishing is managed by ABBA to keep things safe and simple.
        </p>

        <Button variant="outline" asChild>
          <a
            href="https://github.com/yosiwizman/dyad/tree/main/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Learn More
          </a>
        </Button>
      </div>
    </RequireChild>
  );
}
