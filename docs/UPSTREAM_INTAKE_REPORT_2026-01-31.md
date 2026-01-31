# Upstream Intake Report — 2026-01-31

**Fork:** `yosiwizman/dyad` (ABBA AI)
**Upstream:** `dyad-sh/dyad`
**Commits behind:** 88 non-merge commits

---

## Executive Summary

After analyzing 88 upstream commits, I recommend cherry-picking **12 commits** (risk 1-2) that provide valuable bug fixes and improvements without risking ABBA-specific features.

### ABBA Features to Protect
- **Bella Mode** — custom chat/agent behavior
- **Vault** — secure credential storage
- **Managed Publish** — broker integration for app publishing
- **Branding** — ABBA AI identity, icons, names
- **Profile Lock** — user authentication flow

---

## SAFE Commits (Risk 1-2) — PICK

| SHA | Title | Files | Risk | Recommendation |
|-----|-------|-------|------|----------------|
| `89aa610` | Fix WSL PATH contamination causing git command failures on Windows | `git_utils.ts` (+129/-24) | 1 | **PICK** — Critical Windows fix |
| `3b13f33` | Fix git 'dubious ownership' error on Windows when renaming app | `main.ts` (+4/-2) | 1 | **PICK** — Windows fix |
| `cb7366c` | Fix Windows backslash paths in component taggers and visual editing | 4 files (+31/-28) | 2 | **PICK** — Windows path handling |
| `f46cdf7` | Add application menu for keyboard shortcuts (Ctrl+C, Ctrl+Z, etc.) | `main.ts` (+82) | 1 | **PICK** — UX improvement |
| `ff07bbc` | Enable GFM (GitHub Flavored Markdown) support in markdown parser | `DyadMarkdownParser.tsx` (+3) | 1 | **PICK** — Markdown enhancement |
| `23b45a9` | Fix HTML attribute and content escaping for dyad-tags | 9 files (+207/-44) | 2 | **PICK** — Security/correctness fix |
| `77fb0ec` | Fix duplicate server log messages in console | 2 files (+42/-25) | 2 | **PICK** — Bug fix |
| `82e9ddb` | Fix preview navigation forward/back buttons | 3 files (+183/-11) | 2 | **PICK** — UI fix with tests |
| `9108f67` | Fix repo name mismatch when GitHub repo name contains spaces | TBD | 2 | **PICK** — Git integration fix |
| `4ce56cd` | Fix gh pr edit failing on fork PRs by specifying --repo flag | TBD | 1 | **PICK** — CLI fix |
| `eb9f916` | Fix refresh to preserve current route | TBD | 2 | **PICK** — Navigation fix |
| `b49e43e` | Hide uncommitted files banner during streaming | TBD | 2 | **PICK** — UX fix |

**Total:** 12 commits to cherry-pick

---

## RISKY Commits (Risk 3-4) — REVIEW NEEDED

These commits touch areas that may conflict with ABBA features. Review before including.

| SHA | Title | Files Changed | Risk | Concern |
|-----|-------|---------------|------|---------|
| `19ce70c` | Add setting to disable auto-expand of preview panel | 7 files (+41/-2) | 3 | Settings UX overlap |
| `207c919` | Add default chat mode setting | 13 files (+227/-18) | 4 | May conflict with Bella Mode |
| `186f0d6` | Add UI for Git Pull Support | 11 files (+207/-51) | 4 | New UI feature |
| `e73bea9` | Add uncommitted files banner with review & commit dialog | 10 files (+651/-21) | 4 | Large UI change |
| `dc33f67` | Fix Vercel Live URL not updating after new deployments | 2 files (+22/-1) | 3 | Touches Vercel integration |
| `8a53b92` | Auto-commit for local changes before preparing GitHub branch | TBD | 4 | Git workflow changes |
| `8a38dc7` | Refactor React Query keys to centralized factory pattern | TBD | 3 | Internal refactor |
| `5d2e87f` | IPC Contracts | TBD | 4 | Core IPC changes |
| `e9a079f` | Device toggle | TBD | 3 | Device features |
| `f4305a3` | Add MCP HTTP Header support | TBD | 3 | MCP integration |
| `477015e` | Add stringent search_replace tool for local agent | TBD | 3 | Agent tooling |

