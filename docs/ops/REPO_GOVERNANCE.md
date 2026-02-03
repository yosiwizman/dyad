# Repository Governance

This document describes the branch protection rules, required checks, and governance policies for the ABBA AI repository.

## Branch Protection for `main`

The `main` branch must have the following protection rules enabled.

### Required Settings

| Setting                             | Value      | Purpose                              |
| ----------------------------------- | ---------- | ------------------------------------ |
| Require pull request before merging | ✅ Enabled | No direct pushes to main             |
| Required approvals                  | 1          | At least one review required         |
| Dismiss stale reviews               | ✅ Enabled | New commits invalidate old approvals |
| Require review from Code Owners     | ✅ Enabled | CODEOWNERS must approve              |
| Require status checks to pass       | ✅ Enabled | CI must be green                     |
| Require branches to be up to date   | ✅ Enabled | Must be rebased on latest main       |
| Require conversation resolution     | ✅ Enabled | All comments must be resolved        |
| Restrict force pushes               | ✅ Enabled | No `git push --force` to main        |
| Restrict deletions                  | ✅ Enabled | Cannot delete main branch            |

### Required Status Checks

These exact check names must be added as required status checks:

```
CI / quality (lint, typecheck, unit tests)
CI / build (windows)
CI / build (macos)
```

> **Important**: If workflow names change in `.github/workflows/ci.yml`, you must update the required status checks in branch protection settings to match.

## Manual Setup Instructions

If branch protection cannot be applied via API, follow these steps in the GitHub UI:

### Step 1: Navigate to Branch Protection

1. Go to https://github.com/yosiwizman/dyad/settings/branches
2. Click **Add branch protection rule** (or edit existing rule for `main`)

### Step 2: Configure Branch Name Pattern

- Enter `main` in the "Branch name pattern" field

### Step 3: Enable Protection Rules

Check the following boxes:

**Protect matching branches:**

- [x] Require a pull request before merging

  - [x] Require approvals: `1`
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners

- [x] Require status checks to pass before merging

  - [x] Require branches to be up to date before merging
  - Search and add these status checks:
    - `CI / quality (lint, typecheck, unit tests)`
    - `CI / build (windows)`
    - `CI / build (macos)`

- [x] Require conversation resolution before merging

**Rules applied to everyone including administrators:**

- [x] Do not allow bypassing the above settings

- [x] Restrict deletions

### Step 4: Save

Click **Create** or **Save changes**.

## Governance Artifacts

| File                                         | Purpose                                        |
| -------------------------------------------- | ---------------------------------------------- |
| `.github/CODEOWNERS`                         | Defines code ownership for review requirements |
| `.github/PULL_REQUEST_TEMPLATE.md`           | Standardized PR checklist                      |
| `.github/ISSUE_TEMPLATE/bug_report.yml`      | Structured bug reports                         |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Structured feature requests                    |
| `SECURITY.md`                                | Vulnerability disclosure policy                |

## Workflow Changes Checklist

When modifying CI workflows (`.github/workflows/ci.yml`):

1. **Before merging**: Note any job name changes
2. **After merging**: Update required status checks in branch protection settings
3. **Verify**: Push a test branch and confirm all required checks appear

## Troubleshooting

### "Required status check is expected" but not running

This happens when the check name in branch protection doesn't match the workflow job name.

**Fix**: Go to branch protection settings and update the required status check names to match current workflow job names.

### Code owner review not required

Ensure:

1. `.github/CODEOWNERS` file exists and is valid
2. "Require review from Code Owners" is enabled in branch protection
3. The changed files match a pattern in CODEOWNERS

### Cannot merge even with approvals

Check:

1. All required status checks are passing
2. All conversations are resolved
3. Branch is up to date with main
4. Approval is not stale (no new commits since approval)
