/**
 * DemoModeControls
 *
 * Provides demo-mode-specific controls for web preview, including:
 * - Role switcher (admin/child) for RBAC testing
 * - Reset demo data button to clear localStorage
 *
 * Only visible in web preview mode.
 */

import { useState } from "react";
import { isWebPreviewMode } from "@/lib/platform/bridge";
import { useRole } from "@/contexts/RoleContext";
import { clearDemoData } from "@/ipc/web_ipc_client";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Baby,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Monitor,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function DemoModeControls() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { role, switchRole } = useRole();

  // Only render in web preview mode
  if (!isWebPreviewMode()) {
    return null;
  }

  const handleReset = () => {
    if (
      window.confirm(
        "Reset all demo data? This will clear profiles and log you out.",
      )
    ) {
      clearDemoData();
      window.location.reload();
    }
  };

  const toggleRole = () => {
    if (switchRole) {
      switchRole(role === "admin" ? "child" : "admin");
    }
  };

  return (
    <TooltipProvider>
      <div className="border-t border-border p-2 bg-amber-500/10">
        {/* Collapsed view - just an indicator */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 rounded px-2 py-1 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Monitor className="h-3.5 w-3.5" />
            <span className="font-medium">Demo Mode</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Expanded controls */}
        {isExpanded && (
          <div className="mt-2 space-y-2">
            {/* Role indicator and switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Role:</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleRole}
                    className={`flex-1 h-7 text-xs ${
                      role === "admin"
                        ? "border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                        : "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                    }`}
                  >
                    {role === "admin" ? (
                      <>
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </>
                    ) : (
                      <>
                        <Baby className="h-3 w-3 mr-1" />
                        Child
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>
                    Click to switch to {role === "admin" ? "Child" : "Admin"}{" "}
                    role
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Reset button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="w-full h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset Demo Data
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Clear all demo profiles and start fresh</p>
              </TooltipContent>
            </Tooltip>

            {/* Info text */}
            <p className="text-[10px] text-muted-foreground text-center px-1">
              Demo mode stores data in localStorage.{" "}
              <a
                href="https://github.com/yosiwizman/dyad/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                Get the desktop app
              </a>{" "}
              for full features.
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
