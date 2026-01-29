/**
 * Bella Mode Configuration
 *
 * Bella Mode is designed for kid-friendly usage where third-party integrations
 * (GitHub, Supabase, Vercel, Neon) are hidden from the UI.
 *
 * In Bella Mode:
 * - Kids cannot connect to third-party accounts
 * - Publishing is managed by ABBA (backend broker - coming soon)
 * - Profile-based workspace isolation is enforced
 *
 * Default: ON in production builds
 * Can be overridden via ABBA_DEVELOPER_MODE env var or settings.enableDeveloperMode
 */

/**
 * Check if Bella Mode is currently active.
 *
 * Bella Mode is ON when:
 * - We're in production (not development)
 * - AND developer mode is not explicitly enabled
 *
 * Bella Mode is OFF when:
 * - We're in development mode
 * - OR developer mode is explicitly enabled via env var
 */
export function isBellaMode(): boolean {
  // Check for explicit developer mode override via environment variable
  if (process.env.ABBA_DEVELOPER_MODE === "true") {
    return false;
  }

  // In development, Bella Mode is OFF by default for easier testing
  if (process.env.NODE_ENV === "development") {
    return false;
  }

  // In production, Bella Mode is ON by default
  return true;
}

/**
 * Check if Bella Mode should be active based on user settings.
 * This allows individual users to override Bella Mode if they have
 * the developer mode setting enabled.
 *
 * @param settings - User settings object (or partial with enableDeveloperMode)
 */
export function isBellaModeWithSettings(settings?: {
  enableDeveloperMode?: boolean;
}): boolean {
  // If developer mode is enabled in settings, Bella Mode is OFF
  if (settings?.enableDeveloperMode === true) {
    return false;
  }

  // Otherwise, use the default Bella Mode logic
  return isBellaMode();
}

/**
 * List of features hidden in Bella Mode
 */
export const BELLA_MODE_HIDDEN_FEATURES = [
  "GitHub Integration",
  "Supabase Integration",
  "Vercel Integration",
  "Neon Integration",
  "Direct Publishing",
  "Third-party OAuth connections",
] as const;

/**
 * Bella Mode placeholder message
 */
export const BELLA_MODE_PLACEHOLDER_MESSAGE =
  "Publishing and integrations are managed by ABBA. Coming soon!";
