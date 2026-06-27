# Regression Findings — Monkey / Fuzz & Live-Browser Testing

Companion to `docs/REGRESSION_TEST_PLAN.md`. Records defects and observations from
free-style monkey/fuzz testing and live-browser exploration of the app.

## How these were produced

- **Tool:** Chromium driven via the project's installed Playwright (`@playwright/test`).
  The Playwright **MCP server** has been added to `.mcp.json` (`playwright`) and will be
  available as `mcp__playwright__*` tools after it is approved in a new session; it was
  not injectable into the running session, so this round used the installed Playwright
  directly (equivalent browser automation).
- **Method:** seeded random walk (`mulberry32`, seeds **1337** and **4242**, ~80–90 steps each) over all
  key routes, plus a URL-fuzz phase (malformed/out-of-range params) and targeted flow checks
  (grade-B gate, admin wrong-PIN, corrupt-localStorage reload). Adversarial number inputs:
  `"" 0 -5 999999999999 3.5 1e9 abc "   " 00012 +- 🙂 -0` and a 21-digit string.
- **Invariants checked each step:** no `pageerror`, no uncaught console error, body not blank,
  `<html dir="rtl">` preserved, HTTP < 500, StorageErrorBoundary treated as an acceptable
  graceful state.
- **Server:** local `next dev` on `:3005` (dev mode).

## Status: all defects below are FIXED ✅ (see "Fixes applied")

## Defects

### F1 — Missing custom RTL 404 page (`notFound()` falls back to default Next.js 404) — MEDIUM — ✅ FIXED
- **Repro (deterministic):**
  - `GET /grade/z` → HTTP **404**
  - `GET /grade/a/day/not-a-day` → HTTP **404**
  - `GET /grade/a/day/-1` → HTTP **404**
  - `GET /grade/a/day/day-1/section/bogus-section` → HTTP **404**
  - `GET /english/z` → HTTP **404**
- **Expected:** a Hebrew, **RTL**, app-styled "not found" page (consistent with the rest of the app and with the graceful soft-404 in F2), with a link back to the workbook.
- **Actual:** the **default Next.js 404** is served — **no `dir="rtl"`**, English text ("This page could not be found"), no site header/footer. The route handlers correctly call `notFound()` (status code is right), but there is **no `app/not-found.tsx`**, so the unstyled LTR default renders.
- **Impact:** inconsistent, non-localized experience for a children's RTL app on any mistyped/invalid URL. Status code is correct, so this is UX/consistency, not a crash.
- **Suggested fix (separate task):** add `app/not-found.tsx` rendering the app shell in RTL Hebrew with a "back to workbook" CTA. Optionally route invalid grades/levels through the same friendly handling as F2.
- **Note on the monkey label:** the monkey flagged these as HIGH "blank page" because `document.body.innerText` was empty at `domcontentloaded`+250ms; the served HTML is ~13 KB (not truly empty). The **verified, reproducible** substance is the missing RTL/app-layout 404 (downgraded to MEDIUM after curl confirmation).

### F1b — `notFound()` under a grade route swallowed by `StorageErrorBoundary` — HIGH — ✅ FIXED
- **Discovered while fixing F1** (real-browser check, not just curl). For a valid grade but bad day/section
  (`/grade/a/day/not-a-day`, `.../section/bogus-section`), the page's `notFound()` was caught by the
  `StorageErrorBoundary` wrapping `GradePageShell`, so the user saw **"שגיאה בטעינת ההתקדמות"
  (error loading progress)** instead of a 404 — a misleading, scarier message.
- **Root cause:** `StorageErrorBoundary.getDerivedStateFromError` caught **all** errors, including Next's
  `notFound()`/`redirect()` control-flow signals (which throw with a special `digest`), so they never
  reached Next's not-found/redirect boundaries.
- **Impact:** HIGH — every malformed day/section URL under a valid grade showed an error screen, and any
  future `redirect()` rendered from inside a grade page would have been swallowed too.

### F2 — Inconsistency: valid-format-but-missing day soft-404s (200), invalid-format hard-404s — LOW — ✅ RESOLVED (UX)
- **Repro:** `GET /grade/a/day/day-999` → HTTP **200**, renders a graceful in-app Hebrew message
  **"🔍 הַיּוֹם לֹא נִמְצָא. חֲזָרָה לַחוֹבֶרֶת"** with full RTL layout and footer.
- **Observation:** This is *good* resilience on its own. The inconsistency is with F1: a non-existent
  day whose id is *well-formed* (`day-999`) gets a friendly in-layout page (200), while a *malformed*
  id (`not-a-day`, `-1`) gets the bare default 404. Unifying both onto the friendly handling (or both
  onto a styled `not-found.tsx`) would make behavior predictable.
- **Impact:** low; both paths are non-crashing. Tracked so the two 404 behaviors converge.

## Fixes applied

