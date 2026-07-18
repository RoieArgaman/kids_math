# SECURITY.md — Security posture & vulnerability disclosure (kids_math)

> ## ⚠️ NOT LEGAL ADVICE — engineering posture only
>
> This document describes the security controls **that are actually implemented in this repo**,
> so a reviewer can verify each claim against the code. It is not a legal representation, a
> warranty, a certification, or a compliance attestation. For the children's-data position see
> [`COMPLIANCE.md`](COMPLIANCE.md).

**Last verified against the code:** 2026-07-18.

---

## Reporting a vulnerability

> ### 🚧 PLACEHOLDER — FILL THIS IN BEFORE PUBLISHING
>
> **The contact details below are not real.** No monitored security mailbox has been set up for
> this project. Anyone shipping this repo publicly must replace this block with a real, monitored
> channel first — an unmonitored disclosure address is worse than none, because it converts a
> would-be private report into a public one.

| Field | Value |
|---|---|
| Contact | `security@<DOMAIN — TO BE FILLED IN>` |
| PGP key | *(optional — add fingerprint or remove this row)* |
| Preferred language | Hebrew or English |
| Acknowledgement target | **TBD** (suggested: 3 business days) |
| Triage / initial assessment target | **TBD** (suggested: 10 business days) |
| Fix target, critical severity | **TBD** (suggested: 30 days) |
| Public disclosure | Coordinated; suggested 90 days from report, or on fix release |

**Please do:** report privately and give us a reasonable window before disclosure; include
reproduction steps and the affected route or file; use a test account.

**Please do not:** access, modify, or exfiltrate any real learner's data; run automated scanners
or load/DoS tests against production; social-engineer users or staff. This is a children's
education product — a proof of concept that touches a real child's record is not an acceptable
demonstration.

We do not currently run a paid bug-bounty programme.

---

## Supported versions

| Version | Supported |
|---|---|
| `main` (deployed to the `kids-math-eu` App Hosting backend) | ✅ Security fixes |
| Any other branch, tag, or fork | ❌ |

This is a single-tenant, continuously-deployed application, not a released library. There are no
maintained release branches: **the deployed `main` is the only supported version**, fixes land
there, and the deploy pipeline ships them. Report against `main`.

---

## Implemented controls

Each row is verifiable at the cited path. See
[`roadmap/PRODUCTION_HARDENING_ROADMAP.md`](roadmap/PRODUCTION_HARDENING_ROADMAP.md) for the
finding ids in brackets.

### Authentication & sessions

| Control | Detail | Where |
|---|---|---|
| **Password hashing** | bcrypt, **cost 12**. No password is stored or logged in the clear. | `app/api/admin/users/route.ts` (`BCRYPT_ROUNDS = 12`) |
| **Session tokens** | JWT, **HS256**, **30-day** expiry, in an httpOnly cookie `kids_math_session`. Secret from Secret Manager, min 32 chars, enforced at read. | `lib/auth/jwt.server.ts` |
| **Session revocation** | `tokenVersion` claim embedded in the JWT and compared against the stored value. Bumped on password reset, "log out everywhere", and every lifecycle transition — so revocation is **immediate** on data routes, not deferred to expiry. Absent claim ⇒ 0, keeping pre-existing sessions valid. [S4] | `lib/auth/session.server.ts` |
| **Account lifecycle enforcement** | `verifySession` reads the user doc on every call and refuses non-active accounts. Absent `status` ⇒ active (no backfill, so legacy docs are not locked out). | `lib/auth/accountStatus.ts` |
| **Account lockout** | 5 consecutive failures ⇒ 60-second cooldown, keyed by `sha256(usernameLower)` in shared Firestore state (survives multi-instance and cold starts). Fail-open by design. [1.2] | `lib/security/accountLockout.ts` |
| **Anti-enumeration** | Login always performs a bcrypt compare — a dummy cost-12 hash on the unknown-user path — so timing does not reveal account existence. Failures are recorded for unknown usernames too, so lockout behaviour is identical on every path. [S2] | `app/api/auth/login/route.ts` |
| **Password policy** | Minimum 6 chars plus a small deny-list of trivial passwords. Admins may `overridePolicy` for a kid-friendly PIN; an **empty password is always rejected**, even under override. | `lib/security/passwordPolicy.ts` |

### Request handling

| Control | Detail | Where |
|---|---|---|
| **Rate limiting — enforcing** | Firestore-backed shared-state fixed-window limiter. **Enforcement is ON** (`RATE_LIMIT_ENFORCE=1`, enabled 2026-07-17 after threshold validation): over-threshold requests get a `429` with `Retry-After`. Keyed by IP+username (login), userId (progress), adminId (admin mutations). Doc ids are `sha256(key)`. **Fail-open** — a limiter outage must never take the app down. Reversible instantly by setting the flag to `"0"`. [S1] | `lib/security/rateLimit.ts`, `apphosting.yaml` |
| **Trusted client IP** | `X-Forwarded-For` parsed from the **right**, past `TRUSTED_PROXY_HOPS = 2` — verified against real App Hosting traffic. A client can only prepend spoofed entries on the left, so this is not spoofable. [S11] | `lib/security/clientIp.ts` |
| **Body size caps** | Login `4 KiB` (enforcing). Progress `1,000,000` bytes, sitting just under Firestore's ~1 MiB doc ceiling; **staged** behind `PROGRESS_BODY_CAP_ENFORCE` (default off ⇒ log-only) so no long-time student's accumulated bundle is rejected. [S5] | `lib/security/bodyLimit.ts` |
| **Input validation** | All request bodies parsed with zod schemas in one auditable module. The progress bundle is validated at the **envelope** level only (`bundleVersion` ∈ 1–4) — deep validation would risk rejecting real stored learner data. [S8] | `lib/security/schemas.ts` |
| **Authorization** | Admin routes gate on `role === "admin"` **and** `requireVersionCheck: true`, so a revoked admin session is refused immediately. Self-action guards prevent an admin deleting or deactivating their own account, and lifecycle transitions re-assert the actor inside the Firestore transaction so two admins cannot concurrently deactivate each other. There is **no** guard against reducing the system to a single admin (S16, open). | `app/api/admin/users/route.ts` |

