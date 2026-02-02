# Releasing ABBA AI

This document describes the release process for ABBA AI and the automated guardrails that ensure release quality.

## Release Workflow

Releases are automatically built and published via GitHub Actions when a version tag is pushed.

### Triggering a Release

1. **Bump version** in `package.json`:

   ```bash
   npm version 0.2.X --no-git-tag-version
   ```

2. **Commit and push** the version bump to `main`:

   ```bash
   git add package.json package-lock.json
   git commit -m "chore: bump version to 0.2.X"
   git push origin main
   ```

3. **Create and push tag**:

   ```bash
   git tag v0.2.X
   git push origin v0.2.X
   ```

4. The release workflow automatically:
   - Builds Windows and macOS installers
   - Signs binaries (when secrets are configured)
   - Creates a GitHub Release
   - Publishes the release (removes draft status)
   - Verifies all expected assets are present

### Manual Trigger

You can also trigger a release manually via the GitHub Actions UI:

1. Go to Actions → "Release app" workflow
2. Click "Run workflow"
3. Optionally specify a tag (defaults to `v{package.json version}`)

## Expected Release Assets

Every release MUST contain these assets:

| Asset                                | Description                  |
| ------------------------------------ | ---------------------------- |
| `ABBA.AI-{version}.Setup.exe`        | Windows installer            |
| `ABBA.AI-darwin-arm64-{version}.zip` | macOS Apple Silicon          |
| `ABBA.AI-darwin-x64-{version}.zip`   | macOS Intel                  |
| `abba_ai-{version}-full.nupkg`       | Windows auto-update package  |
| `RELEASES`                           | Windows auto-update manifest |

## Guardrails

### verify-release-assets.js

The release workflow includes a `verify-assets` job that runs `scripts/verify-release-assets.js`. This script:

1. **Waits** for all platform builds to upload (1 minute initial delay)
2. **Checks** that the release is NOT a draft
3. **Verifies** all expected assets are present
4. **Retries** up to 10 times (30s intervals) if assets are missing
5. **Fails the workflow** if any asset is missing after all retries

### What the guardrail checks:

- ✅ Release is published (not draft)
- ✅ Windows Setup.exe exists
- ✅ macOS ARM64 zip exists
- ✅ macOS x64 zip exists
- ✅ Windows nupkg exists
- ✅ RELEASES manifest exists

## Troubleshooting

### Missing Assets Playbook

If a GitHub Release page shows **only source archives** (no .exe, .zip, .nupkg):

#### Step 1: Identify the Problem

```bash
# Check if the release workflow ran for the tag
gh run list --repo yosiwizman/dyad --workflow release.yml --limit 5

# Look for FAILED (X) status on the release run
# Get the run ID from the output

# View the failed run details
gh run view <RUN_ID> --repo yosiwizman/dyad

# Get the actual failure logs
gh run view <RUN_ID> --repo yosiwizman/dyad --log-failed
```

#### Step 2: Common Failure Causes

| Symptom | Root Cause | Fix |
|---------|------------|-----|
| "Unexpected '}'" in esbuild | Missing brace in TypeScript | Fix syntax, bump version, re-tag |
| Build timeout | Large assets, slow runners | Re-run workflow |
| Signing failed | Missing/expired certificates | Check secrets, re-run |
| "Rate limit" errors | GitHub API throttling | Wait 15 min, re-run |
| "Draft release not found" | Assets not uploaded | Check platform build logs |

#### Step 3: Recovery Options

**Option A: Re-run Failed Workflow (if builds succeeded but upload failed)**
```bash
# Re-run via workflow_dispatch
gh workflow run release.yml --repo yosiwizman/dyad -f tag=v0.2.X
```

**Option B: Cut a New Patch Release (if code fix needed)**
```bash
# Fix the code issue
npm version patch --no-git-tag-version
git add .
git commit -m "fix: <description>"
git push origin main

# Tag and push
git tag v0.2.Y
git push origin v0.2.Y
```

**Option C: Delete and Re-tag (if tag is broken)**
```bash
# Delete remote tag
git push --delete origin v0.2.X
# Delete local tag
git tag -d v0.2.X
# Re-create and push
git tag v0.2.X
git push origin v0.2.X
```

#### Step 4: Verify Success

```bash
# Check release has all assets
gh release view v0.2.X --repo yosiwizman/dyad

# Expected assets:
# - ABBA.AI-0.2.X.Setup.exe (>190MB)
# - ABBA.AI-darwin-arm64-0.2.X.zip (>180MB)
# - ABBA.AI-darwin-x64-0.2.X.zip (>180MB)
# - abba_ai-0.2.X-full.nupkg (>190MB)
# - RELEASES (~80 bytes)
```

> **Warning**: A release page showing only "Source code (zip)" and "Source code (tar.gz)" means binaries were NOT uploaded. This is a failed release.

### Draft Release Not Published

The `publish-release` job looks for draft releases with matching version assets. If it can't find one:

1. Check that all platform builds completed successfully
2. Verify asset filenames contain the correct version number
3. Manually publish via GitHub UI if needed, then re-run verify job

### Re-running a Failed Release

If a release failed partway through:

1. **Delete the draft release** (if one exists with incorrect assets)
2. **Delete the tag** if needed: `git push --delete origin v0.2.X`
3. **Re-push the tag** to trigger a fresh build

## Upstream Synchronization

⚠️ **IMPORTANT: Never use GitHub's "Sync fork" button!**

ABBA AI is a fork of dyad-sh/dyad with custom features (Bella Mode, Vault, Managed Publish, branding). Blindly syncing would revert these customizations.

### Upstream Intake Process

1. **Generate an Upstream Intake Report** comparing `upstream/main` vs our `main`
2. **Categorize commits** into SAFE, RISKY, and SKIP buckets
3. **Cherry-pick only SAFE commits** (risk 1-2) that don't touch ABBA features
4. **Resolve conflicts** by always preferring ABBA behavior
5. **Run full CI** before merging

See `docs/UPSTREAM_INTAKE_REPORT_*.md` for historical intake reports.

### What to Protect

When resolving conflicts, always preserve:

- Bella Mode settings and behavior
- Vault configuration and paths
- Managed Publish (broker integration)
- ABBA branding (names, icons, colors)
- Profile lock screen
- GitHub OAuth configuration (`ABBA_GITHUB_OAUTH_CLIENT_ID`)

## Release Schedule

- **Stable releases**: Tagged as `v0.2.X`
- **Beta releases**: Tagged as `v0.2.X-beta.Y`
- **Release channel**: Controlled by `releaseChannel` in user settings
