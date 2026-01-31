# Managed Publish

Managed Publish is ABBA's one-button publishing solution that allows users to publish their apps without connecting to GitHub, Vercel, or other third-party services.

## Overview

In **Bella Mode** (production builds), users see a simple "Publish Live" button that:

1. Packages the app into a deployable bundle
2. Uploads to ABBA's managed hosting
3. Returns a live URL when complete

No tokens, credentials, or third-party accounts are required.

## Version 1 (Stub)

v0.2.17 introduced the Managed Publish infrastructure with a **local stub transport** for testing and development.

### v0.2.18 Update: Local Preview Links

As of v0.2.18, the stub transport returns **local file:// URLs** instead of dead `abba.app` links. This allows users to actually verify their app works:

- Creates a real bundle (zip) of the app
- Simulates publish phases (~15 seconds total)
- Returns a local file URL: `file:///C:/Users/.../abba-ai-apps/my-app`
- Clicking "Open" opens the app folder in the file explorer

**UI Changes:**

- Header shows "Local Preview" with "Stub Mode" badge
- Button text: "Create Local Preview" instead of "Publish Live"
- Ready state: "Local preview ready!" instead of "Your app is live!"
- Amber color scheme indicates local/stub mode
- Footer note: "Real ABBA Hosting coming soon!"

**Important**: The stub does not actually deploy anything. Real hosting requires the ABBA Broker service (future milestone).

## Architecture

### Components

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Publish Panel  │────▶│  IPC Handlers    │────▶│  Broker Client  │
│  (React UI)     │     │  (Main Process)  │     │  (Transport)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌──────────────┐        ┌─────────────────┐
                        │ Bundle Utils │        │ Stub / HTTP     │
                        │ (Zip/Hash)   │        │ Transport       │
                        └──────────────┘        └─────────────────┘
```

### Files

- `src/lib/broker/types.ts` - Zod schemas for API contract
- `src/lib/broker/client.ts` - Broker client (stub or HTTP)
- `src/lib/broker/stub_transport.ts` - Local stub for development
- `src/ipc/handlers/publish_handlers.ts` - IPC handlers
- `src/ipc/utils/bundle_utils.ts` - Bundle creation utilities
- `src/components/preview_panel/ManagedPublishPanel.tsx` - UI component

### IPC Channels

| Channel               | Description                         |
| --------------------- | ----------------------------------- |
| `publish:start`       | Start a publish operation           |
| `publish:status`      | Poll current status                 |
| `publish:cancel`      | Cancel in-progress publish          |
| `publish:diagnostics` | Get diagnostics for error reporting |

## Bundle Creation

Apps are bundled into a zip archive for deployment. The bundler:

**Excludes:**

- `node_modules/`, `.git/`, `dist/`, `build/`, `.vercel/`
- `.env*`, `.secret*`, `*.key`, `*.pem`
- `.DS_Store`, `Thumbs.db`, lock files, logs

**Includes:**

- `package.json`, `src/`, `public/`, config files
- All source code and assets

**Security:** Environment files and secrets are never included in the bundle.

## Publish States

```
queued → packaging → uploading → building → deploying → ready
           ↓            ↓           ↓           ↓
         failed       failed      failed      failed
           ↓            ↓           ↓           ↓
       cancelled    cancelled   cancelled   cancelled
```

Terminal states: `ready`, `failed`, `cancelled`

## Configuration

### Settings Schema

Broker configuration can be stored in user settings:

| Setting Key          | Type   | Description                      |
| -------------------- | ------ | -------------------------------- |
| `broker.url`         | string | URL of the ABBA Broker API       |
| `broker.deviceToken` | Secret | Authentication token (encrypted) |

### Environment Variables

| Variable            | Description                                    |
| ------------------- | ---------------------------------------------- |
| `ABBA_BROKER_URL`   | URL of the ABBA Broker API (optional)          |
| `BROKER_URL`        | Alias for `ABBA_BROKER_URL`                    |
| `ABBA_DEVICE_TOKEN` | Authentication token for the broker (optional) |

### Configuration Priority

Broker configuration is resolved in the following order:

1. **User Settings**: `settings.broker.url` and `settings.broker.deviceToken`
2. **Environment Variables**: `ABBA_BROKER_URL` / `ABBA_DEVICE_TOKEN`
3. **Built-in Default**: `https://abba-broker.vercel.app` (in production builds)