### Transport & browser

Set for all routes in [`next.config.mjs`](next.config.mjs):

| Header | Value | Note |
|---|---|---|
| `Strict-Transport-Security` | `max-age=86400` | **Staged** — short max-age, no `includeSubDomains`/`preload`, so the browser commitment self-heals. Ramp only after an all-HTTPS soak. |
| `Content-Security-Policy-Report-Only` | `default-src 'self'`; no third-party origins | ⚠️ **Report-Only — not enforcing.** `'unsafe-inline'` is required for `next/font` and App Router hydration scripts, and there is no nonce infrastructure yet. Violations are observed before a later switch to enforcing. [S3] |
| `X-Frame-Options` | `DENY` | Also `frame-ancestors 'none'` in the CSP. |
| `X-Content-Type-Options` | `nosniff` | |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` | |

### Data layer

| Control | Detail | Where |
|---|---|---|
| **Firestore rules — deny-all** | `allow read, write: if false` on `/{document=**}`. The app reaches Firestore exclusively via the Admin SDK, which **bypasses rules**, so this is inert for current traffic — that is the point: if a client Firebase SDK is ever added by accident or dependency, it fails closed instead of exposing learner data. A leaked API key or project id grants nothing. [S10] | `firestore.rules` |
| **Admin audit log** | Append-only `audit_log` row for every admin mutation (`user.create`, `user.reset`, `user.delete`, `user.deactivate`, `user.restore`, `user.unlock`) **and every data export** (`user.export`): actor, action, target, timestamp. Best-effort by design — an audit-write failure must never break the admin action. Never stores passwords, hashes, or tokens. [S9] | `lib/observability/auditLog.ts` |
| **Data-export projection** | `GET /api/admin/users/export` is admin-gated, version-checked, rate-limited, and audited before responding. The payload is built by an **explicit allow-list** — fields copied by name, never a spread-and-delete — so `passwordHash`, `tokenVersion`, and `usernameLower` cannot leak however the user doc evolves. Response is `no-store`. [C2a] | `lib/compliance/export.ts` |
| **Backups & PITR** | Firestore **PITR**, rolling 7 days at ~1-minute granularity. **Daily scheduled backups, 14-day retention.** Targets: RPO ≤ 1 hour, RTO ≤ 4 hours, with a recorded restore drill. [C8] | [`.claude/docs/DISASTER_RECOVERY_RUNBOOK.md`](.claude/docs/DISASTER_RECOVERY_RUNBOOK.md) |
| **Secrets** | `JWT_SECRET` from Google Secret Manager, never committed. CI runs a **blocking** `gitleaks` secret scan on every diff, including docs-only ones. Rotation runbook in the roadmap, Appendix B. [S12] | `apphosting.yaml` |
| **Dependency hygiene** | Dependabot (npm + actions); CI `npm audit --audit-level=high` (non-blocking). [S6] | `.github/dependabot.yml` |

---

## Deployment caveat — `firestore.rules` is not deployed by CI

**Committing `firestore.rules` does not deploy it.** `.github/workflows/deploy.yml` pins its
deploy to `--only "apphosting:kids-math-eu"`, which by design cannot widen to Firestore
configuration. The rules ship **only** when a human runs, explicitly:

```bash
firebase deploy --only firestore:rules
```

Treat "the file is in the repo" and "the rules are live in the project" as **two separate facts**.
Verify the deployed rules in the Firebase console rather than inferring them from the repo. After
deploying, confirm `/api/health` and a login still work.

---

## Known gaps

Stated plainly; each is tracked in the roadmap's findings register.

- **CSP is Report-Only**, not enforcing — it observes violations, it does not stop them. [S3]
- **HSTS is staged** at a 24-hour max-age with no preload. [S3]
- **The progress body cap is log-only** by default. [S5]
- **The rate limiter and the lockout both fail open** — a Firestore outage disables them rather
  than blocking traffic. This is a deliberate availability trade-off for a children's app.
- **No true erasure exists.** Delete is a soft delete; data is retained. See
  [`COMPLIANCE.md`](COMPLIANCE.md) → Limitations. [C2b]
- **No penetration test or third-party security audit** has been performed.
- **The admin users list is unbounded** (`orderBy().get()`, plus one lockout read per user) —
  a scale and cost issue rather than a vulnerability. [C4]
