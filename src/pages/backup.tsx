/**
 * Child Backup Page
 *
 * Child-friendly backup interface.
 * Future: backup your apps, restore from backup, cloud sync.
 */

import { HardDrive, Construction, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequireChild } from "@/components/rbac";

export default function BackupPage() {
  return (
    <RequireChild>
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-6">
          <HardDrive className="h-12 w-12 text-primary" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-4">
          <Construction className="h-4 w-4" />
          COMING SOON
        </div>

        <h1 className="text-2xl font-bold mb-2">Backup Your Work</h1>

        <p className="text-muted-foreground mb-4 max-w-md">
          Keep your apps safe! Create backups of your projects and restore them
          whenever you need.
        </p>

        <p className="text-sm text-muted-foreground mb-6">
          Your work is important - backups help protect it.
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
