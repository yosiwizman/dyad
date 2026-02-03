# GitHub Pages Preview Link

## Live URL

Production preview (auto-updated on every merge to `main`):

> https://yosiwizman.github.io/dyad/

- Deployment source: GitHub Actions → `Deploy Pages`
- Artifacts: `web-preview-dist` uploaded on every CI run (for offline testing)

## What to Test (CEO Checklist)

- **Navigation split**
  - Child mode: Home, Chat, Library, Publish, Backup, Profile
  - Admin mode: Home, Chat, Library, Users, Templates, Diagnostics, Publishing, Vault, Integrations, Git Ops, Observability, Settings, Hub
- **Route guards**
  - Child blocked on `/admin/*` (Access Denied)
  - Admin blocked on `/publish`, `/backup`, `/profile` (Access Denied)
- **SPA routing**
  - Deep links like `/admin/diagnostics` and `/publish` work when loaded directly (404 fallback is in place).

## How Roles Work (for testing)

- **Default**: In production builds, role defaults to **child** when Bella Mode is active; otherwise **admin**.
- **Dev-only role switch**: In development builds you can call `switchRole("admin" | "child")` from a component or browser console via `useRole()`. (Not available in production Pages build.)

## Deployment Details

- Workflow: `.github/workflows/deploy-pages.yml`
- Trigger: `push` to `main`
- Steps: checkout → npm ci → `npm run web:build` → copy `404.html` → upload-pages-artifact → deploy-pages
- Permissions: `pages: write`, `id-token: write`, `contents: read`
- Gating: waits for required CI checks (`CI / quality`, `CI / build (windows)`, `CI / build (macos)`) to succeed before deploying
- Base path: `/dyad/` (set via `GITHUB_PAGES=true` + `VITE_BASE_PATH=/dyad/`)

## SPA Fallback

GitHub Pages serves `404.html` for unknown routes. We copy `index.html` to `404.html` during build to ensure client-side routing works for deep links.

## Offline Artifact

CI uploads `web-preview-dist` (the static `dist/` directory). Download from the CI run artifacts for offline testing if needed.

## If Pages Isn’t Enabled Yet (one-time)

1. Go to **GitHub → Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Save
4. Next merge to `main` will publish to https://yosiwizman.github.io/dyad/