---

## SKIP Commits (Risk 5) — DO NOT PICK

These commits would conflict with ABBA features or introduce unwanted changes.

| SHA | Title | Reason |
|-----|-------|--------|
| `751e293` | Bump version to v0.35.0 stable release | Version conflict — we use v0.2.x |
| `b5100f1` | Bump version to 0.35.0-beta.1 | Version conflict |
| `2fe32d2` | Bump to v0.35 beta 2 | Version conflict |
| `58b9b1d` | Add Basic Agent mode for free users with 5-message daily quota | **Conflicts with Bella Mode** — 45 files, 2188 insertions |
| `bb0f30b` | Pro Trial models | Subscription model conflict |
| `3e153fd` | Show setup banner for Pro trial | Pro features conflict |
| `f44ad71` | Enable read-only local agent for pro ask mode | Pro features conflict |
| `d2aed44` | Add isPro person property to PostHog telemetry | Pro telemetry conflict |
| `8377178` | Upgrade Electron and Electron Forge to latest versions | Package.json conflict — requires careful manual merge |
| `52e5a3f` | Enable React Compiler | Build system changes — risky |
| `5894cc7` | Upgrade oxlint and enable recommended rules | Tooling conflict |
| `29028f6` | Replace prettier with oxfmt for faster formatting | Tooling conflict |
| `dc9acbd` | Custom theme generator | Large feature — 23 files |
| `de52b9d` | Integrating web crawling in custom theme generator | Feature dependency |

### CI Workflow Commits — SKIP

These modify GitHub workflows that may conflict with ABBA-specific CI:

| SHA | Title |
|-----|-------|
| `eb909bb` | Fix e2e tests & playwright comment job |
| `0e6404c` | Use workflow_dispatch to re-trigger CI |
| `211549a` | Cancel CI runs when PR is merged |
| `da16a66` | Skip E2E tests in CI when only .claude files changed |
| `eddedf2` | Add fail-fast: false to release workflow matrix |
| `909a00b` | Add workflow to cancel CI runs after PR merge |
| `b402b08` | Add PR review responder workflow |
| ... | (additional workflow commits) |

### Claude/Agent Behavior Commits — SKIP

These modify agent behavior that may conflict with Bella Mode:

| SHA | Title |
|-----|-------|
| `6ba5116` | Replace prompt-based stop hook with Sonnet-powered analysis |
| `2093876` | Add stop hook to prevent early stopping |
| `68f4de7` | Use Claude Sonnet to decide permission requests |
| `e25a24d` | Reorganize Claude commands and add permission hooks |
| `446c953` | Add python permission hook |
| ... | (additional agent commits) |

---

## Implementation Plan

1. Create branch: `chore/upstream-intake-2026-01-31`
2. Cherry-pick the 12 SAFE commits in chronological order (oldest first)
3. Resolve any conflicts, preserving ABBA behavior
4. Run full CI locally (typecheck, lint, tests)
5. Push and create PR
6. Merge when CI green
7. Cut release v0.2.19

---

## Conflict Resolution Guidelines

When resolving merge conflicts:

1. **Always prefer ABBA behavior** for:
   - Bella Mode settings/UI
   - Managed Publish flow
   - Vault configuration
   - Branding (names, icons, colors)
   - Profile/auth lock

2. **Keep broker integration intact** in:
   - `src/lib/broker/client.ts`
   - `src/lib/broker/index.ts`
   - `src/ipc/handlers/publish_handlers.ts`

3. **Preserve ABBA-specific files**:
   - `docs/MANAGED_PUBLISH.md`
   - `scripts/verify-branding.mjs`
   - `scripts/verify-no-dyad-branding.mjs`
   - All `verify-*.mjs` guardrails

---

## Future Recommendations

1. **Never use GitHub "Sync fork"** — always use this intake process
2. **Monthly intake reviews** — check upstream for security patches
3. **Consider backporting** Electron upgrade (8377178) after careful testing
4. **Monitor** Pro-related commits for features that could benefit ABBA

---

*Generated by Warp Agent on 2026-01-31*
