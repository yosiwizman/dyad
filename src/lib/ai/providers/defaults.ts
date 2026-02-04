import type { ProviderSetting, UserSettings } from "@/lib/schemas";

/**
 * Canonical default AI provider settings shape.
 *
 * This is a runtime-safety default to guarantee keys like "openai" exist so
 * code never crashes when reading provider settings in web preview.
 *
 * NOTE: Having a key present does NOT mean it is configured. All defaults are
 * intentionally empty.
 */
export const DEFAULT_AI_PROVIDERS = {
  openai: {},
  openrouter: {},
  // Gemini models are represented by the "google" provider id in this codebase.
  google: {},
  anthropic: {},

  // Additional built-ins used across the app.
  vertex: {},
  azure: {},
  xai: {},
  bedrock: {},
  ollama: {},
  lmstudio: {},
  auto: {},
} satisfies Record<string, ProviderSetting>;

/**
 * Merge a possibly-missing providerSettings object with DEFAULT_AI_PROVIDERS.
 *
 * - Ensures providerSettings is always an object
 * - Ensures built-in provider keys exist (including "openai")
 */
export function mergeProviderSettings(
  providerSettings: UserSettings["providerSettings"] | undefined | null,
): UserSettings["providerSettings"] {
  const safeSettings =
    providerSettings && typeof providerSettings === "object" ? providerSettings : {};

  return {
    ...DEFAULT_AI_PROVIDERS,
    ...safeSettings,
  };
}
