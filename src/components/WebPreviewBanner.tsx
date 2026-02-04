/**
 * WebPreviewBanner
 *
 * Displays a non-intrusive banner at the top of the app when running in
 * web preview mode (GitHub Pages). This informs users that they're viewing
 * a limited preview and encourages them to download the full desktop app.
 */

import { useState, useEffect } from "react";
import { isWebPreviewMode } from "@/lib/platform/bridge";
import { X, Monitor } from "lucide-react";

export function WebPreviewBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Only show in web preview mode
    if (isWebPreviewMode()) {
      // Check if user has previously dismissed the banner this session
      const dismissed = sessionStorage.getItem("web-preview-banner-dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("web-preview-banner-dismissed", "true");
    // Fade out animation
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed top-12 left-0 right-0 z-50 flex items-center justify-center bg-amber-500/90 text-amber-950 px-4 py-2 text-sm font-medium transition-opacity duration-300 ${
        isDismissed ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex items-center gap-2 max-w-4xl">
        <Monitor className="h-4 w-4 flex-shrink-0" />
        <span>
          <strong>Web Preview Mode</strong> — You're viewing a limited UI
          preview. Desktop features are unavailable.{" "}
          <a
            href="https://github.com/yosiwizman/dyad/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline font-semibold"
          >
            Download ABBA AI
          </a>{" "}
          for the full experience.
        </span>
        <button
          onClick={handleDismiss}
          className="ml-2 p-1 hover:bg-amber-600/20 rounded transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
