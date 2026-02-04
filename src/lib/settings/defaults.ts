import { v4 as uuidv4 } from "uuid";
import type { UserSettings } from "@/lib/schemas";
import { DEFAULT_TEMPLATE_ID } from "@/shared/templates";
import { DEFAULT_THEME_ID } from "@/shared/themes";
import { mergeProviderSettings } from "@/lib/ai/providers/defaults";

/**
 * Canonical defaults for UserSettings.
 *
 * This module is intentionally browser-safe (no fs/electron imports) so it can be
 * used by both the desktop settings layer and the WebIpcClient stubs.
 */
export function createDefaultUserSettings(
  overrides: Partial<UserSettings> = {},
): UserSettings {
  const base: UserSettings = {
    selectedModel: {
      name: "auto",
      provider: "auto",
    },
    providerSettings: mergeProviderSettings(undefined),
    telemetryConsent: "unset",
    telemetryUserId: uuidv4(),
    hasRunBefore: false,
    experiments: {},
    enableProLazyEditsMode: true,
    enableProSmartFilesContextMode: true,
    selectedChatMode: "build",
    enableAutoFixProblems: false,
    enableAutoUpdate: true,
    releaseChannel: "stable",
    selectedTemplateId: DEFAULT_TEMPLATE_ID,
    selectedThemeId: DEFAULT_THEME_ID,
    isRunning: false,
    lastKnownPerformance: undefined,
    // Enabled by default in 0.33.0-beta.1
    enableNativeGit: true,
  };

  const merged: UserSettings = {
    ...base,
    ...overrides,
    // Ensure providerSettings always has the canonical shape.
    providerSettings: mergeProviderSettings(overrides.providerSettings),
  };

  return merged;
}
