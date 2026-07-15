# Phase 1 Plan — Session Integrity & Auth Hardening

> **Status:** APPROVED (MAX, two-round plan review — 14/14 roles, 0 CONCERN).
> **Seeds:** `roadmap/PRODUCTION_HARDENING_ROADMAP.md` → Phase 1 (findings S4, S7, S8, S12).
> **Mode:** MAX — security-sensitive (cookies/API/admin) + additive `users`-schema field.
> **Approved decisions:**
> - **S7** → keep grade-unlock routes anonymous-accessible + zod-harden (anonymous `reconcile.ts` relies on them); document intentional-unauthenticated rationale. Real gating deferred to Phase 5.
> - **Lockout** → uniform generic response + count failures for unknown usernames (preserves S2 anti-enumeration); bcrypt still runs. **Cooldown = 1 minute** (60s) after N failures — short, kid-friendly speed-bump; N default = 5 (confirm at build).
> - **R2-B** → version-check `/api/auth/me` too (clean revocation on next app-load; ~1 read/load), overriding the roadmap's pure-JWT-/me note.
> - **Admin unlock (added post-approval)** → an admin can immediately clear a locked-out account, and a password reset also clears the lockout. A locked student must not have to wait out the cooldown when a teacher/admin is helping them.
> - **Admin policy override (added post-approval)** → admin create/reset accepts `overridePolicy: true` to set any non-empty password, bypassing `validatePasswordStrength`. Kids need PIN-like simple passwords; the policy is the default guardrail, the override is an explicit opt-out. Off by default; admin-only; capture in the Phase 2 audit log.
> - **Kids-gaming UX (post-approval, PM review):** the 1-minute lockout mostly fires on legit kids mistyping a masked password, so these ship in the same PR to blunt it: (1) show-password 👁 toggle, (2) non-punitive + TTS-voiced lockout with a live countdown, (3) "one more try" warning before locking, (5) warm blame-free login error, (6) `inputMode="numeric"` on the password field. (4) **"Log out everywhere" is admin-only** (hidden from a child's avatar menu). (8) **"locked" badge** on locked rows in `AdminUsersScreen`. Deferred to roadmap backlog: full avatar+PIN login (UX1) and playful avatars (UX2).

## Scope

Roadmap Phase 1: 1.1 revocable sessions (`tokenVersion`), 1.2 password policy + account
lockout, 1.3 centralized zod validation, 1.4 zod-harden grade-unlock routes (kept anonymous),
1.5 JWT-rotation runbook (docs only).

**Out of scope (later phases):** admin audit log (Phase 2), observability (Phase 2), general
429 enforcement (Phase 2.7), `firestore.rules` (Phase 3), tenancy/`orgId` (Phase 4),
self-registration/freemium (Phase 5). No educational-content change.

## Backward-compat invariant (CRITICAL)

Token-claim `tokenVersion` absent ⇒ `0`; doc-field absent ⇒ `0`. A live 30-day token (v0)
against an untouched user doc (v0) stays valid. `auth-backward-compat.spec.ts` and
`multi-user-isolation.spec.ts` must stay green.

## Files to touch

**New**
- `lib/auth/session.server.ts` — `verifySession(request, { requireVersionCheck })` + `SessionClaims` type.
- `lib/security/schemas.ts` — zod schemas (login, admin create/patch/delete, subject; progress = **envelope-only**).
- `lib/security/passwordPolicy.ts` — `validatePasswordStrength()`.
- `lib/security/accountLockout.ts` — enforcing, **fail-open** lockout on shared Firestore store; `expiresAt` field for future TTL; exports `clearLockout(usernameLower)` for admin/reset unlock.
- `app/api/auth/logout-all/route.ts` — `logout` + `tokenVersion` bump.
- Tests: `tests/unit/lib/auth/{tokenVersion,sessionVersion}.test.ts`,
  `tests/unit/lib/security/{passwordPolicy,accountLockout,schemas}.test.ts`,
  `tests/e2e/session-revocation.spec.ts`.

**Modified**
- `lib/auth/jwt.server.ts` — `signToken(user, tokenVersion)`; `verifyToken` returns `{ …AuthUser, tokenVersion }` (absent ⇒ 0).
- `lib/auth/types.ts` — add server-only `SessionClaims`; leave `AuthUser` untouched.
- `app/api/auth/login/route.ts` — sign with doc `tokenVersion` (free — doc already read); lockout check/reset; zod.
- `app/api/auth/me/route.ts` — adopt new verify; **version-check** (R2-B).
- `app/api/admin/users/route.ts` — PATCH bumps `tokenVersion` **via transaction** (fake can't do `FieldValue.increment`); POST/PATCH password policy **unless `overridePolicy: true`** (still requires non-empty password); version-check on mutations; zod. **Admin unlock:** `PATCH { userId, action: "unlock" }` → `clearLockout`; password reset also calls `clearLockout`.
- `app/api/user/progress/route.ts` — version-check on GET/POST; **envelope-only** zod.
- `lib/auth/{api.ts,context.tsx}` — warm blame-free error copy; lockout error mapping; `apiLogoutAll`; logout-all handler mirroring `logout()`.
- `components/auth/LoginModal.tsx` — show-password 👁 toggle; `inputMode="numeric"` on password; non-punitive lockout message + live countdown + TTS voicing; "one more try" warning.
- `components/auth/UserAvatar.tsx` — "log out everywhere" **admin-only** (gate by `role === "admin"`, like the admin-users link).
- `components/screens/AdminUsersScreen.tsx` — per-row **"unlock account"** button + **"locked" badge** on locked rows; **"allow simple password" override checkbox** on the create + change-password forms (Hebrew, RTL, shared UI, testIds).
- `lib/testIds.ts` — testIds: `logoutEverywhere`, `showPasswordToggle`, lockout message + countdown, admin `unlockButton`, `lockedBadge`, `overridePasswordCheckbox`.
- `lib/server/gradeUnlockCookies.ts` — zod `subjectSchema` in `readSubject`; intentional-anonymous comment.
- `apphosting.yaml` — secret-versioning comment.
- `package.json` — add `zod`.
- `tests/unit/app/api/authLogin.test.ts` — update line-70 `toEqual` to expect `tokenVersion: 0` (R2-D).
- Docs: roadmap Appendix B (rotation runbook) + Progress-tracker row; `.claude/docs/LEARNING_LOG.md` entry.

## Implementation order

1. Add `zod` + `lib/security/schemas.ts` (login/admin/subject full; **progress envelope-only**).
2. `tokenVersion` in JWT core (`signToken`/`verifyToken`, absent ⇒ 0).
3. `lib/auth/session.server.ts` DB-checked `verifySession`.
4. Login: sign live version + `accountLockout` (uniform response, count unknowns, reset on success).
5. Admin PATCH bumps version (transaction) + version-check mutations + password policy (**skipped when `overridePolicy`**) + zod; **admin unlock action** (`clearLockout`) + password-reset also clears lockout; unlock button + "allow simple password" checkbox in `AdminUsersScreen`.
6. Progress GET/POST version-check + envelope-only zod.
7. `/api/auth/me` version-check (R2-B).
8. `logout-all` = logout + bump; **admin-only** avatar action + testId + context handler.
9. Kids-gaming UX in `LoginModal`: show-password toggle, `inputMode="numeric"`, non-punitive lockout message + countdown + TTS, "one more try" warning; warm error copy in `apiLogin`; "locked" badge in `AdminUsersScreen`.
10. 1.4 grade-unlock zod (kept anonymous) + comment.
11. 1.5 rotation runbook (Appendix B) + apphosting comment.
12. Flip roadmap tracker + `LEARNING_LOG.md` entry.

## Quality gates (MAX)

`npm run test:qa` on PR CI. Locally: fast gates only (tsc/lint/`check:testids`/targeted unit).
Two review cycles + QA-team pass + Playwright visual on LoginModal/avatar + verification report.
Mandatory Learning-Loop entry.

## Definition of Done

1. Admin reset **and** "log out everywhere" revoke sessions immediately on version-checked routes; legacy no-version token still works.
2. Password policy on create/reset (with an admin **`overridePolicy`** opt-out for simple/PIN passwords, non-empty still required); lockout after N failures with a **1-minute** cooldown, fail-open, no account-existence leak. An admin can immediately unlock a locked account; a password reset also clears the lockout.
3. All small bodies validated via `lib/security/schemas.ts`; no hand-rolled `typeof` guards remain; progress stays envelope-only.
4. Grade-unlock routes zod-hardened, unauthenticated status deliberately documented.
5. JWT rotation runbook (Appendix B) + apphosting note.
6. `auth-backward-compat` + `multi-user-isolation` green; new `session-revocation` e2e green; `LEARNING_LOG.md` entry added.
7. Kids-gaming UX shipped: show-password toggle, numeric password keypad, non-punitive TTS-voiced lockout + countdown + "one more try" warning, warm error copy; "log out everywhere" admin-only; admin "locked" badge + unlock. `check:testids` passes for all new elements.

---

## Testing Plan (unit · component · e2e)

> MAX ⇒ full `npm run test:qa` on PR CI. Every new module gets unit coverage; every new
> UI element gets a testId (`check:testids`) + component test; revocation/lockout/anonymous
> flows get e2e. **Regression anchors `auth-backward-compat.spec.ts` + `multi-user-isolation.spec.ts`
> must stay green.** Route tests use the existing `FakeFirestore`.

### Unit (Vitest) — logic & routes

| File | Cases |
|------|-------|
| `tests/unit/lib/auth/tokenVersion.test.ts` (new) | sign→verify roundtrip carries version; **legacy token with no version claim ⇒ verifies as 0**; tampered token → null. |
| `tests/unit/lib/auth/sessionVersion.test.ts` (new) | `verifySession` matrix: token v0 + doc absent ⇒ ok; v0 + doc v0 ⇒ ok; token v0 + doc v1 ⇒ **reject**; token v1 + doc v1 ⇒ ok; **fail-open** on Firestore error (no version check path unchanged). |
| `tests/unit/lib/security/passwordPolicy.test.ts` (new) | strong ok; too-short/weak rejected; **`overridePolicy` bypasses**; empty still rejected even with override. |
| `tests/unit/lib/security/accountLockout.test.ts` (new) | lock after **N=5** failures; **60s cooldown** boundary (locked at 59s, unlocked at ≥60s); success **resets** counter; `clearLockout` clears immediately; **counts unknown usernames**; **fail-open** on Firestore error; returns uniform result (no account-existence signal). |
| `tests/unit/lib/security/schemas.test.ts` (new) | each schema: valid passes / malformed rejected; **progress envelope-only** accepts v1–v4 + rejects non-object/other version (preserves current 400 contract). |
| `tests/unit/app/api/authLogin.test.ts` (update) | **line-70 `toEqual` → includes `tokenVersion: 0`**; new: lock after N failures (429/uniform), cooldown, reset on success; **known-locked vs unknown-user responses are identical** (S2); create-time override N/A here. |
| `tests/unit/app/api/adminUsers.test.ts` (update) | PATCH reset **bumps `tokenVersion`** (transaction) → old token **rejected on next mutating call**; weak password → 400; **`overridePolicy` → 201/ok**; **unlock action clears lockout**; **password reset also clears lockout**; version-check rejects a revoked admin token on POST/PATCH/DELETE. |
| `tests/unit/app/api/userProgress.test.ts` (update) | revoked token → **401 on GET and POST**; valid token unchanged; envelope-only zod accepts v1–v4, rejects garbage (400); merge/clamp behavior unchanged. |
| `tests/unit/app/api/authSession.test.ts` (update) | `/me` **version-check**: revoked token → 401; **legacy no-version token → 200** (backward-compat). |
| `tests/unit/app/api/authLogoutAll.test.ts` (new) | bumps `tokenVersion` + clears session cookie + all Grade-B cookies; non-admin/anon still allowed to end own session. |
| `tests/unit/app/api/gradeBUnlock.test.ts` (update) | zod subject validation (invalid/missing → 400); **still succeeds unauthenticated** (anonymous flow preserved); legacy math shim unchanged. |

### Component (Vitest + Testing Library) — UI

| File | Cases |
|------|-------|
| `tests/unit/components/auth/LoginModal.test.tsx` (update) | **show-password toggle** flips input `type` password↔text; password field has `inputMode="numeric"`; **non-punitive lockout message** renders with countdown + `role="alert"`, not red-alert copy; **"one more try" warning** on the pre-lock attempt; **warm error copy** on wrong creds; TTS invoked for the lockout message (mock the TTS hook). |
| `tests/unit/components/auth/UserAvatar.test.tsx` (update) | **"log out everywhere" shows only for `role==="admin"`**, absent for `role==="user"`; clicking calls `apiLogoutAll`/handler; plain logout unchanged. |
| `tests/unit/components/screens/AdminUsersScreen.test.tsx` (update) | **unlock button** renders per row + calls unlock action; **"locked" badge** shows on a locked row; **"allow simple password" checkbox** present on create + change-password forms and passes `overridePolicy` through. |

### E2E (Playwright) — flows

| File | Scenario |
|------|----------|
| `tests/e2e/session-revocation.spec.ts` (new) | Two contexts logged in as same user → **admin password reset** (or **"log out everywhere"**) → the other session is **rejected on its next mutating call** (progress push 401) and `/me` reflects logout; a **legacy no-version session stays valid** (backward-compat). |
| `tests/e2e/account-lockout.spec.ts` (new) | **N+1** failed logins → **non-punitive locked message + countdown**; unknown-username attempts look identical (no enumeration); **admin unlock** clears immediately; after 60s, login succeeds. |
| `tests/e2e/auth-backward-compat.spec.ts` (anchor, must stay green) | unchanged anonymous flows. |
| `tests/e2e/multi-user-isolation.spec.ts` (anchor, must stay green) | unchanged isolation. |
| `tests/e2e/grade-b-gate.spec.ts` (regression) | **anonymous Grade-A→B unlock still works** after zod-hardening (S7 kept open). |
| `tests/e2e/visual-smoke.spec.ts` (extend) | LoginModal (show-password + lockout state) + AdminUsers (locked badge/unlock) visual snapshots. |

### Coverage gaps explicitly accepted
- Timing-based constant-time assertions are **not** unit-tested (flaky) — S2 is covered by asserting bcrypt runs + identical known-locked/unknown responses.
- Firestore-TTL cleanup of lockout/rate-limit docs is a **Phase 2.7** item — not tested here.
