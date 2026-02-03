/**
 * Child Profile Page
 *
 * Child profile management interface.
 * Future: avatar selection, preferences, achievements.
 */

import { User, Construction, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequireChild } from "@/components/rbac";
import { useProfile } from "@/contexts/ProfileContext";

export default function ProfilePage() {
  const { activeProfile } = useProfile();

  return (
    <RequireChild>
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-6">
          <User className="h-12 w-12 text-primary" />
        </div>

        {activeProfile && (
          <div className="mb-4">
            <p className="text-lg font-medium">
              Welcome, {activeProfile.profileName}!
            </p>
          </div>
        )}

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-4">
          <Construction className="h-4 w-4" />
          COMING SOON
        </div>

        <h1 className="text-2xl font-bold mb-2">Your Profile</h1>

        <p className="text-muted-foreground mb-4 max-w-md">
          Customize your profile! Choose an avatar, set your preferences, and
          track your achievements.
        </p>

        <p className="text-sm text-muted-foreground mb-6">
          More profile features are coming soon.
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
