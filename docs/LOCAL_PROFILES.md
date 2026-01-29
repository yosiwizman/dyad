# Local Profiles

Local Profiles allow multiple users (e.g., kids) to use ABBA AI on the same machine with isolated workspaces and PIN-based authentication.

## Overview

- **PIN Authentication**: Simple 4-6 digit PIN (no email required)
- **Multiple Profiles**: Create profiles for different users (Kid A, Kid B, etc.)
- **Workspace Isolation**: Each profile gets its own app storage folder
- **Admin Profiles**: First profile is automatically admin, can access Developer Mode

## Profile Storage

Profiles are stored locally in `userData/profiles.json` with:

- Unique profile ID (UUID)
- Display name
- Hashed PIN (PBKDF2 with salt)
- Creation timestamp
- Admin flag
- Avatar color

**Security**: PINs are never stored in plaintext. They use PBKDF2 hashing with:

- 10,000 iterations
- SHA-512 digest
- 16-byte random salt
- 64-byte key length

## IPC Channels

The following IPC channels are available for profile management:

| Channel                | Description                           |
| ---------------------- | ------------------------------------- |
| `profile:list`         | Get all profiles (without PIN hashes) |
| `profile:create`       | Create a new profile                  |
| `profile:delete`       | Delete a profile                      |
| `profile:verify-pin`   | Verify PIN and create session         |
| `profile:get-active`   | Get the current active session        |
| `profile:logout`       | Clear the active session              |
| `profile:has-profiles` | Check if any profiles exist           |
| `profile:get`          | Get a specific profile by ID          |
| `profile:update`       | Update profile name/avatar            |
| `profile:change-pin`   | Change profile PIN                    |

## Session Management

- Active profile session is stored **in memory only**
- Session is cleared on app restart (security feature)
- User must re-enter PIN after restart

## Workspace Isolation (Coming Soon)

Each profile will have its own workspace:

```
~/abba-ai-apps/
├── <profile-id-1>/
│   └── apps/
│       ├── my-app-1/
│       └── my-app-2/
├── <profile-id-2>/
│   └── apps/
│       └── another-app/
└── legacy/  (pre-profile apps, admin only)
```

### Migration Rules

When profiles are introduced:

1. **First profile**: Existing apps are migrated to the new profile's workspace
2. **Additional profiles**: Legacy apps remain in a "Legacy" folder (admin-only access)

## Technical Implementation

### Files

- `src/profiles/profile_types.ts` - Zod schemas and types
- `src/profiles/profile_storage.ts` - Storage and hashing utilities
- `src/ipc/handlers/profile_handlers.ts` - IPC handlers
- `src/preload.ts` - IPC channel allowlist

### Creating a Profile

```typescript
import { createProfile } from "@/profiles/profile_storage";

const profile = createProfile({
  name: "Kid A",
  pin: "1234",
  isAdmin: false,
  avatarColor: "#3B82F6",
});
```

### Verifying PIN

```typescript
import { verifyPinAndLogin } from "@/profiles/profile_storage";

const result = verifyPinAndLogin(profileId, "1234");
if (result.success) {
  // User is logged in
  console.log(result.session);
}
```

## Avatar Colors

Available avatar colors for profiles:

| Color               | Hex       |
| ------------------- | --------- |
| Purple (ABBA brand) | `#8B5CF6` |
| Blue                | `#3B82F6` |
| Green               | `#10B981` |
| Amber               | `#F59E0B` |
| Red                 | `#EF4444` |
| Pink                | `#EC4899` |
| Cyan                | `#06B6D4` |
| Indigo              | `#6366F1` |

## Future Enhancements

- **Lock Screen UI**: Visual profile selector with PIN pad
- **Profile Switching**: Switch between profiles without restart
- **Profile Management UI**: Create/edit/delete profiles in Settings
