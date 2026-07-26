# Deployment and CI (kids_math)

Faster delivery comes from **not repeating the same work** (CI vs local deploy), **caching** expensive CI steps, and optional **E2E sharding** once baselines justify it. Quality gates stay explicit: quick paths **after** validation, not instead of it.

## Single authority: when is each path allowed?

| Path | When to use | Quality gate |
|------|-------------|--------------|
| **Full `./deploy.sh --project …`** | Default local deploy; hotfix without prior CI | Runs lint, unit, build, Playwright install, E2E, then Firebase upload. |
| **`npm run deploy:firebase:quick`** (`--skip-tests`) | Same **commit SHA** already passed **full CI on `main`** | Skips duplicate lint/unit/E2E locally; still runs **`npm run build`** before upload (local compile sanity). Requires **branch protection + required CI on `main`** so quick deploy never replaces CI. |
| **`npm run deploy:firebase:upload-only`** (`--skip-tests --skip-build`) | Optional: same SHA green on `main`, and team accepts **no local `next build`** | Fastest upload; App Hosting still runs its **cloud build** (`alwaysDeployFromSource`). Use only with **Node/build tooling parity** with Firebase App Hosting (see Firebase console build settings). **Not** a substitute for CI. |

**Product framing:** ship faster *after* automated checks pass — not “skip quality.”

**Hotfix / no CI on SHA:** use full `./deploy.sh` without `--skip-tests`, or land CI on a branch and deploy only after green — pick one team policy and stick to it.

**GitHub App Hosting vs CLI:** choose **one primary trigger** (GitHub integration auto-build on `main` vs manual `firebase deploy`) to avoid double deploys or confusion about source of truth.

## CI workflow (`.github/workflows/ci.yml`)

- **Concurrency:** superseded runs on the same ref are cancelled to save minutes (does not shorten a single run).
- **Caches:**
  - **`.next/cache`** — speeds incremental `next build` on warm runners; keyed on `package-lock.json` + `next.config.mjs`. CI still runs a **full** `next build` (no frontend-only shortcut).
  - **Playwright browsers** — `PLAYWRIGHT_BROWSERS_PATH` matches repo-local `.playwright-browsers` (same idea as `deploy.sh`); keyed strictly on `package-lock.json` so `@playwright/test` bumps invalidate the cache.

If Playwright or Node changes in a way caches miss, CI should still fail loudly on real breakage — prefer strict keys over reusing stale browsers across major versions.

## E2E sharding (optional)

**Baseline first:** note GitHub Actions duration for Lint, Build, and E2E before investing.

If E2E dominates wall time, consider Playwright **`--shard=i/n`** with a **matrix** of `n` jobs, **one shared build artifact** (or accept install+build per shard), and **blob reporters + merge** (or project equivalent) for a single combined report. Parallelizing lint vs build vs E2E is possible but easy to get wrong; sharding is often simpler once E2E is the bottleneck.

### Merged E2E report → GitHub Pages

CI runs E2E across **8 shards**. Each shard emits a Playwright **`blob`** report (enabled only under CI — `playwright.config.ts` uses `reporter: process.env.CI ? [["list"],["blob"]] : [["list"]]`, so local `npm run test:e2e` is unchanged) and uploads it as artifact `blob-report-<shard>` (`if: !cancelled()`, so **failed** runs still publish a report). The **`e2e-report`** job then downloads all shard blobs, runs `playwright merge-reports --reporter html`, and publishes the single combined report:

- **Live on GitHub Pages** on every run — commit/PR **and** merge to `main`. It's a **single site, "latest wins"**: the URL shows the most recent run for that ref (no per-PR isolation by design).
- **Downloadable artifact** (`playwright-html-report`) on every run — the fallback when a live deploy can't happen (e.g. fork PRs, whose read-only token has no `pages:write`/`id-token`).
- Reproduce locally: collect the shard zips into `all-blob-reports/` and run `npm run test:e2e:merge`.

**Non-blocking by design:** `e2e-report` sets `continue-on-error: true`. `deploy.yml` gates Firebase on this workflow's `workflow_run.conclusion == 'success'`, so a Pages/merge hiccup must **never** be able to flip CI to failed and wedge the app deploy (same rationale as the `content-accuracy` / `npm audit` advisories).

**One-time prerequisites** (repo settings, not code):
1. **Settings → Pages → Source: GitHub Actions.**
2. **Settings → Environments → `github-pages`:** allow non-`main` branches to deploy (or leave protection off) — otherwise on-commit (PR) deploys are rejected.

## Firebase App Hosting

`firebase.json` uses **`alwaysDeployFromSource: true`** — **remote build** is expected. Local `npm run build` in `deploy.sh` validates tests and sanity; it does **not** replace the cloud build unless you adopt an [artifact-based flow](https://firebase.google.com/docs/app-hosting/alt-deploy) (out of scope unless the team opts in).

**Upload size:** `ignore` excludes paths not needed for source upload (e.g. `.next`, local Playwright browsers). Smaller upload slightly reduces time before cloud build.

## Measurement (before/after)

- **CI:** GitHub Actions job duration (total + Build + E2E steps).
- **Firebase:** App Hosting build duration in console per deploy.
- **Local:** `deploy.sh` with vs without `--skip-tests` / `--skip-build`.

Optional product targets (e.g. median CI minutes, merge-to-live) once a baseline exists.

## Manual spot check (after quick or upload-only deploy)

Run a **short RTL smoke** on the live URL: home → plan → day, and one lock/gate if applicable. This complements CI; it does not replace it.

## Owner

Decide who owns **Firebase GitHub integration vs CLI deploy** and document the default path for the team.
