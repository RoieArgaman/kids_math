# Load testing (roadmap Phase 2.4 / C7)

`progress-load.js` is a [k6](https://k6.io) script that simulates kids_math classroom
concurrency — a **login burst** followed by steady **progress pushes** — so we can record a
throughput/latency baseline and see where the single `user_progress/{userId}` doc starts to
contend (finding **C5**, feeds Phase 4).

It is a k6 script (run by the `k6` binary), deliberately **outside** the TypeScript / ESLint /
Next build / vitest scope.

## ⚠️ Safety

**Never run this against production.** Use a scratch/staging App Hosting backend (staging is
deferred — spin up a throwaway target or run locally) with **disposable test users**. The
script only reads/writes progress for the accounts you give it.

## Prerequisites

1. **Install k6** — `brew install k6` (macOS) or see https://k6.io/docs/get-started/installation/.
2. **A running target** with real Firestore (the routes hit Firestore):
   - Local: `npm run dev -- -p 3005` with `FIRESTORE_CREDENTIALS_JSON` + `JWT_SECRET` in
     `.env.local`, or
   - a scratch deploy.
3. **Test users** (admin-created — the script never creates accounts):
   ```bash
   npm run create-user            # follow prompts, or script several
   ```

## Run

```bash
# Single default user against a local server
k6 run scripts/load/progress-load.js

# Realistic: a room of distinct accounts + tuned load against a scratch target
BASE_URL="https://<scratch-target>" \
PUSH_VUS=30 BURST_RATE=4 DURATION=2m \
USERS='[{"username":"kid1","password":"pw1"},{"username":"kid2","password":"pw2"}]' \
k6 run scripts/load/progress-load.js
```

### Config (env vars)

| Var | Default | Meaning |
|-----|---------|---------|
| `BASE_URL` | `http://localhost:3005` | Target base URL |
| `USERS` | single user | JSON array of `{username,password}` |
| `USERNAME` / `PASSWORD` | `loadtest` / `loadtest123` | Single-user fallback |
| `BURST_RATE` | `4` | Logins/sec in the 30s burst (~40 / 10s) |
| `PUSH_VUS` | `30` | Steady progress-push virtual users (~one classroom) |
| `DURATION` | `2m` | Steady-phase length |

## Reading the result

k6 prints per-scenario latency and the custom trends `login_latency` /
`progress_push_latency`, plus the `login_failed` / `progress_push_failed` rates. Thresholds
mirror the capacity targets in [`OBSERVABILITY_RUNBOOK.md`](../../.claude/docs/OBSERVABILITY_RUNBOOK.md)
(login p95 < 3000 ms — bcrypt(12) is heavy; push p95 < 2000 ms; error rate < 1%).

**To find C5 contention:** re-run with rising `PUSH_VUS` (30 → 60 → 120 …) and watch
`progress_push_latency` p95. The knee where it climbs sharply is where the single-doc merge
transaction serializes — that's the evidence Phase 4.3 uses to decide on per-domain
subcollections.

## Record the baseline

Paste the summary (throughput, login p95, push p95, error rate, and the `PUSH_VUS` knee) into
**Appendix C** of `roadmap/PRODUCTION_HARDENING_ROADMAP.md`, with the date, target, and commit
SHA. That closes the Phase 2.4 deliverable.
