# Bella Mode

Bella Mode is a kid-friendly configuration for ABBA AI that hides third-party integrations and ensures a safe, simplified experience.

## Overview

When Bella Mode is enabled (default in production):

- **Hidden Integrations**: GitHub, Supabase, Vercel, and Neon integration buttons are hidden
- **Managed Publishing**: Publishing options are replaced with a "Managed by ABBA" placeholder
- **Profile Isolation**: Each user profile has its own isolated workspace (coming soon)

## How It Works

### Default Behavior

| Environment | Bella Mode                   |
| ----------- | ---------------------------- |
| Production  | **ON** (integrations hidden) |
| Development | OFF (integrations visible)   |

### Overriding Bella Mode

There are two ways to override Bella Mode:

1. **Environment Variable**: Set `ABBA_DEVELOPER_MODE=true`
2. **Settings Toggle**: Enable "Developer Mode (Show Integrations)" in Settings → Experiments

## What's Hidden in Bella Mode

When Bella Mode is ON, the following are hidden:

### Settings Page

- GitHub Integration
- Vercel Integration
- Supabase Integration
- Neon Integration
- Vault Integration

### Publish Panel

- GitHub connector
- Vercel connector
- Portal migration (Neon)

### Configure Panel

- Neon database configuration

## Developer Mode Toggle

Users can enable Developer Mode to show integrations:

1. Go to **Settings**
2. Scroll to **Experiments** section
3. Enable **Developer Mode (Show Integrations)**

This setting persists across sessions.

## Technical Implementation

### Files

- `src/shared/bella_mode.ts` - Core Bella Mode utilities
- `src/lib/schemas.ts` - `enableDeveloperMode` setting
- `src/pages/settings.tsx` - Settings page gating
- `src/components/preview_panel/PublishPanel.tsx` - Publish panel gating
- `src/components/preview_panel/ConfigurePanel.tsx` - Configure panel gating

### API

```typescript
import { isBellaMode, isBellaModeWithSettings } from "@/shared/bella_mode";

// Check if Bella Mode is active (no settings context)
if (isBellaMode()) {
  // Hide integrations
}

// Check with user settings (preferred)
if (isBellaModeWithSettings(settings)) {
  // Hide integrations
}
```

## Future Enhancements

- **Profile Lock Screen**: First-run profile creation with PIN
- **Workspace Isolation**: Per-profile app storage
- **Managed Publishing**: Backend broker for kid-safe publishing
