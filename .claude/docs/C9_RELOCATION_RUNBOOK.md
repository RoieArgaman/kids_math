# App Relocation Runbook — us-east4 → europe-west1 (finding C9)

> **Status:** Planned (MAX, 14/14 role approval over two rounds). **Planning artifact — nothing
> here has been executed.**
> **Goal:** Move the app off `us-east4` (Virginia) onto `europe-west1` — co-located with Firestore
> (`europe-west1`) and far closer to the Israeli users — to eliminate the cross-Atlantic DB hops that
> drove the **~16s login p95** (Appendix C).
> **Shape:** create a **new parallel App Hosting backend** in `europe-west1`, verify it, cut over to the
> new backend's **default `…europe-west1.hosted.app` URL** (no custom domain — owner has no domain yet),
> soak, then decommission the old backend. Firestore does **not** move → no data migration. The old
> backend is the rollback until the soak passes.
> **Domain note:** a custom domain can be added later with **no further migration** — it just maps onto
> the (already-relocated) `europe-west1` backend. Deferring it only means the URL stays region-specific
> for now.
> **Why now:** prod has ~3 user docs (effectively pre-launch). The one-time origin change
> (localStorage/cookies reset) is essentially free today and gets costlier as you grow.

---

## Prerequisites (owner)

- **No domain needed** — this uses the new backend's default `…europe-west1.hosted.app` URL (auto-SSL).
  The new URL replaces the old one; you and any users switch to it (fine at ~3 users). Add a custom
  domain later if/when you want a stable, region-independent URL.
- `firebase` CLI (installed, 15.x) — may need a one-time `firebase login`.
- `gcloud` authed on `kids-learing-hub` (already set up).
- Do the cutover in a **low-traffic window** (pre-Shabbat Friday / late evening Israel).

## Key facts baked into this plan

- App Hosting **backend region is fixed at creation** → relocation = new backend.
- Session cookie is **host-only**; **localStorage is origin-scoped** → the new origin resets both.
  Logged-in users' progress re-hydrates from Firestore after one re-login; anonymous users' local
  progress is lost (acceptable at ~3 users; message "log in to keep your progress" if any real user).
- The app has **no hardcoded self-URLs** (all relative) → only 3 config lines + docs change.

---

## Step 1 — Create the parallel backend  ·  OWNER

```bash
firebase apphosting:backends:create \
  --project kids-learing-hub \
  --location europe-west1
# Interactive: connect the SAME GitHub repo + branch (main). Name it e.g. "kids-math-eu".
```
It builds from the same repo, so it inherits `apphosting.yaml` (⇒ `minInstances:1`,
`RATE_LIMIT_ENFORCE=1` carry over automatically). **Verify:** the backend builds and serves at its new
`…europe-west1.hosted.app` URL. **Rollback:** delete the new backend; the old is untouched.

## Step 2 — Grant the new backend access to the JWT secret  ·  OWNER  ·  🔴 hard gate

Every login 500s if the new backend can't read `kids-math-jwt-secret`.
```bash
firebase apphosting:secrets:grantaccess kids-math-jwt-secret \
  --backend kids-math-eu --project kids-learing-hub
```
**Verify:** `curl -X POST https://<new-eu-url>/api/auth/login -d '{...}'` returns 200 + a `Set-Cookie`
(not 500). Also hit `GET /api/health` → `{status:"ok"}` (proves Firestore connectivity from the new region).

## Step 3 — Note the new default URL  ·  OWNER  ·  (no domain/DNS/SSL)

The `europe-west1` backend automatically gets a `…europe-west1.hosted.app` URL with managed SSL —
nothing to configure. Grab the exact URL:
```bash
firebase apphosting:backends:list --project kids-learing-hub   # note kids-math-eu's URL
```
This URL is what replaces the old `…us-east4.hosted.app`. **Caveat:** the old URL keeps serving the old
backend until you decommission it (Step 8); after that, old-URL bookmarks break. There is no shared
stable origin without a custom domain — acceptable at ~3 users, and a domain can be added later.

## Step 4 — Validate on the new origin  ·  OWNER (I can run under your auth)  ·  cutover gate

