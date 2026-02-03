# Admin/Child Mode Architecture

This document describes the Admin vs Child mode split in ABBA AI, including navigation maps, enforcement mechanisms, and security considerations.

## Overview

ABBA AI operates in two modes:

- **Admin Mode**: Full access to all features including user management, vault ops, publishing ops, diagnostics, integrations, and observability.
- **Child Mode**: Limited access focused on app creation and usage. No access to admin operations or system configuration.

## Navigation Maps

### Child Mode Navigation

| Entry   | Route      | Icon          | Status |
| ------- | ---------- | ------------- | ------ |
| Home    | `/`        | Home          | Active |
| Chat    | `/chat`    | MessageSquare | Active |
| Library | `/library` | BookOpen      | Active |
| Publish | `/publish` | Upload        | Stub   |
| Backup  | `/backup`  | HardDrive     | Stub   |
| Profile | `/profile` | User          | Stub   |

### Admin Mode Navigation

| Entry         | Route                  | Icon           | Status |
| ------------- | ---------------------- | -------------- | ------ |
| Home          | `/`                    | Home           | Active |
| Chat          | `/chat`                | MessageSquare  | Active |
| Library       | `/library`             | BookOpen       | Active |
| Users         | `/admin/users`         | Users          | Stub   |
| Templates     | `/admin/templates`     | LayoutTemplate | Stub   |
| Diagnostics   | `/admin/diagnostics`   | Bug            | Active |
| Publishing    | `/admin/publishing`    | Rocket         | Stub   |
| Vault         | `/admin/vault`         | Lock           | Stub   |
| Integrations  | `/admin/integrations`  | Plug           | Stub   |
| Git Ops       | `/admin/git`           | GitBranch      | Stub   |
| Observability | `/admin/observability` | Activity       | Stub   |
| Settings      | `/settings`            | Settings       | Active |
| Hub           | `/hub`                 | Store          | Active |

## Role Determination

Role is determined by the following logic (in order of precedence):

1. **Dev Override** (development only): If `switchRole()` has been called, use that role
2. **Bella Mode + Active Profile**: If Bella Mode is active and user is logged in, role is `child`
3. **Non-Bella Mode**: If Bella Mode is off (development or developer mode setting), role is `admin`
4. **Fallback**: Default to `child` (safest)

## Enforcement Layers

### 1. UI Layer (Navigation)

**Location**: `src/lib/rbac/navigation.ts`

The sidebar only shows navigation entries appropriate for the current role. This is handled by `useRoleNavigation()` hook.

**⚠️ Security Note**: UI hiding is NOT a security control. It's a UX improvement only.

### 2. Route Layer (Guards)

**Location**: `src/components/rbac/RequireRole.tsx`

Each protected page component wraps its content with `RequireAdmin` or `RequireChild`:

```tsx
// Admin-only page
export default function AdminUsersPage() {
  return (
    <RequireAdmin>
      <UsersContent />
    </RequireAdmin>
  );
}

// Child-only page
export default function PublishPage() {
  return (
    <RequireChild>
      <PublishContent />
    </RequireChild>
  );
}
```

If access is denied, an `AccessDenied` component is rendered showing:

- Current role
- Required role
- Link to return home

### 3. Policy Layer (Future)

**Location**: Backend validation (to be implemented)

All sensitive operations should also validate role on the backend. This is defense-in-depth.

## Route Access Matrix

| Route Pattern    | Admin | Child |
| ---------------- | ----- | ----- |
| `/`              | ✅    | ✅    |
| `/chat`          | ✅    | ✅    |
| `/library`       | ✅    | ✅    |
| `/app-details/*` | ✅    | ✅    |
| `/settings/*`    | ✅    | ❌    |
| `/hub`           | ✅    | ❌    |
| `/admin/*`       | ✅    | ❌    |
| `/publish`       | ❌    | ✅    |
| `/backup`        | ❌    | ✅    |
| `/profile`       | ❌    | ✅    |

## Testing

### Run RBAC Tests

```bash
npm run test -- rbac_navigation
```

### Test Commands

```bash
# Run all tests
npm run test

# Run RBAC-specific tests
npm run test -- rbac_navigation

# Run with coverage
npm run test -- --coverage
```

### Manual Testing

In development mode, you can switch roles using the `switchRole()` function exposed by the `useRole()` hook:

```tsx
// In a component or browser console
const { switchRole } = useRole();
switchRole("child"); // Switch to child mode
switchRole("admin"); // Switch to admin mode
```

**Note**: Role switching is only available in development mode (`NODE_ENV === "development"`).

## Security Considerations

### What This Does

1. ✅ Hides admin UI from child users
2. ✅ Blocks admin routes at the React component level
3. ✅ Provides clear "Access Denied" feedback
4. ✅ Logs role switches in development

### What This Does NOT Do

1. ❌ Provide cryptographic security
2. ❌ Protect against malicious local users
3. ❌ Replace backend authorization

### Security Statement

> **UI hiding is NOT a security control.**
>
> The RBAC system in the frontend is designed for UX and preventing accidental access. It is NOT designed to protect against malicious users who have local access to the application.
>
> For actual security:
>
> - Backend APIs must validate role/permissions
> - Sensitive operations must require re-authentication
> - Audit logging should be implemented for admin actions

## File Locations

| Purpose           | Location                                |
| ----------------- | --------------------------------------- |
| Types             | `src/lib/rbac/types.ts`                 |
| Navigation Config | `src/lib/rbac/navigation.ts`            |
| Role Context      | `src/contexts/RoleContext.tsx`          |
| Route Guards      | `src/components/rbac/RequireRole.tsx`   |
| Access Denied UI  | `src/components/rbac/AccessDenied.tsx`  |
| Admin Routes      | `src/routes/admin/index.ts`             |
| Child Routes      | `src/routes/child.ts`                   |
| Tests             | `src/__tests__/rbac_navigation.test.ts` |

## Adding New Routes

### Admin-Only Route

1. Create page in `src/pages/admin/`
2. Wrap content with `<RequireAdmin>`
3. Add route to `src/routes/admin/index.ts`
4. Add nav entry to `ADMIN_NAV_ENTRIES` in `src/lib/rbac/navigation.ts`

### Child-Only Route

1. Create page in `src/pages/`
2. Wrap content with `<RequireChild>`
3. Add route to `src/routes/child.ts`
4. Add nav entry to `CHILD_NAV_ENTRIES` in `src/lib/rbac/navigation.ts`

### Shared Route

1. Create page (no wrapper needed)
2. Add to main router
3. Add nav entry with `access: "all"` to both navigation arrays
