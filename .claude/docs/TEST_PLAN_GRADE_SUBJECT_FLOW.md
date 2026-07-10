# Test Plan — Grade → Subject → Day + subject-based grade unlock

Scope: the navigation inversion (Grade → Subject → Day) and the per-subject cross-grade unlock
(finish a subject in Grade A → that subject unlocks in Grade B; Grade B is fully locked until **any**
subject is done in A). Covers the completion truth, cookies/API, middleware, screens, admin, parent
dashboard, analytics, and back-compat.

**Invariants under test**
- **I1** A subject is "done" in a grade **iff** all its regular days are complete **AND** its final exam passed (strict AND).
- **I2** In Grade B, a subject is open **iff** it was done in Grade A (per-subject, isolated).
- **I3** Grade B is enterable **iff** ≥1 subject was done in Grade A; if none → the whole grade is locked (card inert on `/` **and** `/subjects/b` middleware-redirects to locked).
- **I4** `previewAll` bypasses **client** gates everywhere; it bypasses **middleware** only in dev (not the prod E2E server).
- **I5** Unlock fires on final-exam pass; revoke fires on admin reset of a Grade-A day. Reconcile is unlock-only (never revokes).
- **I6** No `localStorage` key / day ID / content changed → legacy learner data + legacy math-B cookie keep working.

Legend: ✅ implemented · 🆕 added by this plan.

---

## A. Unit — pure logic