| Finding | Fix | Files |
|---|---|---|
| F1 | Added a custom RTL Hebrew 404 page (reuses `CenteredPanel` + `ButtonLink`, "🔍 הַדַּף לֹא נִמְצָא." + "back to home" CTA). Rendered inside the RTL root layout; `dir="rtl" lang="he"` also set on its own `<main>` as a belt-and-suspenders. Added `screen.notFound` test id. | `app/not-found.tsx` (new), `lib/testIds.ts` |
| F1b | `StorageErrorBoundary.getDerivedStateFromError` now re-throws Next control-flow errors (`digest === "NEXT_NOT_FOUND"` or `digest` starting with `"NEXT_REDIRECT"`) so `notFound()`/`redirect()` reach their proper boundaries; genuine storage errors still show the recovery UI. | `components/ui/StorageErrorBoundary.tsx` |
| F2 | Resolved at the UX level by F1+F1b: malformed grade/day/section/level URLs now show the same friendly RTL not-found experience as the in-app soft-404. (The remaining 200-vs-404 status nuance for well-formed-but-missing days is intentional graceful handling and left as-is.) | — |

**Post-fix verification (production build, real headless Chromium):**

| Route | HTTP | `dir` | Renders | 
|---|---|---|---|
| `/grade/z` | 404 | rtl | RTL not-found + back link |
| `/grade/a/day/not-a-day` | 404 | rtl | RTL not-found + back link |
| `/grade/a/day/day-1/section/bogus-section` | 404 | rtl | RTL not-found + back link |
| `/english/z` | 404 | rtl | RTL not-found + back link |
| `/grade/a/day/day-999` (valid format, missing) | 200 | rtl | graceful in-app "day not found" |
| `/grade/a` (control) | 200 | rtl | normal page |

Full suite after fixes: `lint` ✓, `check:testids` ✓, `tsc` ✓, unit **500/500** ✓, `build` ✓, e2e **116 passed / 2 skipped** ✓ (incl. existing `edge-and-a11y` 404 tests, which still pass).

## Robustness confirmed (no defects found)

- **No crashes / no `pageerror` / no HTTP 5xx** across both seeds and the URL-fuzz set.
- **Grade-B gate holds:** deep links to `/grade/b/...` without the unlock cookie redirect to
  `/grade/b/locked` (no bypass observed).
- **Admin wrong-PIN** shows the error state (no silent accept).
- **Corrupt `localStorage`** (invalid JSON written under `kids_math.*` keys, then reload) did **not**
  crash the app — it recovers/renders normally (and StorageErrorBoundary is available as a graceful
  fallback). No silent data-wipe crash observed.
- **Adversarial numeric input** (negatives, decimals, huge numbers, emoji, whitespace) into exercise
  fields did not throw or break the page.

## Known noise (NOT defects — ignore-list for future runs)

- `console.error: Failed to fetch RSC payload for <url> … TypeError: Failed to fetch` — Next.js
  **dev-mode** route prefetch failing under concurrent load (monkey + parallel E2E hammering the
  same dev server). Does not occur as a user-facing failure; the client falls back to browser
  navigation. Re-test against a **production build** (`npm run build && npm run start`) to eliminate.
- `Failed to load resource: 401 (Unauthorized)` on `/api/auth/me` — expected when no user is logged
  in (the auth probe returns 401 by design).

## Reproduction

The seeded monkey/fuzz pass was an ad-hoc exploratory session (not committed as a
spec — randomized fuzz is kept out of the blocking CI lane). The bugs it found are
now locked in by deterministic tests (`grade-b-gate.spec.ts`, `exercise-negative.spec.ts`,
`visual-smoke.spec.ts`) and the fixes in `app/not-found.tsx` / `StorageErrorBoundary.tsx`.
F1/F2 reproduce directly without any script:

```bash
# with a server on :3005 (npm run dev / npm run start)
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3005/grade/z              # 404, no dir=rtl
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3005/grade/a/day/day-999  # 200, friendly RTL
```

## Exploratory session 2 (post-fix, production build)

A second, interaction-driven pass over the **production** build (real headless Chromium): all 13 key
screens at desktop (1280px) **and** mobile (375px), plus the login modal, exercise input edge cases,
and final-exam entry — with console/page-error capture throughout.

**Clean — no new defects:**
- No console or page errors on any screen (prod; the dev-only RSC noise is gone).
- No horizontal overflow / layout breakage at desktop **or** mobile width.
- No a11y gaps flagged: every `<img>` has `alt`, every `<button>` has an accessible name, `dir="rtl"` everywhere.
- Login modal opens, validates, surfaces its error ("שגיאה בהתחברות, נסו שוב"), and closes on Escape.

**Observations (not code bugs):**
- **O1 — invalid login returns HTTP 500 *in this sandbox* (environment artifact).** `app/api/auth/login/route.ts`
  is correctly written to return **401** for bad credentials, but `getFirestore()` throws here because
  `FIRESTORE_CREDENTIALS_JSON` is unset in the container, hitting the generic 500 catch. With Firestore
  configured (production) invalid logins return 401. The user-facing error message displays either way.
- **O2 — number field accepts `-3`, `1.0`, `007`, very long digit strings on desktop (LOW / polish).** On
  mobile the numeric keypad limits entry to digits; on desktop the field doesn't block `-`/`.`/leading
  zeros. Grading normalizes these (`1.0`→1, `007`→7) so results stay correct. Left as-is (rejecting
  non-digits would be a behavior change); flagged for product decision against the "digits only" rule.

All other end-to-end flows (completion → unlock chain, GMAT, admin mark/reset, badges, streak, English)
are covered by the 116 passing E2E specs and were not re-tested by hand.
