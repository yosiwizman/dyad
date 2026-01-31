# Vault Authentication

This document describes the authentication flow and session handling for ABBA's Vault cloud backup feature.

## Overview

Vault uses Supabase Auth for user authentication. Users can sign in with email/password to enable cloud backups. Anonymous sign-in is also supported if enabled in the Supabase project.

## Session Management

### Token Lifecycle

1. **Access Token**: Short-lived JWT (~1 hour) used for API requests
2. **Refresh Token**: Long-lived token used to obtain new access tokens
3. **Expiry**: Sessions track expiration and warn users when expiring soon

### Automatic Refresh

When a Vault operation (like backup) fails due to an expired token:

1. **Detection**: The error message is analyzed for auth-related keywords:

   - `401`, `expired`, `invalid token`, `unauthorized`, `not authenticated`, `session`

2. **Auto-Refresh**: If an auth error is detected, the app automatically:

   - Attempts `vault:auth-refresh` IPC call
   - Uses the stored refresh token to get new credentials
   - If successful, retries the original operation

3. **Re-auth Prompt**: If refresh fails:
   - Shows a clear "Vault Session Expired" dialog
   - Includes inline sign-in form for immediate re-authentication
   - Provides "Copy Diagnostics" button for support

## Error Handling

### Error Categories

| Category      | Detection Keywords                                         | User Message                                                 |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| Auth Error    | `401`, `expired`, `token`, `unauthorized`, `session`       | "Your Vault session has expired. Please sign in again."      |
| Network Error | `network`, `fetch`, `ENOTFOUND`, `timeout`, `cannot reach` | "Cannot reach Vault. Please check your internet connection." |
| Other Errors  | (none of the above)                                        | Original error message                                       |

### Retry Flow

```
Backup Attempt
    ↓
  Fails?
    ↓ yes
Is Auth Error?
    ↓ yes
Attempt Refresh
    ↓
Refresh OK?
    ├─ yes → Retry Backup
    └─ no  → Show Sign-in Dialog
```

## IPC Channels

| Channel                 | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `vault:auth-status`     | Get current auth status with reason code         |
| `vault:auth-sign-in`    | Sign in with email/password                      |
| `vault:auth-sign-out`   | Sign out and clear session                       |
| `vault:auth-refresh`    | Manually refresh session token                   |
| `vault:auth-anonymous`  | Sign in anonymously (if supported)               |
| `vault:ensure-auth`     | Ensure valid session (auto-init + anon fallback) |
| `vault:get-diagnostics` | Get sanitized diagnostics for support            |

## Auth Status Reasons

| Reason                    | Description                                 |
| ------------------------- | ------------------------------------------- |
| `AUTHENTICATED`           | Valid session with email/password user      |
| `AUTHENTICATED_ANONYMOUS` | Valid anonymous session                     |
| `NO_SESSION`              | No stored session                           |
| `SESSION_EXPIRED`         | Session exists but token expired            |
| `TOKEN_REFRESH_FAILED`    | Attempted refresh but it failed             |
| `CONFIG_MISSING`          | Vault URL or publishable key not configured |

## Configuration

Vault requires Supabase configuration:

1. **Supabase URL**: The project URL (e.g., `https://xxx.supabase.co`)
2. **Publishable Key**: The `anon` key from Supabase (public, safe for client)

### Configuration Sources (Priority Order)

1. **User Settings**: `vault.supabaseUrl` and `vault.supabaseAnonKey`
2. **Environment Variables**: `ABBA_VAULT_SUPABASE_URL`, `ABBA_VAULT_SUPABASE_ANON_KEY`
3. **Build-time Defaults**: Injected via GitHub Actions during release builds

### Environment Variables

| Variable                       | Description                                     |
| ------------------------------ | ----------------------------------------------- |
| `ABBA_VAULT_SUPABASE_URL`      | Supabase project URL                            |
| `ABBA_VAULT_SUPABASE_ANON_KEY` | Supabase publishable (anon) key                 |
| `VAULT_SUPABASE_URL`           | Legacy alias for `ABBA_VAULT_SUPABASE_URL`      |
| `VAULT_SUPABASE_ANON_KEY`      | Legacy alias for `ABBA_VAULT_SUPABASE_ANON_KEY` |

### Build-time Configuration

For production builds, Vault credentials are injected during the release build via GitHub Actions secrets:

```yaml
# In .github/workflows/release.yml
env:
  ABBA_VAULT_SUPABASE_URL: ${{ secrets.ABBA_VAULT_SUPABASE_URL }}
  ABBA_VAULT_SUPABASE_ANON_KEY: ${{ secrets.ABBA_VAULT_SUPABASE_ANON_KEY }}
```

### Bella Mode Behavior

In **Bella Mode** (production builds):

- If Vault is properly configured (build-time injection worked), users see the normal sign-in form
- If Vault is NOT configured (secrets missing), users see:
  - "Vault not available" message
  - No sign-in form (to avoid confusion since Settings is hidden)
  - Guidance to contact support or update to latest version

### Settings UI

- Settings UI → Vault section (only visible in Developer Mode)
- Environment variables override Settings values

## Diagnostics

The `vault:get-diagnostics` endpoint returns sanitized debug info:

```json
{
  "timestamp": "2024-01-15T12:00:00.000Z",
  "supabaseUrl": "https://xxx.supabase.co",
  "hasAnonKey": true,
  "maskedAnonKey": "eyJh...****",
  "isAuthenticated": false,
  "authReason": "SESSION_EXPIRED",
  "isAnonymous": false,
  "userId": null,
  "userEmail": "user@example.com",
  "expiresAt": "2024-01-15T11:00:00.000Z",
  "lastError": null,
  "autoConfigAvailable": true
}
```

**Note**: Tokens are never included in diagnostics—only metadata like expiry time and masked keys.

## Testing

```bash
npm test src/__tests__/vault_auth_retry.test.ts
```

Tests verify:

- Auth error detection (401, expired, invalid token, etc.)
- Network error detection (timeout, ENOTFOUND, etc.)
- Error categorization priority
- User-facing error messages
