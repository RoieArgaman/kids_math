# Learning Log (kids_math)

Append-only record of what we learned while working on this repo.

## Unreleased

- (Add new entries here. Prefer short, concrete notes.)

### 2026-06-13 (AI migration: structured math render + TTS manifest + accuracy backstop)
- **Trigger:** Plan to "migrate AI" for better voice, more-accurate questions, and better question rendering (docs/AI_MIGRATION_PLAN.md, MAX, INV-FALLBACK = degrade to today's behavior on any issue).
- **What changed / where:**
  - Render: `mathExpression?` added to `BaseExercise` (`lib/types/curriculum.ts`); `resolvePromptParts` in `lib/utils/mathText.ts` prefers it over the regex `splitMathExpression`; one-line swap in `components/ExerciseBox.tsx`. Absent/malformed field → identical to today (proven by `it.each`).
  - Voice: `lib/tts/audioManifest.ts` (+ empty `audioManifest.data.json`); `lib/tts/engine.ts` `speakUtterance` now tries a pre-generated audio file first and falls back to `speechSynthesis` on any miss/error; `stopSpeech`/cancel also stop manifest audio. `scripts/generate-audio.mjs` is the human-run generator.
  - Accuracy: `validateExerciseArithmetic` in `lib/content/engine/validate.ts` (uses new `evaluateMathExpression` with × ÷ precedence), wired into `content-validity.test.ts` + seeded-bad-answer test. `scripts/audit-content-accuracy.mjs` (read-only, tmp/ only) + `scripts/author-content.mjs`.
- **What we learned:**
  - The arithmetic backstop must be **kind-aware and conservative**: `true_false` deliberately states wrong equations (answer encodes correctness), and `number_input` "fix the mistake" prompts embed wrong equations on purpose — so only flag (a) `= ?` where the numeric answer ≠ computed, and (b) `true_false` where the boolean disagrees with the equation. It immediately caught a real bug: day-14 `true_false` "45 + 10 - 5 = 55" answer `true` (correct is 50).
  - `edge-and-a11y.spec.ts` `math-token-row.png` remains env-flaky on this machine — verified it fails identically on clean `origin/main` (stash + rerun), so a diff there is not a regression. Render path is provably unchanged until content backfills `mathExpression`.
- **How to reuse next time:** runtime AI stays build/authoring-time; new paths must fall back to the legacy path and prove it with a fault-injection/`it.each` test. Confirm Claude model/pricing via the `claude-api` skill before wiring the authoring scripts.

### 2026-06-13 (Admin: English track in progress manager)

- **Trigger:** Admin progress screen managed Math only (grades א׳/ב׳); needed to also view/complete/reset the English (Pre-A1) learner track.
- **What changed / where:** `components/screens/AdminProgressScreen.tsx` — grade `<select>` became a 3-option **track** selector (א׳ / ב׳ / אנגלית) backed by `selectedSubject` + a derived `LearningTrack`; data/load/save now route through `lib/track.ts` (`getTrackDays`/`loadTrackProgress`/`saveTrackProgress`). `lib/admin/resetDayProgress.ts` — new `resetAdminEnglishDayProgress` (cascade over `getEnglishDays()`, **zero** final-exam/GMAT/grade-B side effects). `app/admin/progress/page.tsx` — parses optional `?subject=english`. Tests: `tests/unit/lib/admin/resetDayProgress.test.ts`, `tests/e2e/admin-progress.spec.ts`.
- **What we learned:**
  - The `adminProgress.*` testid helpers type their first arg as `grade: string`, so passing a **`trackKey`** (`"a"|"b"|"english"`) needs **no testid signature change** and keeps all existing Math tests valid. This is the cheapest way to add a track dimension to an existing grade-keyed screen.
  - English reuses `WorkbookProgressState` and shares the day id `"day-1"` with Math — safe **only** because the UI keys rows by `trackKey` and saves go through `saveTrackProgress` (isolated store `kids_math.english.workbook_progress.v1`). Never call `saveProgressState`/`resetAdminDayProgress` on the English path.
  - English has no final exam → hide (don't stub) the force-final-exam control via `!isEnglish`.
- **How to reuse next time — add a new subject/track to the admin screen:**
  1. Extend `Subject`/`LearningTrack` in `lib/subjects.ts` and the resolver in `lib/track.ts`.
  2. Add a `<select>` option + derive `trackKey` (subject token when no grade axis); pass `trackKey` into every `adminProgress.*` testid.
  3. If the track has no unlock/exam chain, add a side-effect-free `resetAdmin<Subject>DayProgress` helper and branch `handleReset` on it — keep the Math path byte-for-byte unchanged.
- **How to reuse next time — storage-isolation E2E guard (reusable recipe):** after a multi-store admin action, assert the **target** key changed AND the **sibling** keys are still `null`/untouched, and `page.route("**/api/lock-grade-b", …)` with a boolean flag to prove no cross-store side effect fired.
- **Backlog idea (deferred):** a `lib/track.ts` `ALL_TRACKS` registry so the admin selector (and future screens) iterate tracks instead of hardcoding `<option>`s.

### 2026-04-03 (Admin: per-section mark complete + reset)

- **Trigger:** Admin needed to force-complete or reset one workbook section at a time; full day completes when all exercises reach the completion gate (100% in engine).
- **What changed / where:** `lib/progress/engine.ts` — `forceMarkSectionComplete` merges correct answers/attempts for one section, mirrors `setAnswerForDay` completion semantics; `components/screens/AdminProgressScreen.tsx` — section rows with סמן מקטע / אפס מקטע (two-step confirm); `lib/testIds.ts` — `sectionRow`, `markSectionComplete`, `resetSection*` per section; `tests/unit/lib/progress/engine.test.ts`, `tests/e2e/admin-progress.spec.ts`.
- **What we learned:** Reuse existing `resetSectionProgress` for admin section reset (no cascade, unlike `resetAdminDayProgress`). Keep day-level vs section-level “armed reset” mutually exclusive to avoid ambiguous confirms. `check:testids` requires `data-testid` on nested `div`/`span` in new section cards (use `childTid` for header/title).
- **How to reuse next time:** For partial-day admin fills, always pass full-day `totalExercises` when calling `resetSectionProgress` / percent math, same as `SectionScreen`.

### 2026-04-01 (Day Hub: section-card navigation layer)

- **Trigger:** Add section-card hub between day list and exercises so users navigate section → exercise instead of directly to exercises.
- **What changed / where:**
  - `components/screens/DayScreen.tsx` — reduced to a thin router (~15 lines): routes to `FinalExamScreen` or `DayOverviewScreen`
  - `components/screens/DayOverviewScreen.tsx` (NEW) — section-card hub; derives section states from `correctAnswers`
  - `components/screens/SectionScreen.tsx` (NEW) — per-section exercises screen; `allExercisesCount` = full-day total (not section count) so `percentDone` is accurate
  - `app/grade/[grade]/day/[id]/section/[sectionId]/page.tsx` (NEW) — route page
  - `lib/utils/parseSectionId.ts` (NEW) — URL param validator for section IDs
  - `lib/routes.ts` — added `gradeSection` route builder
  - `lib/testIds.ts` — added `dayOverview` and `section` testId namespaces
  - `lib/hooks/useProgress.ts` — exposed `correctAnswers` in the hook return value
  - `lib/content/engine/day-builder.ts` — expanded `defaultSections` exercise counts + post-processing cap
- **Section unlock rules (critical):**
  - Section 0 (warmup): always open
  - Middle sections (1 to N-2): open once warmup is complete
  - Last section (N-1): open **only when ALL other sections are complete**
  - This logic lives in `getSectionCardState()` in `DayOverviewScreen` AND in the gate at the top of `SectionScreen`
- **Exercise count constraints:**
  - Non-last sections: 4–8 exercises (min 4, max 8)
  - Last section: 6–10 exercises (min 6, max 10)
  - Enforced two ways: (1) `defaultSections` definition now meets minimums; (2) post-processing cap in `buildDayFromConcepts` trims any section exceeding the max (fixes days 8-14 expanded sections)
- **`allExercisesCount` is sacred:** In `SectionScreen`, always pass the full day's exercise count to `useProgress`, not the current section's count. Otherwise `percentDone` only reflects the section rather than the whole day.
- **`check:testids` strictness:** Every intrinsic HTML element (div, span, p, main, header, button) needs `data-testid`. Use `childTid(parentTestId, "subkey")` for nested elements.
- **How to reuse next time:** When adding a new navigation layer (hub → sub-screen), always: (a) keep `allExercisesCount` = full day total in the sub-screen; (b) put gate logic in BOTH the hub (for card state) and the sub-screen (for direct URL access); (c) use `parseSectionId` for URL param validation.

### 2026-03-29 (Faster deployment: CI caches + deploy policy)
- **Trigger:** Plan to speed CI/deploy without duplicating quality gates (Playwright + Next cache, concurrency, quick vs upload-only policy).
- **What changed / where:** `.github/workflows/ci.yml` (`.next/cache`, `.playwright-browsers` caches, `PLAYWRIGHT_BROWSERS_PATH`, concurrency), `deploy.sh` (`--skip-build` with `--skip-tests`), `package.json` (`deploy:firebase:upload-only`), `firebase.json` (ignore `.next`, `.playwright-browsers`, `coverage`), `docs/DEPLOYMENT.md`.
- **What we learned:** Lockfile-keyed Playwright cache avoids stale cross-major reuse; Next cache keys include `next.config.mjs`. **`--skip-build`** is gated to `--skip-tests` and documented as same-SHA-green + Node parity with App Hosting.
- **How to reuse next time:** Keep one deploy “authority” (GitHub vs CLI); measure E2E duration before adding Playwright sharding + blob merge.

### 2026-03-29 (Grade home / plan: reload progress on resume)
- **Trigger:** Day completed (100%, הושלם) but grade home day cards did not show completion until hard refresh.
- **What changed / where:** `lib/progress/storage.ts` (`workbookProgressStorageKey`), `lib/client/loadGradeScreenState.ts`, `lib/hooks/useReloadOnStorageResume.ts`, `components/screens/HomeScreen.tsx`, `components/screens/PlanScreen.tsx`, `tests/e2e/grade-a-lifecycle.spec.ts`.
- **What we learned:** `loadProgressState` ran only on mount / grade change. BFCache, browser back, and cross-tab writes can show **stale React state** while `localStorage` is already updated. Re-read workbook progress (and the same bundle as home: final exam, events, `previewAll`) on `pageshow` when `persisted`, on `storage` for the grade key, and debounced `visibilitychange`.
- **How to reuse next time:** Any screen that mirrors `localStorage` in React state and must stay in sync after navigation or tab switches should subscribe to the same resume pattern, not only `useEffect([deps])` on first paint.

### 2026-03-29 (Per-day record time + `bestTimeMs`)
- **Trigger:** Plan to measure session length from first answer to first 100% gate, show PB on home, live timer in day header; unify speed-run writes with `useProgress`.
- **What changed / where:** `lib/progress/engine.ts` (`computeElapsedMsForCompletedDay`, `applyBestTimeMsIfImproved`; `markDayComplete` uses `completedAt` − `attempts[0]`; no `wrongCount` after sticky `isComplete`), `lib/hooks/useProgress.ts` (`improveBestTime`, `completedAt`/`firstAttemptedAt`/`bestTimeMs`), `components/DayHeader.tsx`, `components/screens/DayScreen.tsx`, `components/screens/HomeScreen.tsx`, `lib/utils/formatMs.ts`, `lib/testIds.ts`.
- **What we learned:**
  - Persisted PB updates for speed-run should go through **`applyBestTimeMsIfImproved` + `useProgress`** so a single `saveProgressState` path avoids races with direct storage writes.
  - Post-complete practice should not increment **`wrongCount`** or the 10-wrong auto-reset can wipe sticky completion.
- **How to reuse next time:** Elapsed display = `computeElapsedMsForCompletedDay` or live `Date.now() − firstAttempt` until `percentDone === 100`, then freeze using `completedAt`.
- **Follow-up:** `mergeBestTimeMs` in `lib/progress/engine.ts` centralizes PB min logic for `markDayComplete` + `applyBestTimeMsIfImproved`. E2E `edge-and-a11y.spec.ts` covers “sticky completion + 10 wrongs” does not show reset notice.


### 2026-03-27 (Firebase App Hosting + `NODE_ENV=production` installs)
- **Trigger:** Cloud Build for App Hosting failed: missing `tailwindcss`, bogus `@/` resolutions, then local prod simulation failed on ESLint + `vitest.config.ts` typecheck.
- **What changed / where:** `package.json` (move `tailwindcss`, `postcss`, `typescript`, `@types/*` to `dependencies`), `next.config.mjs` (`eslint.ignoreDuringBuilds`), `tsconfig.json` exclude `tests`/Vitest/Playwright configs from app typecheck.
- **What we learned:**
  - App Hosting runs `npm ci` with **`NODE_ENV=production`**, so **`devDependencies` are not installed**; anything `next build` needs (Tailwind, PostCSS, TS) must live in **`dependencies`** (or the build must install devDeps—nonstandard).
  - Next’s build-time ESLint expects `eslint` installed unless **`eslint.ignoreDuringBuilds`**; keep `npm run lint` in CI/deploy scripts.
  - Root **`vitest.config.ts`** was inside `include`; excluding test-only configs avoids production typecheck needing Vitest.
- **How to reuse next time:** After dependency moves, verify with `rm -rf node_modules .next && NODE_ENV=production npm ci && npm run build`.

### 2026-03-27 (Firebase App Hosting requires Blaze)
- **Trigger:** Deploy `kids_math` to Firebase project `kids-learing-hub` via existing `deploy.sh` / `apphosting:kids-math`.
- **What changed / where:** `.firebaserc` (default project), `package.json` scripts `deploy:firebase` / `deploy:firebase:quick`.
- **What we learned:**
  - `firebase deploy --only apphosting:<backendId>` fails on Spark: project must upgrade to **Blaze** before API `firebaseapphosting.googleapis.com` can be enabled. Console link is printed in the CLI error (Usage & billing for the project).
  - Repo was already configured (`firebase.json` apphosting + `apphosting.yaml`); **ymt**-style classic Hosting (`public` + static `dist`) is the wrong model for this Next.js app (middleware + `/api/*` route handlers).
- **Why it matters:** Avoids assuming App Hosting works on the free tier; sets correct expectations for deploy troubleshooting.
- **How to reuse next time:** After Blaze upgrade, run `npm run deploy:firebase` (full QA) or `npm run deploy:firebase:quick` (build + deploy only), then smoke the live App Hosting URL from the deploy output.

### 2026-03-27 (Timed exam-session + optional GMAT-style challenge)
- **Trigger:** Optional post-final-exam challenge with GMAT Focus–inspired rules and reusable architecture.
- **What changed / where:** `lib/exam-session/*`, `lib/gmat-challenge/*`, `components/timed-exam/*`, `components/screens/GmatChallengeScreen.tsx`, `app/grade/[grade]/gmat-challenge/page.tsx`, entry CTAs on `FinalExamScreen` / `HomeScreen`, `global-e2e.d.ts`, analytics events, `tests/unit/**`, `tests/e2e/gmat-challenge.spec.ts`, `.cursor/rules/timed-exam-session.mdc`.
- **What we learned:**
  - Separate generic session policy (`exam-session`) from product pickers/storage (`gmat-challenge`) so future timed exams do not duplicate timer/review math.
  - GMAT-like “up to three answer changes per section” maps cleanly to “max divergent exercises vs end-of-section snapshot” using `normalizeAnswerValue`.
  - Playwright E2E for timed flows: set `window.__KIDS_MATH_E2E_SHORT_GMAT__` in `addInitScript` to cap section/break durations without shipping test hooks in production UI beyond a harmless global flag.
- **Why it matters:** Keeps optional assessments maintainable, testable, and obviously non-gating for unlock logic.
- **How to reuse next time:** Follow `timed-exam-session.mdc`; add a new `lib/<exam>/` adapter + compose existing timed-exam components.


### 2026-03-27 (Cursor rules: speed + accuracy scaling)
- **Trigger:** בקשה לבצע מחקר עומק ולהאיץ את תהליך הפיתוח דרך עדכוני `.cursor`.
- **What changed / where:** `.cursor/rules/multi-agent-playbook.mdc`, `.cursor/rules/agent-definer.mdc`, `.cursor/rules/quality-gates.mdc`, `.cursor/rules/testids.mdc`, `.cursor/rules/agent-guidelines.mdc`, `.cursor/rules/add-grade.mdc`, `.cursor/rules/build-school-year.mdc`.
- **What we learned:**
  - חובה להימנע משכפול חוזים בין כללים; עדיף מקור קנוני אחד ל־handoff ול־quality gates והפניות מכל כלל אחר.
  - workflow קבוע "תמיד full multi-role" מאט משימות פשוטות; מודל scaled לפי סיכון (small/medium/high-risk) שומר על דיוק ומקצר זמן ריצה.
  - יישור gates מקומיים ל־CI (`check:testids`) מפחית הפתעות ב־PR ומקטין סבבי תיקון.
  - מדיניות `data-testid` אפקטיבית יותר כשאוכפים קשיחות על אלמנטים אינטראקטיביים/עוגני בדיקה ולא על כל `div/span` מצגתי.
- **Why it matters:** משפר יחס signal/noise לכללים, מצמצם overhead של הסוכן, ושומר על כיסוי חכם באזורים מסוכנים (gates/storage/routing).
- **How to reuse next time:** בכל שינוי כללים רחב, להתחיל במקור קנוני אחד, להוסיף מטריצת בדיקות מבוססת סיכון, ולהגדיר precedence ברור כשכללים מתנגשים.

### 2026-03-27 (Admin route + search params in App Router)
- **Trigger:** הוספת מסך אדמין לעריכת התקדמות ימים (complete/reset) עם PIN.
- **What changed / where:** `app/admin/progress/page.tsx`, `components/screens/AdminProgressScreen.tsx`, `lib/admin/session.ts`, `lib/routes.ts`, `lib/progress/engine.ts`, בדיקות unit/e2e.
- **What we learned:**
  - שימוש ב־`useSearchParams` בתוך עמוד שמרונדר סטטית יכול להפיל build אם לא עוטפים ב־`Suspense`; עדיף לפרסר `searchParams` ב־`page.tsx` (server) ולהעביר `initialGrade` לקומפוננטת client.
  - למסכי כלי/אדמין שמבוססים על localStorage, עדיף גבול נקי: route server פשוט + מסך client-only + מודול session נפרד (`lib/admin/session.ts`).
  - לשינויי unlock/gating, בדיקת e2e חייבת לכלול גם relock (reset) ולא רק unlock.
- **Why it matters:** מונע כשלי build ב־Next.js ושומר על ארכיטקטורה יציבה למסכים client-heavy.
- **How to reuse next time:** בכל route חדש שצריך query params + localStorage — פרסו query בשרת, העבירו props לקליינט, והוסיפו e2e דו-כיווני (enable + disable behavior).

### 2026-03-27 (Admin bulk completion flows)
- **Trigger:** בקשה להוסיף לאדמין גם סימון גורף לכל הימים וגם סימון מבחן מסכם כהושלם.
- **What changed / where:** `components/screens/AdminProgressScreen.tsx`, `lib/testIds.ts`, `tests/e2e/admin-progress.spec.ts`.
- **What we learned:**
  - בסימון מבחן מסכם אדמיני, עדיף לייצר state תקין דרך `createInitialFinalExamState` ואז להוסיף `submittedAt/scorePercent/passed`, במקום לכתוב shape ידנית.
  - כדי למנוע עקיפה לא רצויה של gate, כפתור “סמן מבחן מסכם כהושלם” צריך להיות מושבת עד שכל ימי הלימוד הרגילים (ללא `day-29`) מסומנים כהושלמו.
  - כיתה א׳ דורשת side-effect נוסף (קריאה ל־`/api/unlock-grade-b`) כשמסמנים מבחן מסכם כעובר.
- **Why it matters:** שומר על חוזי unlock עקביים בין זרימה רגילה לאדמין, ומונע state חלקי/לא תקין.
- **How to reuse next time:** לכל action אדמיני שמשפיע על gating, לאכוף תנאי-קדם ב־UI ולהוסיף e2e שמכסה גם disabled->enabled->effect.

### 2026-03-27 (All-days QA: unlock race + verbal numeric answers)
- **Trigger:** בקשת QA מלאה לסיים את כל הימים בכיתה א׳ וב׳, למצוא תקלות, לתקן ולהריץ שוב.
- **What changed / where:** `tests/e2e/day-smoke.spec.ts`, `tests/e2e/all-days-completion.spec.ts`, `tests/e2e/answering.ts`, `lib/utils/exercise.ts`, `components/screens/FinalExamScreen.tsx`, `lib/testIds.ts`, `tests/unit/lib/utils/exercise.test.ts`.
- **What we learned:**
  - ב־`verbal_input` תשובה מספרית כמו `"2"` נורמלת לערך מספרי ועלולה להיפסל למרות שהתשובה הנכונה היא מחרוזת `"2"`; צריך להשוות טקסט מנורמל על בסיס `String(normalized)`.
  - בזרימת מבחן מסכם כיתה א׳, כפתור ״להתחיל כיתה ב׳״ יכול להילחץ לפני שסיום `POST /api/unlock-grade-b` הושלם; צריך לנעול את ה־CTA בזמן פתיחת הכיתה.
  - `data-testid` לבחירות עם טקסט עברי חייב fallback דטרמיניסטי ייחודי (ולא `"x"` אחיד) כדי להימנע מהתנגשויות selector.
- **Why it matters:** מונע חסימות מעבר לא מוצדקות, מפחית flaky ב־E2E, ומאפשר כיסוי אמין של כל ימי הלימוד.
- **How to reuse next time:** בכל שינוי לוגיקת תשובות/מבחן — להריץ `day-smoke` + `all-days-completion` + lifecycle, ולוודא ש־CTA תלויי-API לא ניתנים ללחיצה לפני שהפעולה הסתיימה.

### 2026-03-27 (Randomized choice order with stable selectors)
- **Trigger:** בקשה שהמיקום של תשובה נכונה בתרגילי בחירה לא יהיה קבוע, ושיהיה רנדומלי בכל כניסה למסך.
- **What changed / where:** `components/exercises/RandomizedChoiceButtons.tsx`, `components/exercises/ExerciseRenderer.tsx`, `lib/utils/choiceOptions.ts`, בדיקות e2e/unit קשורות.
- **What we learned:**
  - רנדומיזציה צריכה להיות ברמת קומפוננטת תצוגה, לא ברמת תוכן/בדיקת נכונות, כדי לשמור על חוזה בדיקה ו־grading יציבים.
  - שימוש ב־`data-testid` מבוסס ערך (`choice(exerciseId, optionKey)`) שומר על עמידות בדיקות גם כשהסדר אקראי.
  - כדי למנוע קפיצות UI בזמן אינטראקציה, חשוב לייצב את סדר האפשרויות פעם אחת ב־mount של הקומפוננטה.
- **Why it matters:** משפר חוויית למידה (פחות pattern memorization) בלי לשבור התמדה/בדיקות/אימות תשובות.
- **How to reuse next time:** לכל exercise בחירה חדש, לבנות אפשרויות דרך `getChoiceOptionsForExercise` ולהציג דרך `RandomizedChoiceButtons`.

### 2026-03-27 (Render performance via shared exercise wrapper)
- **Trigger:** דיווח על האטה כללית וקפיצות בזמן עבודה במסכי תרגול.
- **What changed / where:** נוספה קומפוננטה משותפת `components/exercises/ExerciseItem.tsx`; מסכי `DayScreen` ו־`FinalExamScreen` עברו להשתמש בה עם callbacks מיוצבים (`useCallback`) ו־state refs.
- **What we learned:**
  - כשהורה מרנדר רשימת תרגילים עם closures inline לכל פריט, שינוי בתרגיל אחד גורר עבודה מיותרת על כל העץ.
  - מעטפת תרגיל ממואמת עם חוזה callbacks משותף מאפשרת לשמור גישת template-first וגם להפחית churn ברינדור.
  - ייצוב סביבה (שרת dev יחיד + `dev:clean`) חייב לבוא לפני אופטימיזציה בקוד, אחרת מתקבלות תוצאות מטעות.
- **Why it matters:** מפחית תחושת jank במסכי יום/מבחן בלי לפצל לוגיקה ל-one-off fixes.
- **How to reuse next time:** בכל רשימת exercises חדשה, לרנדר דרך `ExerciseItem` (או מעטפת דומה), ולהימנע מהעברת handlers inline לכל פריט.

### 2026-03-27 (Next dev missing chunk recovery)
- **Trigger:** Incognito first-load crashed with `Cannot find module './682.js'` from `.next/server/webpack-runtime.js`.
- **What changed / where:** stabilized dev runtime (single `next dev` process + `.next` cleanup), added `dev:clean` in `package.json`.
- **What we learned:**
  - Running multiple `next dev` processes on the same repo can corrupt/desync hot-update chunks and cause missing module errors.
  - The fastest deterministic recovery is: keep one dev server, clear `.next`, restart once, then retest route.
  - Only debug app runtime errors (hooks/client-server boundaries) after build-state corruption is eliminated.
- **Why it matters:** prevents chasing false code-level bugs caused by stale bundler artifacts.
- **How to reuse next time:** if chunk/module errors appear in dev, run `npm run dev:clean` and ensure only one local dev server is active.

### 2026-03-26 (ExerciseRenderer + focus contract)
- **Trigger:** בקשה לאחד את קומפוננטת התרגילים כדי להימנע משכפול וטעויות בהטמעה רוחבית.
- **What changed / where:** `components/exercises/ExerciseRenderer.tsx` (חדש), `components/ExerciseBox.tsx`, `components/VerbalQuestion.tsx`, `components/screens/DayScreen.tsx`, `components/screens/FinalExamScreen.tsx`.
- **What we learned:**
  - פיצול נכון הוא `ExerciseBox` ככרטיס (prompt/feedback/actions) ו־`ExerciseRenderer` כלוגיקת UI לפי `exercise.kind`.
  - כדי ש־`focusNextInput` יעבוד גם לתרגילי בחירה, צריך חוזה אחיד של `data-exercise-focus="true"` במקום `querySelector("input")`.
  - שמירה על `testIds.component.exerciseBox.*` ללא שינוי מאפשרת רפקטור פנימי בלי לשבור E2E.
- **Why it matters:** מצמצם drift בין מסכי יום/מבחן מסכם ומקטין רגרסיות בניווט מקלדת ובבדיקות אוטומטיות.
- **How to reuse next time:** בכל הוספת `Exercise.kind` חדש, להוסיף branch אחד ב־`ExerciseRenderer` עם focus target יחיד ו־test ids יציבים.

### 2026-03-26 (תיקוף תרגילים רוחבי + number_line_jump)
- **Trigger:** בקשה לעבור על כל הימים/כיתות ולוודא תקינות מתמטית ותצוגת תרגילים.
- **What changed / where:** `lib/content/days.ts`, `lib/content/days-grade-b.ts`, `lib/utils/mathText.ts`, `tests/unit/lib/content/content-validity.test.ts`, `tests/unit/lib/utils/mathText.test.ts`, `tests/e2e/day-smoke.spec.ts`.
- **What we learned:**
  - באגים ב־`number_line_jump` יכולים להיווצר בקלות כש־`prompt`/`step`/`answer` מתעדכנים בנפרד בתנאים טרנריים.
  - בדיקת יחידה רוחבית על כל התוכן (`getWorkbookDays`) תופסת מהר חוסר עקביות מתמטי שהיה חומק בבדיקות נקודתיות.
  - פיצול מתמטיקה מטקסט (`splitMathExpression`) צריך להימנע מ־`replace` לא־אינדקסי כדי לא להסיר מופע שגוי.
- **Why it matters:** מונע תרגילים לא תקינים במסך (גם אם הבדיקה הידנית לא מגיעה בדיוק ליום/תרגיל הבעייתי).
- **How to reuse next time:** בכל שינוי תוכן/גנרטור להריץ קודם `test:unit` עם `content-validity` לפני E2E מלא.

### 2026-03-26 (Cursor rule — בניית שנת חינוך)
- **Trigger:** בקשה להשוות שיטות הוראה בין מדינות ולהטמיע תהליך קבוע ל״בניית שנת לימוד״ במוצר.
- **What changed / where:** כלל חדש `.cursor/rules/build-school-year.mdc`.
- **What we learned:**
  - כדאי לקבע workflow קבוע: Plan → Benchmark → Map → Implement → Measure → Iterate.
  - במוצר הזה נקודות ההטמעה המרכזיות הן: `lib/content/days.ts` (sequencing/variation), `lib/utils/exercise.ts` (hints/feedback), `lib/progress/engine.ts` (gates), ו־UI במסכי היום.
- **Why it matters:** מונע “המלצות כלליות” בלי תרגום למוצר, ושומר על עקביות בין ריצות/שנים/כיתות.
- **How to reuse next time:** כשמוסיפים כיתה/שנת לימוד — להתחיל מהכלל `build-school-year.mdc` ולצאת ממנו לתכנון, הטמעה ובדיקות.

### 2026-03-26 (Playwright — localStorage clearing pitfall)
- **Trigger:** הוספת בדיקות E2E לזרימות התקדמות/רענון (persist אחרי reload).
- **What changed / where:** בדיקות Playwright חדשות תחת `tests/e2e/**`.
- **What we learned:**
  - `page.addInitScript(() => localStorage.clear())` רץ בכל ניווט מחדש, כולל `page.reload()`, ולכן “שובר” בדיקות התמדה (הוא מוחק את ה־localStorage לפני שהאפליקציה נטענת מחדש).
  - עדיף לנקות אחסון חד־פעמית בתחילת טסט ע״י `page.goto("/")` ואז `page.evaluate(() => localStorage.clear())`.
- **Why it matters:** מאפשר לבדוק התמדה אמיתית (mid-progress / after-completion) בלי flaky failures.
- **How to reuse next time:** בבדיקות שכוללות reload — לא להשתמש ב־`addInitScript` לניקוי localStorage.

### 2026-03-25 (multi-agent playbook — שמירת דפוסים)
- **Trigger:** הרחבת ההנחיה גם ל־`multi-agent-playbook.mdc`.
- **What changed / where:** תוספת ל־Implementer, לרשימת ביקורת סקירה, ול־Handoff `Learning update` — קישור ל־`learning-loop.mdc` ולעדכון `.cursor/rules` לדפוסים יציבים.

### 2026-03-25 (כלל — תיעוד דפוסים בזמן פיתוח)
- **Trigger:** בקשה שסוכנים יעדכנו `.cursor` כשהם מזהים דפוסים חוזרים בפרויקט.
- **What changed / where:** סעיף "While developing: capture patterns" ב־`.cursor/rules/learning-loop.mdc`; סעיף "Evolving Cursor rules" ב־`agent-guidelines.mdc`.
- **What we learned:** לוג קצר ב־`LEARNING_LOG.md` לגילויים חד־פעמיים; עדכון או קובץ `.mdc` כשהדפוס יציב וצריך לאגד כל סוכן.
- **How to reuse next time:** אחרי רפקטור/פיצ׳ר — לשאול אם יש כאן convention שכדאי לקבע בכללים.


### 2026-03-25 (Cursor rule — הוספת כיתה)
- **Trigger:** בקשה לאפיין זרימה ורשימת ביקורת להוספת כיתה חדשה בעתיד.
- **What changed / where:** `.cursor/rules/add-grade.mdc` (ארכיטקטורה A מול B, mermaid, רשימת משימות, סיכונים); ציטוט קצר ב־`agent-definer.mdc` / `agent-guidelines.mdc`.
- **What we learned:** נקודת הכניסה לסוכן היא איחוד `GradeId` + `workbook.ts` + `curriculum-plan` + אחסון v2 לפי כיתה + מבחן `day-29` + שער כיתה ב׳ דרך עוגייה אחרי עוברים מבחן בא׳.
- **How to reuse next time:** לפני PR להוספת כיתה — לעבור על `add-grade.mdc` ולהרחיב בדיקות e2e אם יש שער נתיבים חדש.

### 2026-03-25 (כיתה ב׳ — חוברת נפרדת + מבחן מסכם)
- **Trigger:** מימוש כיתה ב׳ עם אותו מודל ימים/יום 29 כמו א׳.
- **What changed / where:** `lib/content/days-grade-b.ts` + `buildDayFromConcepts(..., simpleSections)` ב־`lib/content/days.ts`; `lib/content/workbook.ts` בוחר חוברה לפי `grade`; `getMinistryStrandsForGrade` / `getTotalCurriculumDaysForGrade` ב־`curriculum-plan.ts`; `DayScreen` / `HomeScreen` / `FinalExamScreen` תומכים במבחן לכיתה ב׳; נעילת `unlock-grade-b` רק אחרי מבחן עובר **בכיתה א׳**.
- **What we learned:** אפשר לשתף את בנאי הימים עם `simpleSections: true` לכיתה ב׳ (בלי בלוקי התרחבות ימים 1–14 של א׳) ולהשאיר `day-29` כמזהה מבחן משותף.
- **How to reuse next time:** תגיות `SkillTag` חדשות לכיתה ב׳ — להרחיב גם את `warmupExerciseForTag` ב־`days.ts`.

### 2026-03-25 (כיתה ב׳ — זרימת יום כמו א׳ אחרי חימום)
- **Trigger:** לבנות יום שמתחיל בחימום ספירלה ואז מקטע «מושג היום» מדורג לחומר אותו יום (בלי תרגילי כיתה א׳ לפי `dayNumber`).
- **What changed / where:** `buildProgressiveConceptFocusSection` + `BuildDaySectionOptions.progressiveConceptFocus` ב־`lib/content/days.ts`; `days-grade-b.ts` מפעיל לימים 1–28.
- **What we learned:** אפשר לשכפל את רצף המקטעים (חימום → מושג מורחב → שפה → בדיקה → אתגר) עם תוכן שנגזר רק מ־`DayConcept`, בלי להפעיל `buildExpandedExercisesForEarlyDays` שמקושר לימי א׳.

### 2026-03-25 (אחסון התקדמות כיתה ב׳ — v2 כמו א׳)
- **Trigger:** ליישר פונקציונליות/לוגיקת שמירה עם כיתה א׳; חומר הלימוד נשאר נפרד (`days-grade-b`).
- **What changed / where:** `kids_math.workbook_progress.v2.grade.b` (במקום `v1.grade.b`); מיגרציה חד־פעמית מ־`v1.grade.b` ב־`lib/progress/storage.ts`; `clearProgressState` מוחק גם את מפתח ה־v1 הישן.
- **What we learned:** מקטעי «expanded» לימים 1–14 ב־`days.ts` קשורים לנרטיב כיתה א׳ לפי `dayNumber` — לא ניתן להפעיל אותם על חוברת ב׳ בלי לשבור את הפרדת החומר.

### 2026-03-25 (כיתה א' — 29 ימים, מיגרציה)
- **Trigger:** סיום רפקטור ימי תוכן + מבחן סיום; תיקון שבירת תחביר ושערי איכות.
- **What changed / where:** `lib/content/days.ts` (סגירת אובייקט יום 29); אימות `npm run lint` / `build` / `test:unit` / `test:e2e`.
- **What we learned:**
  - שורה כפולה אחרי `geometryAnswer` בתוך מערך `concepts` שברה parse והפילה ESLint/TypeScript.
  - `playwright.config.ts` בוחר `next start` כש־`CI` מוגדר — צריך `npm run build` לפני E2E (כמו ב־GitHub Actions); מקומית בלי בנייה מלאה עדיף `CI=` או dev בלבד.
  - אם `next build` נכשל על `next-font-manifest.json` חסר, ניקוי `.next` ואז build מחדש פותר בדרך כלל.
- **Why it matters:** תוכן + מיגרציית התקדמות תלויים במערך תקין ובסדר הרצת בדיקות.
- **How to reuse next time:** אחרי עריכות גדולות ל־`days.ts`, להריץ lint מיד; לפני E2E מקומי עם `CI=true`, לוודא שיש `BUILD_ID` תחת `.next`.

### 2026-03-25 (נתיב יום בתוך כיתה + 404)
- **Trigger:** דפדפן הראה 404 ל־`/grade/a/day/day-2` בעוד שהבנייה מחזירה 200 לנתיב זה.
- **What we learned:** אם `next dev` רץ מתוך תיקייה ישנה בלי `app/grade/[grade]/day/[id]/page.tsx`, או אחרי שינויי ניתוב בלי ריסטארט/`rm -rf .next`, אפשר לקבל 404. בנוסף, `parseDayId` קיבל חיזוקים (trim, מקף יוניקוד, `day-01`, רישיות).
- **Files:** `lib/utils/parseDayId.ts`, `lib/grades.ts`, `tests/unit/lib/utils/parseDayId.test.ts`

## 2026-03-25

- Initial learning-log scaffolding for consistent future agent behavior.


### 2026-04-03 (Hebrew TTS + admin toggle)
- **Trigger:** Tap-to-play vocal instructions with admin on/off (per browser).
- **What changed / where:** `lib/tts/engine.ts`, `lib/admin/prefs.ts`, `lib/hooks/useAdminTtsEnabled.ts`, `components/ui/TapToPlayTtsButton.tsx`, `components/ExerciseBox.tsx`, `components/screens/AdminProgressScreen.tsx`, `lib/testIds.ts`.
- **What we learned:** Prefer `localStorage` + `CustomEvent` for same-tab pref sync; `storage` event only fires cross-tab. E2E should wrap native `speechSynthesis.speak` after navigation (init scripts can lose to Next hydration).
- **How to reuse next time:** Add `data-testid` on new layout wrappers early — `check:testids` flags bare `<div>` rows.

- **Follow-up (2026-04-03):** TTS string now uses `buildExercisePromptSpeakText` (`lib/utils/exercisePromptSpeakText.ts`) so audio follows visible text + math line; admin TTS state moved to `AdminTtsProvider` in root layout (`AppProviders`) so listeners are not duplicated per `ExerciseBox`.

### 2026-04-03 (Day Hub: teaching primer + TTS)

- **Trigger:** Plan to add “learn first” copy on the day overview before section cards, with optional Hebrew TTS, aligned with international CPA-style pedagogy.
- **What changed / where:**
  - `lib/types/curriculum.ts` — optional `teachingSummary` / `teachingSteps` on `WorkbookDay`
  - `lib/content/engine/exercise-factories.ts` — optional fields on `DayConcept`
  - `lib/content/engine/day-builder.ts` — maps concept fields onto `WorkbookDay`
  - `lib/content/buildDayPrimerSpeakText.ts` — `hasDayTeachingPrimer`, `buildDayPrimerSpeakText`, collapse threshold constant
  - `components/DayTeachingPrimer.tsx` — Surface panel under header; collapse when long; `TapToPlayTtsButton`; testIds
  - `components/screens/DayOverviewScreen.tsx` — renders `DayTeachingPrimer`
  - `components/DayHeader.tsx` — helper-based testIds when `rootTestId` is set (weekBadge, title, emoji, objective)
  - `lib/testIds.ts` — `teachingPrimer`, `teachingPrimerTts`, `teachingPrimerExpand`
  - Pilot content: `lib/content/grade-a/day-01.ts`, `day-02.ts`, `day-08.ts`
  - Tests: `content-validity.test.ts`, `buildDayPrimerSpeakText.test.ts`, `day-smoke.spec.ts`
- **How to reuse:** Author optional primer on `DayConcept`; keep copy consistent with section `WorkedExample`; run `check:testids` on any new DOM in the primer subtree.

### 2026-04-03 (Teaching primer: full Grade A rollout + subcomponents)
- **What changed:** All `lib/content/grade-a/day-*.ts` concepts now include optional `teachingSummary` / `teachingSteps` where missing; UI split into `components/teaching-primer/` (`TeachingPrimerExpandedContent`, `TeachingPrimerExpandToggle`, `DayTeachingPrimer`) with `components/DayTeachingPrimer.tsx` re-export.
- **E2E:** "no primer" scenario uses **Grade B** `day-1` (no authored primer) + unlock cookie.

### 2026-05-17 (Teaching primer: catalog, child TTS, Grade B primers)
- **Trigger:** Grade-fit Hebrew copy + slower chunked primer TTS app-wide.
- **What changed / where:** `lib/content/teachingPrimerCatalog.ts` (58 days); `teachingPrimerFromCatalog` in `day-builder` with `grade` option; `lib/tts/constants.ts` + child default in `lib/tts/engine.ts` (`speakHebrewChunks`); `TapToPlayTtsButton` `chunks` prop; `docs/TEACHING_PRIMER_GUIDELINES.md`; `teaching-primer-content.test.ts`.
- **How to reuse:** Edit catalog per grade/day; run primer content + TTS unit tests and `day-smoke` / `grade-b-lifecycle` E2E.

### 2026-06-13 (English learning layer — Phase 0/1: audio-first Hebrew→English)
- **Trigger:** Add a second subject (English, taught from Hebrew) alongside Math, same warm-up → teaching → final-exam shape, built on researched young-EFL best practice (listening-first, comprehensible input, no free text).
- **What changed / where (Phase 0 rails + Phase 1 Day 1):**
  - `lib/subjects.ts` — `Subject` + `LearningTrack` model (math is grade-keyed, english is single subject-keyed track)
  - `lib/track.ts` — resolver mapping `{subject,grade}` → day source + (isolated) progress store; keeps `lib/progress/storage.ts` untouched
  - `lib/english/storage.ts` — isolated `kids_math.english.workbook_progress.v1` store (reuses `WorkbookProgressState` + `sanitizeState`)
  - `lib/types/curriculum.ts` — new `listen_choose` / `letter_tiles` exercise kinds (audio + tap-to-spell, no keyboard)
  - Handled new kinds in `lib/utils/exercise.ts` (grading+hint), `lib/progress/engine.ts` (answer lookup), `lib/utils/choiceOptions.ts`, `lib/content/engine/exercise-factories.ts`
  - `components/exercises/AudioButton.tsx` (English TTS + graceful no-voice fallback), `LetterTiles.tsx`; wired into `ExerciseRenderer.tsx`
  - `lib/tts/engine.ts` — parameterized lang; `speakEnglish` + `pickEnglishVoice` + `isEnglishVoiceAvailable`
  - English screens `components/screens/english/*` + pages `app/english/**`; English entry card on `app/page.tsx`; `routes.ts` builders
  - Hooks `useProgress` / `useDayAnswers` take optional `subject` (default math → byte-identical)
  - Content: `lib/content/english/day-01.ts` (Greetings & Colors), `english-workbook.ts`
  - Tests: `tests/unit/lib/english/storage.test.ts`, `exercise-english-kinds.test.ts`, `tests/e2e/english-day-smoke.spec.ts`
- **What we learned:**
  1. `ExerciseRenderer` was **non-exhaustive** — a trailing `else` silently rendered any unknown kind as a number-line. Adding kinds requires fixing this to a real `never` check, plus 3 other exhaustive switches the compiler flags (`exercise.ts` ×2, `progress/engine.ts`).
  2. `tid()`/`childTid()` **lowercase every segment** — a camelCase E2E selector (`letterTiles`) won't match the DOM (`lettertiles`). Always build selectors via the testId helpers, never hand-concatenate.
  3. `tests/e2e/edge-and-a11y.spec.ts` `math-token-row.png` screenshot is **environment-flaky** (fails on a clean tree on this machine) — not a code regression.
- **How to reuse next time:** New subject → add to `Subject`, give it its own `lib/<subject>/storage.ts` (never edit math's), resolve via `lib/track.ts`, thread `subject` through hooks (default-preserve math), and build thin dedicated screens reusing `ExerciseItem`/`SectionBlock`/`useProgress`/`useDayAnswers`. Deferred for Phase 2: `match_pairs` kind, English final exam, sync-bundle v2 (English keys), `/`→Subject-Picker relocation, full Pre-A1 curriculum.

### 2026-06-13 (Subject-first IA: `/` = subject picker, grades under Math)
- **Trigger:** Make the main screen show "Math" and "English"; grades live inside Math.
- **What changed / where:**
  - `app/page.tsx` — now the **Subject Picker** (`testIds.screen.subjectPicker.*`)
  - `app/math/page.tsx` (new) — the Math grade picker (keeps `testIds.screen.gradePicker.*`) + "back to subjects" nav (`gradePicker.navBack`)
  - `lib/routes.ts` — `gradePicker()` now aliases **`/math`** (so all existing "back to grade selection" links auto-correct with no per-file edits)
  - `lib/testIds.ts` — added `subjectPicker.*`, moved `englishCard*` there, added `gradePicker.navBack`
  - Tests: `routes.test.ts` (IA path map), `subject-picker.spec.ts` (new nav E2E); updated `admin-progress`/`auth-backward-compat`/`grade-b-lifecycle`/`english-day-smoke`
  - `docs/NAVIGATION_IA.md` (new) — route map + How-tos
- **What we learned:**
  1. **Aliasing the old route builder is cheaper than repointing call sites.** `routes.gradePicker()` → `/math` auto-migrated 8 "back to grade selection" links; only assertions that pin URL/landing identity needed edits (3 lines).
  2. The E2E `goto("/")` calls are overwhelmingly **load-and-clear anchors**, not grade-card interactions — so changing what renders at `/` was low-risk. Verify this distinction before any home-route change.
- **How to add a new subject / grade / exercise kind:** see `docs/NAVIGATION_IA.md` (step-by-step How-to sections).
- **DX improvement added:** `docs/NAVIGATION_IA.md` route map + How-to guides; `routes.test.ts` now guards the IA path mapping from silent drift.

### 2026-06-13 (כיתה ב׳ — שער ברירת הכיתה, לא רק middleware)
- **Trigger:** "כיתה ב׳ should open only after grade A is done, not before." Bug: the כיתה ב׳ card was enterable before passing grade A's final exam.
- **Root cause:** Two-layer gate, only one layer enforced. `middleware.ts` correctly redirects `/grade/b/*` to `/grade/b/locked` without the unlock cookie — but `app/math/page.tsx` rendered the grade B card as an **always-active `<Link>`**. The page already loaded `gradeAFinalPassed` (via `loadFinalExamState("a")`) but used it only to decorate grade A's badge, never to gate grade B. Net: the card *looked* open and bounced the child through a redirect.
- **What changed / where:**
  - `app/math/page.tsx` — `gradeBLocked = !gradeAFinalPassed && !previewAll`; when locked, render an **inert** card (`<div>`, not `<Link>`, `opacity-60`, 🔒 warning chip, locked hint, **no** `gradeCardCta`); active `<Link>` only when unlocked. `previewAll` bypasses (QA).
  - `tests/e2e/subject-picker.spec.ts` — locked-before (inert, no CTA, click stays on `/math`), `?previewAll=1` unlock, and full valid passed-state unlock.
  - `docs/NAVIGATION_IA.md` — "How to add a grade" now states the picker-card gating rule.
- **What we learned:**
  1. `loadFinalExamState` **rejects** any state whose `selectedExerciseIds.length !== FINAL_EXAM_QUESTION_COUNT` (30) — seeding a bare `{passed:true}` returns `null`. E2E must seed a full valid state or use `previewAll`.
  2. Picker reads localStorage (`passed`); middleware reads the cookie. Admin-forced cookie-unlock without a passed exam leaves the card locked — accepted edge (the picker reflects the learner's own result).
- **How to reuse next time:** When a route is gated in `middleware.ts`, also gate its **entry card** in the picker on the same unlock signal — a passing E2E redirect can still leave a misleadingly-open card. Make the locked card inert (no CTA), not a `<Link>` to a redirect.

### 2026-06-13 (English Phase 2: match_pairs, final exam, full curriculum, sync v2)
- **Trigger:** Complete the English layer — all deferred Phase 2 items.
- **What changed / where:**
  - **2.1 match_pairs kind:** `curriculum.ts` (kind+interface), `exercise.ts` (`isMatchPairsCorrect` via early-return on raw JSON), `progress/engine.ts`, `exercise-factories.ts` (`matchPairs`), `components/exercises/MatchPairs.tsx`, renderer wiring, testIds, unit + E2E.
  - **2.2 English final exam:** `lib/english/final-exam/{config,types,picker,grading,storage}.ts` (adaptive count, key `kids_math.english.final_exam.v1`), `components/screens/english/EnglishFinalExamScreen.tsx`, `app/english/exam/page.tsx`, exam card on English home (unlock when all days complete; previewAll bypass), unit + E2E.
  - **2.3 curriculum:** English days 2–7 (`lib/content/english/day-0{2..7}.ts`) — numbers, family, animals, food, body, classroom; `english-content-validity.test.ts` (29 checks).
  - **2.4 sync v2:** `UserProgressBundle` bumped to `bundleVersion: 1|2` with optional `english`; `buildBundleFromLocalStorage`/`hydrateLocalStorageFromBundle` include English; `/api/user/progress` accepts v1 **and** v2; round-trip + backward-compat unit test.
- **What we learned:**
  1. **match_pairs needs the raw answer, not the normalized one** — `normalizeAnswerValue` strips JSON punctuation. Handle it via an early `if (exercise.kind === "match_pairs")` return *before* normalization (which also keeps the other switches' `never` exhaustiveness intact).
  2. **Sync bundle versioning:** make new subject data an **optional** field + accept both versions on the server. Old v1 payloads hydrate (skip english); v2 degrades gracefully. The `snapshot/restore` path already covers `kids_math.*` keys generically — only the structured bundle needed changes.
  3. **`next build` is fragile under concurrent activity** — a running `next dev` (or another agent) writing `.next` mid-build yields misleading `PageNotFoundError`/`ENOENT` (`_document`, `_not-found`, `*.nft.json`). These are environment races, not code errors; confirm via an isolated `rm -rf .next && npm run build` with no other Next process running.
- **How to add an exam for a new subject:** mirror `lib/english/final-exam/*` — config (target/min/pass), picker (seeded shuffle over `buildXExamBank()`, cap at bank size), grading (`gradeXFinalExam` → scorePercent/passed/canFinish), storage (`kids_math.<subject>.final_exam.v1`), a screen using `ExerciseItem` with `showCheckButton=false` + bulk grade on finish, a `/…/exam` page, an unlock-gated card on the subject home, then add its key to the sync bundle.
- **DX improvement added:** `english-content-validity.test.ts` (guards every authored day: ids, counts, answer-in-options, self-grading) — copy it per subject. `NAVIGATION_IA.md` "How to add an exercise kind / subject" extended.
