/**
 * ProfileCard Component
 *
 * Displays a profile with colorful avatar for selection.
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";
import type { ProfileSummary } from "@/profiles/profile_types";

interface ProfileCardProps {
  profile: ProfileSummary;
  isSelected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export function ProfileCard({
  profile,
  isSelected = false,
  onClick,
  size = "md",
}: ProfileCardProps) {
  const sizeClasses = {
    sm: {
      container: "w-20 p-2",
      avatar: "h-12 w-12 text-xl",
      name: "text-xs",
    },
    md: {
      container: "w-28 p-3",
      avatar: "h-16 w-16 text-2xl",
      name: "text-sm",
    },
    lg: {
      container: "w-36 p-4",
      avatar: "h-20 w-20 text-3xl",
      name: "text-base",
    },
  };

  const classes = sizeClasses[size];

  // Get first letter of name for avatar
  const initial = profile.name.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl transition-all",
        "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary",
        classes.container,
        isSelected && "bg-accent ring-2 ring-primary",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full font-bold text-white shadow-lg transition-transform",
          "hover:scale-105",
          classes.avatar,
        )}
        style={{ backgroundColor: profile.avatarColor || "#8B5CF6" }}
      >
        {initial}

        {/* Admin badge */}
        {profile.isAdmin && (
          <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
            <Crown className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      {/* Name */}
      <span
        className={cn(
          "font-medium text-foreground truncate w-full text-center",
          classes.name,
        )}
      >
        {profile.name}
      </span>
    </button>
  );
}

/**
 * ProfileAvatar - Smaller avatar for use in headers/sidebars
 */
interface ProfileAvatarProps {
  profile: ProfileSummary;
  size?: "xs" | "sm" | "md";
  onClick?: () => void;
}

export function ProfileAvatar({
  profile,
  size = "sm",
  onClick,
}: ProfileAvatarProps) {
  const sizeClasses = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
  };

  const initial = profile.name.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-full font-bold text-white transition-transform",
        "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary",
        sizeClasses[size],
      )}
      style={{ backgroundColor: profile.avatarColor || "#8B5CF6" }}
      title={profile.name}
    >
      {initial}
    </button>
  );
}