1. **Smoke:** login, progress GET/POST, `/api/health` on the new origin.
2. **🔴 Re-verify `TRUSTED_PROXY_HOPS`** on the new backend — a different region/front-end path could
   change the `X-Forwarded-For` hop count. Temporarily re-add the `/api/diag/ip` probe (see #78/#80),
   hit it from a known IP, confirm `clientIp` is the real client (not a Google IP). If the chain
   differs, adjust `TRUSTED_PROXY_HOPS` **before** relying on the enforcing limiter. Remove the probe.
3. **Load test** against the new origin:
   ```bash
   ACCESS_TOKEN=$(gcloud auth print-access-token) COUNT=20 PREFIX=kmload \
     node scripts/load/seed-load-users.mjs > /tmp/users.json
   USERS="$(cat /tmp/users.json)" BASE_URL="https://<new-eu-url>" \
     PUSH_VUS=20 BURST_RATE=3 DURATION=60s k6 run scripts/load/progress-load.js
   ACCESS_TOKEN=$(gcloud auth print-access-token) COUNT=20 PREFIX=kmload \
     node scripts/load/cleanup-load-users.mjs
   ```
   **Gate:** login p95 must drop from ~16s to **< 3s** (the whole point). If it doesn't, stop and
   investigate before cutover.

## Step 5 — Cutover PR  ·  REPO (I prepare)

One PR, three edits:
- `firebase.json` → `"backendId": "kids-math-eu"`
- `.github/workflows/deploy.yml` → `--only "apphosting:kids-math-eu"`
- `.github/workflows/load-test.yml` → default `BASE_URL` = the new `…europe-west1.hosted.app` URL

Merge → the CI-gated deploy now targets the new backend. **Verify:** a `main` deploy lands only on
`kids-math-eu`; `https://<new-eu-url>` serves the latest. **Rollback:** revert the PR → deploys
return to the old backend (still running).

## Step 6 — Re-point monitoring  ·  OWNER

The uptime check + alert are bound to the old host. Create a **new uptime check** on
the new `…europe-west1.hosted.app/api/health` (same steps as `OBSERVABILITY_RUNBOOK.md` Step 2), retire
the old one, and repoint the alert policy.

## Step 7 — Soak  ·  OWNER

Watch the uptime / error-spike / latency signals through at least one class-start window on the new
origin. Keep the **old backend running** as the rollback the entire time.

## Step 8 — Decommission the old backend  ·  OWNER  ·  do last

Only after the soak passes:
```bash
firebase apphosting:backends:delete kids-math --project kids-learing-hub
```
Removes the double `minInstances:1` cost. **Verify:** old URL gone; new serves. This is the
point of no return — everything before it is reversible.

## Step 9 — Follow-on

- Tighten the k6 **login threshold** in `progress-load.js` to the new (lower) latency.
- **Enable the weekly load-test `schedule`** in `.github/workflows/load-test.yml` (the C9-gated item).

---

## Rollback summary

| Phase | Rollback |
|-------|----------|
| Steps 1–4 (parallel build/verify) | Delete the new backend; prod never touched |
| Step 5 (cutover PR merged) | Revert the PR → deploys + traffic return to old backend |
| Step 6–7 (monitoring/soak) | Revert the cutover PR (deploys return to old backend) + use the old URL |
| Step 8 (old backend deleted) | **Point of no return** — only after soak confidence |

## Owner checklist

- [ ] New `europe-west1` backend builds & serves (Step 1)
- [ ] Secret access granted; login 200 + `/api/health` ok on new origin (Step 2)
- [ ] New `…europe-west1.hosted.app` URL noted (auto-SSL; no domain) (Step 3)
- [ ] `TRUSTED_PROXY_HOPS` re-verified; load-test login p95 < 3s (Step 4)
- [ ] Cutover PR merged; `main` deploy verified on new backend (Step 5)
- [ ] New uptime check + alerts on the new host (Step 6)
- [ ] Soak clean through a class-start window (Step 7)
- [ ] Old backend decommissioned (Step 8)
- [ ] k6 thresholds tightened + weekly cron enabled (Step 9)

**Acceptance:** login p95 < 3s (from ~16s); zero data loss for logged-in users; old backend gone;
rollback exercised. Then finding **C9 → resolved**.