### A1. `lib/completion/subjectGrade.ts` — `tests/unit/lib/completion/subjectGrade.test.ts`
- ✅ math: days incomplete + exam passed → **not** complete (I1).
- ✅ math: all days complete + exam **not** passed → **not** complete (I1).
- ✅ math: all regular days complete + exam passed (exam day excluded) → complete.
- ✅ `isSubjectUnlockedInGrade`: grade A always true; grade B gated on A; `previewAll` bypass.
- ✅ `isGradeUnlocked`: A always true; B = OR across subjects.
- 🆕 **edge:** empty day list → not complete (guards `days.length > 0`).
- 🆕 **edge:** math grade B has no final exam → never "complete" (doesn't crash on null exam).
- 🆕 **negative:** `isGradeUnlocked("b")` false when **every** subject incomplete.
- 🆕 **positive:** each subject independently drives its own `isSubjectUnlockedInGrade` (english done ≠ science open).

### A2. `lib/completion/reconcile.ts` — `tests/unit/lib/completion/reconcile.test.ts`
- ✅ POSTs unlock only for completed subjects.
- ✅ fresh learner (none complete) → zero POSTs.
- ✅ session-guarded: one POST per subject per session.
- ✅ `previewAll` → no reconciliation.
- 🆕 **edge:** a failed unlock POST does **not** set the session guard (retries next mount).
- 🆕 **edge:** `sessionStorage` throwing (private mode) still POSTs (no crash).

### A3. `lib/gradeUnlock.ts` — `tests/unit/lib/gradeUnlock.test.ts`
- ✅ per-subject cookie names; legacy alias maps to math; value "1".

### A4. `lib/server/gradeUnlockCookies.ts` — covered via A5 (route tests exercise the helper).

### A5. API routes — `tests/unit/app/api/gradeBUnlock.test.ts` 🆕
- 🆕 `POST /api/grade-b-unlock {subject}` sets `kids_math.unlocked.b.<subject>=1` (1yr, httpOnly, lax).
- 🆕 subject=math also sets the legacy `kids_math.unlocked_grade_b` (lockstep).
- 🆕 `POST /api/grade-b-lock {subject}` clears the per-subject cookie (maxAge 0); math clears legacy too.
- 🆕 invalid/absent body → defaults to **math** (legacy no-body callers).
- 🆕 legacy shims `/api/unlock-grade-b` + `/api/lock-grade-b` set/clear the math cookies.
- 🆕 `secure` flag set on https / `x-forwarded-proto: https`, unset on http (CI).

### A6. `middleware.ts` — `tests/unit/middleware.test.ts`
- ✅ math: locked redirect + `next=`; opens with legacy **or** new math cookie; locked page never loops; grade A never gated.
- ✅ english/science: redirect without their cookie; per-subject isolation (english cookie ≠ science open); legacy math cookie ≠ english.
- ✅ `/subjects/b`: redirect when none unlocked; open when any; `/subjects/a` never gated (I3).

### A7. `lib/routes.ts` — `tests/unit/lib/routes.test.ts`
- ✅ `gradePicker()==="/"`, `subjectPicker` alias, `subjectsForGrade`, legacy builders unchanged, previewAll carried.

### A8. `lib/parent/metrics.ts` — `tests/unit/lib/parent/metrics.test.ts`
- ✅ per-grade rollup splits by grade + agrees with the global rollup; exam results ordered grade-first then subject.

### A9. `lib/admin/resetDayProgress.ts` — `tests/unit/lib/admin/resetDayProgress.test.ts`
- ✅ math revoke cascade (existing); english/science: level-A reset → revoke + clears that level's exam; level-B reset → no revoke; no math side effects.

### A10. `lib/analytics/events.ts` — `tests/unit/lib/analytics/events.test.ts` 🆕
- 🆕 `subject_selected` is an accepted event name; round-trips through storage.
- 🆕 `logEvent` persists `subject` + `gradeId` when provided.
- 🆕 **back-compat:** an old stored event with no `subject`/`gradeId` still parses/loads (I6).

---

## B. Component — React Testing Library

### B1. `GradePickerScreen` (`app/page.tsx`) — `tests/unit/components/screens/GradePickerScreen.test.tsx` 🆕
- 🆕 Grade A card always a link → `/subjects/a`; fires `grade_selected {grade:a}`.
- 🆕 **negative:** Grade B locked (no subject done) → inert `<div>` (no `href`), no `gradeCardCta("b")`, `gradeLockedHint("b")` visible (I3).
- 🆕 **positive:** Grade B unlocked (≥1 subject done) → link → `/subjects/b`, CTA visible, no hint.
- 🆕 reconcile awaited before CTA (loading → hydrated).

### B2. `SubjectPickerScreen` (`app/subjects/[grade]/page.tsx`) — `tests/unit/components/screens/SubjectPickerScreen.test.tsx` 🆕
- 🆕 grade A: all three cards are links to their homes; CTAs present; `subject_selected` fires.
- 🆕 **partial unlock:** grade B with only math done → math card link + CTA; english/science inert with `lockedHint` (I2).
- 🆕 **a11y:** locked cards are non-link `<div>` with `aria-label` conveying locked (not focus-trapped).
- 🆕 back link → `routes.gradePicker()` (`/`).
- 🆕 **edge:** invalid grade param → `notFound()` called.

### B3. `LockedGradeScreen` — `tests/unit/components/screens/LockedGradeScreen.test.tsx` 🆕
- 🆕 renders title + reason (why + how) + primary CTA; optional secondary CTA rendered when provided, absent otherwise; testids resolve.

---

## C. E2E — Playwright (prod server on CI)

### C1. `tests/e2e/grade-subject-flow.spec.ts`
- ✅ partial unlock (Math A done): `/` Grade B open → `/subjects/b` math open, english/science locked; math → `/grade/b`.
- ✅ server gate: `/english/b` → locked while math-only unlocked; `/grade/b` open.
- ✅ grade-level gate: `/subjects/b` → locked when none unlocked; reachable with any cookie (I3).
- 🆕 **full real-flow lifecycle:** complete all Math-A days + pass the final exam via the UI → return `/` → Grade B card active → enter Math B (no seeding of the cookie).
- 🆕 **reconcile self-heal (I5):** seed Math-A complete + cookie, clear the cookie, revisit `/` → reconcile re-POSTs unlock → `/grade/b` reachable again.
- 🆕 **negative direct-URL per subject:** `/science/b/day/...` → `/science/b/locked` with `next=` preserved.
- 🆕 **edge:** `/subjects/zzz` (invalid grade) → 404.

### C2. `tests/e2e/subject-picker.spec.ts`
- ✅ landing grade picker; Grade B inert+reason fresh; Grade A → subject picker (3 open); back to grade picker; Math → workbook; previewAll unlocks B card; legacy `/math`,`/english` redirect to `/`.

### C3. `tests/e2e/admin-progress.spec.ts`
- ✅ english/science complete+reset in isolated store, no math side effects.
- 🆕 **positive:** force-complete English A (final exam) → sets english cookie → `/english/b` reachable.
- 🆕 **negative→revoke:** reset an English level-A day → `/english/b` redirects to locked again.

### C4. `tests/e2e/grade-b*.spec.ts` (existing, I6) — legacy math cookie + `/api/unlock-grade-b` shim keep math-B working.

### C5. `tests/e2e/visual-smoke.spec.ts` — grade picker, subject picker, all 4 locked pages load clean (RTL, no console errors).

---

## D. Static gates
`tsc --noEmit` · `npm run lint` · `npm run check:testids` · `npm run check:cards` · `npm run build`.

## E. How to run
- Fast (local): `npm run test:unit` (unit + component) + the static gates above.
- Full: `npm run test:qa` (adds build + Playwright E2E) — runs on the PR CI.
