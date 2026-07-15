# Observability Runbook — kids_math (Phase 2.3)

> **Status:** Runbook for roadmap Production Hardening **Phase 2.3** (findings **C3 / C7**).
> **Scope:** how to turn the code-level observability shipped in **sub-PR 2A** into live
> monitoring: error tracking, an uptime check, alerting, a dashboard, and documented
> capacity targets.
> **Audience:** the project owner / on-call. Most steps are **GCP / Firebase console
> actions** — they cannot be done from the repo. Each step says who does it.
> **Prereqs:** sub-PR 2A merged ([#71](https://github.com/RoieArgaman/kids_math/pull/71)) —
> structured logger, `captureError` seam, `audit_log`, and `GET /api/health` are live.

---

## What 2A already gives us (the code side)

| Capability | Where | How it surfaces in GCP |
|-----------|-------|------------------------|
| Structured logs | `lib/observability/logger.ts` — one JSON line per event, `severity` ∈ `INFO/WARNING/ERROR`, PII-redacted | Auto-collected by **Cloud Logging** on App Hosting (Cloud Run) stdout/stderr |
| Error capture | `lib/observability/errorReporting.ts` `captureError` — logs `ERROR` + `stack` | Auto-grouped by **Error Reporting** (ingests ERROR logs carrying a stack) |
| Admin audit trail | `lib/observability/auditLog.ts` → `audit_log` Firestore collection | Queryable in **Firestore console** / via Admin SDK |
| Readiness probe | `GET /api/health` → `200 {status:"ok"}` or `503 {status:"degraded"}` | Target for an **Uptime check** |

Because error reporting is **log-based**, there is **no SDK/DSN to install** — errors flow
automatically once the app is deployed. The single swap seam to Sentry later is
`captureError` (see its doc comment).

---

## Step 1 — Error Reporting view  ·  OWNER (console)  ·  finding C3

1. GCP Console → **Error Reporting** (project `kids-learing-hub`).
2. Confirm errors are arriving: trigger a known 500 (e.g. hit `/api/user/progress` POST with
   a malformed body against a broken backend in staging, or wait for organic traffic). Each
   `captureError` ERROR log with a `stack` becomes a grouped error.
3. **Notifications:** open an error group → **Configure notifications** → send to the owner's
   email (and a Slack channel later if desired).
4. **PII check (do this once):** open a real error group and confirm the log payload shows
   `username: "[REDACTED]"` and no token/password. If any PII leaks, that's a
   `logger.ts` deny-list bug — fix there, not by scrubbing in the console.

## Step 2 — Uptime check on `/api/health`  ·  OWNER (console)  ·  finding C7

1. GCP Console → **Monitoring → Uptime checks → Create uptime check**.
2. Config:
   - **Protocol:** HTTPS · **Path:** `/api/health`
   - **Host:** the App Hosting production domain
   - **Check frequency:** 1 min · **Regions:** ≥ 3
   - **Response validation:** response code **must be `200`** (a `503` = Firestore
     degraded ⇒ page). Optionally also assert body contains `"status":"ok"`.
3. Save. This is the canonical "is the site up and can it reach Firestore" signal.

> Note: `/api/health` is intentionally **unauthenticated** (uptime monitors can't log in) and
> does one cheap Firestore read per hit. It returns no secrets. Accepted trade-off; if abuse
> shows up, it can be moved behind a monitor-only token later.

## Step 3 — Alerting policies  ·  OWNER (console)  ·  findings C3 / C7

Create these in **Monitoring → Alerting → Create policy**. Suggested starting thresholds
(tune after the 2.4 load test and a soak):

| Policy | Signal | Condition (starting point) | Severity |
|--------|--------|----------------------------|----------|
| **Uptime failure** | Uptime check (Step 2) | Any region failing > 2 consecutive checks | Page |
| **5xx rate** | Cloud Run request count, `response_code_class = 5xx` | > 2% of requests over 5 min | Page |
| **Error spike** | Error Reporting / log-based metric on `severity=ERROR` | > 10 new errors / 5 min, or a new error group | Notify |
| **p95 latency** | Cloud Run request latency | p95 > 2000 ms over 10 min | Notify |
| **Instance saturation** | Cloud Run container instance count | sustained at `maxInstances` | Notify |

Route **Page** policies to email/SMS, **Notify** to email/Slack.

## Step 4 — Dashboard  ·  OWNER (console)  ·  finding C3

**Monitoring → Dashboards → Create**. Tiles:

- Request count by `response_code_class` (2xx/4xx/5xx)
- Request latency p50 / p95 / p99
- Container instance count + CPU/memory utilization
- `ERROR`-severity log volume (log-based metric)
- Uptime-check pass ratio
- **Rate-limit shadow hits** — log-based metric on `[rate-limit:shadow]` (this is the data
  that tunes the 2E enforce thresholds; see Step 6)

## Step 5 — Reading the audit log  ·  OWNER  ·  finding S9

Admin mutations write to the **`audit_log`** Firestore collection (one row per action):
`{ actorId, action: "user.create"|"user.reset"|"user.delete"|"user.unlock", targetId, meta, at }`.
Query in the Firestore console (order by `at` desc) or via the Admin SDK. Passwords/hashes are
never stored. A future admin-facing viewer is out of scope here.

## Step 6 — Feeds into later sub-PRs

- **2.4 (load test):** the dashboard's latency + instance tiles are where the classroom-burst
  baseline is read; record numbers in **Appendix C**.
- **2.7 / 2E (enforce limiter):** the **rate-limit shadow-hit** metric (Step 4) is how we pick
  enforcing thresholds without false-positiving shared classroom IPs. **Also verify
  `TRUSTED_PROXY_HOPS`** here: inspect real `X-Forwarded-For` values in Cloud Logging (Appendix
  A of the roadmap) before flipping the limiter to enforcing.
  - **The flip itself (2E code already shipped, flag-off):** once the two checks above pass,
    (1) create a **Firestore TTL policy on `rate_limits.expiresAt`** so the collection self-prunes,
    then (2) set `RATE_LIMIT_ENFORCE=1` in `apphosting.yaml` and deploy. The limiter then returns
    **429** (`{error:"rate_limited", retryAfterSeconds}` + `Retry-After`) over threshold. It stays
    **fail-open** (a Firestore outage never blocks). Revert instantly by setting the flag back to
    `0`. Watch the 5xx / error-spike alerts through the first class-start after the flip.

---

## Capacity targets (documented — validate in 2.4)

Starting targets for a small-district / multi-classroom launch. These are **assumptions to be
confirmed by the 2.4 load test**, not measured facts yet.

| Metric | Target (initial) | Rationale |
|--------|------------------|-----------|
| Concurrent active learners | ~300 | ~10 classrooms × ~30 students, overlapping sessions |
| Login burst | ~40 logins / 10 s | One classroom starting together |
| Progress pushes | ~1 push / student / 30 s | Debounced `scheduleSync` cadence |
| p95 request latency | < 2000 ms | Kid-acceptable responsiveness incl. cold-start tail |
| Availability | 99.5% | Reasonable for a single-region ed-tech MVP |

Cold starts (`minInstances: 0`) are an accepted trade-off for now (owner decision, 2026-07-15);
revisit if the latency p95 alert fires often at class-start.

---

## How to verify this runbook end-to-end (owner checklist)

- [ ] Error Reporting shows at least one grouped error with `username` redacted.
- [ ] Uptime check is green and pages on a forced `503`.
- [ ] Each alert policy has fired once in a drill (or is confirmed wired to a channel).
- [ ] Dashboard renders all tiles with live data.
- [ ] An admin create/reset/delete produced an `audit_log` row.

When all boxes are checked, flip roadmap **Progress tracker → Phase 2.3** notes and proceed to
2.4 (load test).
