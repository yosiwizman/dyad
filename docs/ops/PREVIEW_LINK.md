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

## Demo Mode (Web Preview)

The web preview runs in **Demo Mode** which enables testing of UI functionality without the Electron backend.

### Features Available in Demo Mode

- **Onboarding & Profile Creation**: Create profiles that persist to localStorage
- **Profile Login**: PIN verification (any 4+ digit PIN works)
- **Role Switching**: Toggle between Admin and Child roles using the sidebar controls
- **Navigation Testing**: Verify Admin vs Child navigation entries and route guards
- **Reset Demo Data**: Clear all demo data and start fresh

### Demo Mode Controls

In the sidebar footer (visible only in web preview), you'll find:

1. **Role Switcher**: Toggle between `Admin` and `Child` roles
2. **Reset Demo Data**: Clears all localStorage demo data and reloads

### localStorage Keys Used

Demo mode persists data to these localStorage keys:

- `abba_demo_profiles` - Array of ProfileSummary objects
- `abba_demo_active_profile` - Current active session (or null)
- `abba_demo_role` - Role override: "admin" | "child" | null
- `abba_demo_settings` - User settings

### Clearing Demo Data

You can clear demo data using:

- The "Reset Demo Data" button in the sidebar
- Browser DevTools: `localStorage.clear()` or remove `abba_demo_*` keys

## LLM Chat in Web Preview

The web preview can connect to a real LLM via a secure proxy broker. This enables AI chat functionality without exposing API keys in the browser.

### How It Works

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Dyad Web Preview  │────▶│  LLM Proxy       │────▶│   OpenRouter    │
│  (GitHub Pages)     │     │ (Cloudflare)     │     │      API        │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
         │                           │
         │  No API key               │  OPENROUTER_API_KEY
         │  (CORS-protected)         │  (Worker Secret)
```

### Setup Instructions

1. **Deploy the LLM Proxy** (one-time):

   - Repository: [yosiwizman/dyad-llm-proxy](https://github.com/yosiwizman/dyad-llm-proxy)
   - Follow the deployment instructions in the repo's README
   - Note the deployed Worker URL (e.g., `https://dyad-llm-proxy.x-builder-staging.workers.dev`)

2. **Configure in ABBA AI Web Preview** (admin only):

   - Open the web preview: https://yosiwizman.github.io/dyad/
   - Log in as admin profile
   - Navigate to **Settings → Web Preview LLM**
   - Enter the Worker URL (default is pre-configured)
   - Click **Test Connection** to verify CORS and connectivity

3. **Use Chat**:
   - Navigate to the Chat section
   - Type a message and send
   - If configured correctly, the LLM will respond via the proxy

### Troubleshooting

#### "LLM is not connected in web preview mode"

**Cause:** No broker URL configured or broker URL is empty.

**Solution:** Go to Settings → Web Preview LLM and configure the broker URL.

#### "Origin not allowed" (403 error)

**Cause:** The broker's CORS allowlist doesn't include your origin.

**Solution:**

- For GitHub Pages: Ensure `https://yosiwizman.github.io` is in the broker's `ALLOWED_ORIGINS`
- For localhost: Ensure `http://localhost:5173` and `http://localhost:4173` are allowed
- Redeploy the broker after updating `wrangler.toml`

#### "Connection failed with status 404"

**Cause:** Accessing the broker root URL instead of the API endpoint.

**Note:** The broker only responds to `/api/v1/chat/completions`, not `/` or other paths. This is intentional security design. The Test Connection button automatically uses the correct path.

#### Network error / Failed to fetch

**Causes:**

- Broker is not deployed or offline
- Incorrect broker URL (typo or wrong subdomain)
- Browser blocking the request (mixed content, ad blocker)

**Solution:**

- Verify the broker URL is correct
- Check the broker is deployed and accessible
- Try accessing the broker URL in a new browser tab (you should see a CORS error, which is expected)

### Security Notes

- **API keys are NEVER exposed to the browser** - they're stored as Worker secrets
- **CORS protection** prevents unauthorized sites from using your proxy
- **Request logging** - only request IDs and status codes are logged, never message content
- **Admin-only configuration** - only admin profiles can change the broker URL

## How Roles Work (for testing)

- **Default**: In production builds, role defaults to **child** when Bella Mode is active; otherwise **admin**.
- **Web Preview**: Use the Demo Mode role switcher in the sidebar to toggle roles.
- **Dev-only role switch**: In development builds you can call `switchRole("admin" | "child")` from a component or browser console via `useRole()`.

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