In production (Bella Mode), the default broker URL is used automatically.
In development, the stub transport is used unless a broker URL is configured.

### IPC Channels

| Channel                 | Description                         |
| ----------------------- | ----------------------------------- |
| `publish:start`         | Start a publish operation           |
| `publish:status`        | Poll current status                 |
| `publish:cancel`        | Cancel in-progress publish          |
| `publish:diagnostics`   | Get diagnostics for error reporting |
| `publish:broker-status` | Get broker connection status        |

### Hosting Status Indicator

The Managed Publish panel shows a hosting status indicator:

- **Broker connected**: Shows green icon with broker host (e.g., `abba-broker.vercel.app`)
- **Broker not configured**: Shows amber icon with "Broker not configured" message

### Enabling Real Hosting

Real hosting is enabled automatically in production builds using the default broker URL.
For custom broker setups:

1. Set via environment variables:

   ```bash
   ABBA_BROKER_URL=https://your-broker.example.com
   ABBA_DEVICE_TOKEN=your-device-token
   ```

2. Or set via user settings (for runtime configuration)

3. The UI will automatically switch from "Local Preview" mode to "Live Hosting" mode.

4. Apps will be deployed to Vercel and receive real `https://` URLs.

## Usage

### In Bella Mode (Production)

Users see the Managed Publish panel with:

- "Publish Live" button
- Progress steps during publish
- Live URL with Copy/Open buttons when ready

### In Developer Mode

Users can toggle Developer Mode in Settings → Experiments to access the traditional GitHub/Vercel integration UI.

## Error Handling

When publish fails:

1. Error message is displayed
2. "Try Again" button is available
3. "Copy Diagnostics" captures debug info (with secrets redacted)

## ABBA Broker Service

The ABBA Broker is now available at `https://abba-broker.vercel.app`. It provides:

1. Secure bundle upload (authenticated with device token)
2. Automated deployment to Vercel
3. Real `https://` URLs for deployed apps
4. Status polling and cancellation support

### Broker API Endpoints

| Endpoint                 | Method | Description                |
| ------------------------ | ------ | -------------------------- |
| `/api/v1/publish/start`  | POST   | Start a publish operation  |
| `/api/v1/publish/upload` | PUT    | Upload the bundle          |
| `/api/v1/publish/status` | GET    | Get current publish status |
| `/api/v1/publish/cancel` | POST   | Cancel in-progress publish |
| `/api/health`            | GET    | Health check               |

### Security

- All broker requests require the `x-abba-device-token` header
- Tokens are validated server-side with constant-time comparison
- No owner secrets (Vercel tokens, etc.) are exposed to the desktop app

## Testing

Tests verify:

- Bundle exclusion rules (`bundle_utils.test.ts`)
- Schema validation (`broker_client.test.ts`)
- IPC channel registration (`publish_ipc_contract.test.ts`)

Run tests:

```bash
npm test src/__tests__/bundle_utils.test.ts
npm test src/__tests__/broker_client.test.ts
npm test src/__tests__/publish_ipc_contract.test.ts
npm test src/__tests__/stub_transport_local_url.test.ts
```

## Typical Publish Time (Stub)

With the stub transport:

- Bundle creation: 1-5 seconds (depends on app size)
- Simulated phases: ~15 seconds total
- Total: ~20 seconds

Bundle sizes vary by app but typically:

- Small apps: 10-50 KB
- Medium apps: 50-200 KB
- Large apps: 200 KB - 1 MB

(These are compressed sizes excluding node_modules)
