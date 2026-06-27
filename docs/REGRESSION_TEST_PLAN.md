# Full System Regression Test Plan — kids_math

> **Scope:** Every feature of the Hebrew-RTL daily math + English workbook (Next.js 14 App Router, React 18, TypeScript strict, localStorage state, Vitest + Playwright). Each case below is written to be executed **both manually** and **as an automated test**, with explicit **positive (+)** and **negative (−)** coverage.
>
> **Source of truth:** Selectors reference real test IDs from `lib/testIds.ts`; routes reference `lib/routes.ts`. Thresholds (30 questions / 85% pass / streak milestones / badge thresholds) are taken from the cited source files. No selector or route in this plan is invented.

---

## 1. How to Run

### Automated

```bash
npm run test:qa      # Full QA gate: lint + unit + build + E2E (run before declaring a release READY)
npm run test:unit    # Vitest unit suite (lib/* logic, storage, engines, content)
npm run test:e2e     # Playwright E2E suite (Chromium), boots the app via playwright.config webServer
npm run lint         # ESLint
npm run check:testids # Test-ID coverage gate
npm run build        # Production build (catches type / SSR errors)
```

Run a single spec:

```bash
npm run test:unit -- tests/unit/lib/streak/engine.test.ts
npm run test:e2e  -- tests/e2e/grade-b-gate.spec.ts
```

### Manual setup (per session)

1. **Fresh state:** open DevTools → Application → Local Storage → clear all keys under the app origin (all app keys are prefixed `kids_math.*`). Also clear cookies (notably `kids_math.unlocked_grade_b`).
2. **RTL note:** the document/page must render `dir="rtl"` (Hebrew). The ONLY elements allowed to be `dir="ltr"` are math/number inputs. Verify visually that text flows right-to-left and that numbers in inputs read left-to-right.
3. **Numbers-only rule:** students answer either by typing **digits** (`number_input`) or by **tapping** (`multiple_choice`, `true_false`, `shape_choice`, `number_line_jump`, `letter_tiles`, `match_pairs`). There is no free-text answer field anywhere.
4. **Admin:** admin progress screen is PIN-gated; admin users screen is reachable via the avatar dropdown when logged in as an admin.
5. **Preview-all:** appending `?previewAll=1` unlocks all gated content for inspection (preserved across route builders).

---

## 2. Legend

| Field | Values | Meaning |
|-------|--------|---------|
| **+/−** | `+` / `−` | Positive (happy path) / Negative (error, edge, abuse, boundary) |
| **Type** | `Manual` / `Auto` / `Both` | How the case is intended to be executed |
| **Priority** | `P0` / `P1` / `P2` | P0 = blocks release (core flow / data safety / gate) · P1 = important · P2 = polish/edge |
| **Automated spec status** | ✅ exists · 🆕 to add · 📝 manual-only | The `Automated spec` column path: ✅ already in `tests/**`, 🆕 a new spec added in parallel, 📝 no automated coverage planned |

**New specs referenced as 🆕:** `tests/unit/lib/streak/engine.test.ts`, `tests/unit/lib/badges/engine.test.ts`, `tests/e2e/grade-b-gate.spec.ts`, `tests/e2e/exercise-negative.spec.ts`, `tests/e2e/visual-smoke.spec.ts`.

---

## 3. Coverage Summary Matrix

| # | Area (REG prefix) | Cases | + | − | Primary spec(s) |
|---|-------------------|------:|--:|--:|-----------------|
| 1 | Subject picker (`SUBJECT`) | 6 | 4 | 2 | `tests/e2e/subject-picker.spec.ts` |
| 2 | Math grade picker (`GRADEPICK`) | 6 | 4 | 2 | `tests/e2e/subject-picker.spec.ts`, `edge-and-a11y.spec.ts` |
| 3 | Grade home (`HOME`) | 8 | 5 | 3 | `grade-a-lifecycle.spec.ts`, `day-smoke.spec.ts` |
| 4 | Day overview (`DAYOV`) | 8 | 5 | 3 | `day-smoke.spec.ts`, `tts-accessibility.spec.ts` |
| 5 | Section page (`SECTION`) | 8 | 5 | 3 | `grade-a-lifecycle.spec.ts`, `spiral-review.spec.ts` |
| 6 | Exercise engine (`EX`) | 14 | 7 | 7 | `exercise-negative.spec.ts` 🆕, `day-smoke.spec.ts`, unit `utils/exercise*.test.ts` |
| 7 | Final exam (`FINALEXAM`) | 11 | 5 | 6 | `final-exam/grading.test.ts`, `grade-a-lifecycle.spec.ts` |
| 8 | Grade-B unlock chain (`GRADEB`) | 10 | 4 | 6 | `grade-b-gate.spec.ts` 🆕, `grade-b.spec.ts`, `grade-b-lifecycle.spec.ts` |
| 9 | GMAT challenge (`GMAT`) | 9 | 5 | 4 | `gmat-challenge.spec.ts`, unit `gmat-challenge/*.test.ts` |
| 10 | Badges (`BADGE`) | 11 | 6 | 5 | `badges/engine.test.ts` 🆕, `trophy-unlock-bulk.spec.ts` |
| 11 | Streak (`STREAK`) | 9 | 4 | 5 | `streak/engine.test.ts` 🆕 |
| 12 | Plan page (`PLAN`) | 6 | 4 | 2 | `routes.test.ts`, Manual |
| 13 | English layer (`ENG`) | 12 | 7 | 5 | `english-day-smoke.spec.ts`, `english-exam-smoke.spec.ts`, unit `english/*.test.ts` |
| 14 | Auth (`AUTH`) | 11 | 5 | 6 | `auth.spec.ts`, `auth-backward-compat.spec.ts`, unit `auth/*.test.ts` |
| 15 | Admin (`ADMIN`) | 12 | 6 | 6 | `admin-progress.spec.ts`, `admin-users.spec.ts`, unit `admin/*.test.ts` |
| 16 | TTS / voice (`TTS`) | 8 | 5 | 3 | `tts-accessibility.spec.ts`, unit `tts/*.test.ts` |
| 17 | Storage & backward-compat (`STORAGE`) | 9 | 4 | 5 | unit `progress/storage.test.ts`, `auth/storageBackwardCompat.test.ts` |
| 18 | Legal & consent (`LEGAL`) | 6 | 4 | 2 | `legal-pages.spec.ts` |
| 19 | Cross-cutting: RTL / a11y / routes / preview (`XCUT`) | 10 | 6 | 4 | `edge-and-a11y.spec.ts`, `routes.test.ts` |
| | **TOTAL** | **174** | **95** | **79** | |

---

## 4. Per-Area Case Tables

### Area 1 — Subject Picker (`REG-SUBJECT-NN`)

Route: `routes.subjectPicker()` → `/`. Root: `screen.subjectPicker.root`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-SUBJECT-01 | Picker renders both subjects | Fresh localStorage | 1. Navigate to `/`. 2. Wait for `screen.subjectPicker.root`. | Root visible; `screen.subjectPicker.mathCard` and `screen.subjectPicker.englishCard` both visible; hero shown. | + | Both | P0 | `tests/e2e/subject-picker.spec.ts` ✅ |
| REG-SUBJECT-02 | Math card → grade picker | At `/` | 1. Click `screen.subjectPicker.mathCardCta`. | URL becomes `/math`; `screen.gradePicker.root` visible. | + | Both | P0 | `tests/e2e/subject-picker.spec.ts` ✅ |
| REG-SUBJECT-03 | English card → level picker | At `/` | 1. Click `screen.subjectPicker.englishCardCta`. | URL becomes `/english`; `screen.english.levelPicker.root` visible. | + | Both | P0 | `tests/e2e/subject-picker.spec.ts` ✅ |
| REG-SUBJECT-04 | Admin CTA present | At `/` | 1. Locate `screen.subjectPicker.adminCta`. 2. Click it. | Navigates toward admin (PIN-gated progress screen). | + | Both | P1 | `tests/e2e/subject-picker.spec.ts` ✅ |
| REG-SUBJECT-05 | Page is RTL | At `/` | 1. Inspect `<html>`. | `dir="rtl"` on the document root. | − | Both | P1 | `tests/e2e/edge-and-a11y.spec.ts` ✅ |
| REG-SUBJECT-06 | Unknown top-level path | Fresh state | 1. Navigate to `/does-not-exist`. | Next.js 404 page; no client crash, no console error. | − | Both | P2 | `tests/e2e/edge-and-a11y.spec.ts` ✅ |

### Area 2 — Math Grade Picker (`REG-GRADEPICK-NN`)

Route: `routes.gradePicker()` / `routes.mathHome()` → `/math`. Root: `screen.gradePicker.root`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-GRADEPICK-01 | Both grade cards render | Fresh state | 1. Go to `/math`. | `screen.gradePicker.gradeCard("a")` and `gradeCard("b")` visible. | + | Both | P0 | `tests/e2e/subject-picker.spec.ts` ✅ |
| REG-GRADEPICK-02 | Grade A card opens A home | At `/math` | 1. Click `screen.gradePicker.gradeCardCta("a")`. | URL `/grade/a`; `screen.home.root("a")` visible. | + | Both | P0 | `tests/e2e/grade-a-lifecycle.spec.ts` ✅ |
| REG-GRADEPICK-03 | Back nav to subject picker | At `/math` | 1. Click `screen.gradePicker.navBack`. | Returns to `/`; `screen.subjectPicker.root` visible. | + | Both | P1 | `tests/e2e/subject-picker.spec.ts` ✅ |
| REG-GRADEPICK-04 | Grade B card while locked | Fresh state (no unlock cookie) | 1. Click `screen.gradePicker.gradeCardCta("b")`. | Navigation lands on `/grade/b/locked` (gate redirect), NOT B home. | − | Both | P0 | `tests/e2e/grade-b-gate.spec.ts` 🆕 |
| REG-GRADEPICK-05 | Invalid grade param | Fresh state | 1. Navigate to `/grade/z`. | 404 (invalid grade param), no crash. | − | Both | P1 | `tests/e2e/edge-and-a11y.spec.ts` ✅ |
| REG-GRADEPICK-06 | preview-all preserved | At `/math?previewAll=1` | 1. Click a grade CTA. 2. Inspect URL. | `previewAll=1` carried into the next route via route builder. | + | Both | P2 | `tests/unit/lib/routes.test.ts` ✅ |

### Area 3 — Grade Home (`REG-HOME-NN`)

Route: `routes.gradeHome(grade)` → `/grade/[grade]`. Root: `screen.home.root(grade)`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-HOME-01 | Home renders day cards | At `/grade/a` | 1. Wait for `screen.home.root("a")`. | Day cards (`screen.home.dayCard(dayId)`) render for the curriculum days. | + | Both | P0 | `tests/e2e/grade-a-lifecycle.spec.ts` ✅ |
| REG-HOME-02 | Day card opens day overview | At `/grade/a` | 1. Click `screen.home.dayCardCta("day-1")`. | URL `/grade/a/day/day-1`; `screen.dayOverview.root("a","day-1")` visible. | + | Both | P0 | `tests/e2e/day-smoke.spec.ts` ✅ |
| REG-HOME-03 | Plan CTA navigates | At `/grade/a` | 1. Click `screen.home.planCta("a")`. | URL `/grade/a/plan`; plan root visible. | + | Both | P1 | `tests/unit/lib/routes.test.ts` ✅ |
| REG-HOME-04 | Badges CTA navigates | At `/grade/a` | 1. Click `screen.badges.badgesCta("a")`. | URL `/grade/a/badges`; `screen.badges.root("a")` visible. | + | Both | P1 | `tests/e2e/trophy-unlock-bulk.spec.ts` ✅ |
| REG-HOME-05 | GMAT CTA navigates | At `/grade/a` | 1. Click `screen.home.gmatChallengeCta("a")`. | URL `/grade/a/gmat-challenge`; GMAT root visible. | + | Both | P1 | `tests/e2e/gmat-challenge.spec.ts` ✅ |
| REG-HOME-06 | Completion reflected after refresh | Day-1 completed | 1. Complete day-1. 2. Return to home. 3. Refresh. | Day-1 card shows completed state and record time persists. | + | Both | P0 | `tests/e2e/grade-a-lifecycle.spec.ts` ✅ |
| REG-HOME-07 | Direct B-home deep link gated | No unlock cookie | 1. Navigate directly to `/grade/b`. | Redirect to `/grade/b/locked?next=...`; B home NOT shown. | − | Both | P0 | `tests/e2e/grade-b-gate.spec.ts` 🆕 |
| REG-HOME-08 | Nonexistent day id | At `/grade/a` | 1. Navigate to `/grade/a/day/day-999`. | "Day not found" panel; no crash/console error. | − | Both | P1 | `tests/e2e/edge-and-a11y.spec.ts` ✅ |

### Area 4 — Day Overview (`REG-DAYOV-NN`)

Route: `routes.gradeDay(grade,dayId)`. Root: `screen.dayOverview.root(grade,dayId)`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-DAYOV-01 | Section cards render | At day overview | 1. Open `/grade/a/day/day-1`. | One `screen.dayOverview.sectionCard(...)` per section is visible. | + | Both | P0 | `tests/e2e/day-smoke.spec.ts` ✅ |
| REG-DAYOV-02 | Section card opens section | At day overview | 1. Click `screen.dayOverview.sectionCardCta(...)`. | URL `/grade/a/day/day-1/section/<id>`; section root visible. | + | Both | P0 | `tests/e2e/day-smoke.spec.ts` ✅ |
| REG-DAYOV-03 | Teaching primer visible | At day overview | 1. Locate `screen.dayOverview.teachingPrimer(...)`. | Primer summary + steps rendered. | + | Both | P1 | `tests/unit/lib/content/teaching-primer-content.test.ts` ✅ |
| REG-DAYOV-04 | Teaching primer expand | At day overview | 1. Click `teachingPrimerExpand(...)`. | Full primer content expands; no layout break. | + | Both | P2 | `tests/e2e/day-smoke.spec.ts` ✅ |
| REG-DAYOV-05 | Primer TTS plays | Admin TTS on, student TTS on | 1. Click `teachingPrimerTts(...)`. | Speech invoked with normalized Hebrew text; no error. | + | Both | P1 | `tests/e2e/tts-accessibility.spec.ts` ✅ |
| REG-DAYOV-06 | Day completion panel | All sections done | 1. Complete every section. 2. Return to overview. | `screen.dayOverview.completionPanel(...)` + `completeCta` visible. | + | Both | P0 | `tests/e2e/all-days-completion.spec.ts` ✅ |
| REG-DAYOV-07 | Complete CTA blocked early | Sections incomplete | 1. Open overview with sections unfinished. 2. Attempt to complete the day. | Day cannot be marked complete (completion panel/CTA not actionable) until all sections done. | − | Both | P0 | `tests/e2e/all-days-completion.spec.ts` ✅ |
| REG-DAYOV-08 | Weak-spot panel only when data | No first-attempt-wrong history | 1. Open a fresh day overview. | Weak-spot panel absent when no weak exercises exist; appears only when prior misses recorded. | − | Both | P2 | `tests/e2e/spiral-review.spec.ts` ✅ |

### Area 5 — Section Page (`REG-SECTION-NN`)

Route: `routes.gradeSection(grade,dayId,sectionId)`. Root: `screen.section.root(...)`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-SECTION-01 | Section renders exercises | At a section | 1. Open a section. | Exercise boxes (`component.exerciseBox.root(exId)`) render. | + | Both | P0 | `tests/e2e/day-smoke.spec.ts` ✅ |
| REG-SECTION-02 | Complete all → completion panel | At a section | 1. Answer every exercise correctly. | `screen.section.completionPanel(...)` shown. | + | Both | P0 | `tests/e2e/grade-a-lifecycle.spec.ts` ✅ |
| REG-SECTION-03 | Next-section CTA appears & navigates | Section completed | 1. Complete a section. 2. Click `screen.section.nextSectionCta(...)`. | Navigates to next section in order. | + | Both | P1 | `tests/e2e/grade-a-lifecycle.spec.ts` ✅ |
| REG-SECTION-04 | Spiral review block surfaces past miss | A prior first-attempt-wrong exercise exists | 1. Open a later day's warm-up. | `screen.section.spiralReview.root(...)` shows the previously-missed exercise. | + | Both | P1 | `tests/e2e/spiral-review.spec.ts` ✅ |
| REG-SECTION-05 | Progress persists on refresh | Mid-section answers given | 1. Answer some exercises. 2. Refresh. | Answered/correct state persists. | + | Both | P0 | `tests/e2e/grade-a-lifecycle.spec.ts` ✅ |
| REG-SECTION-06 | Next-section gated until complete | Section incomplete | 1. Open a section, leave exercises unanswered. | `nextSectionCta` not available / non-actionable until section complete. | − | Both | P0 | `tests/e2e/grade-a-lifecycle.spec.ts` ✅ |
| REG-SECTION-07 | Invalid section id | At a valid day | 1. Navigate to `.../section/bogus`. | Not-found / graceful handling, no crash. | − | Both | P1 | `tests/e2e/edge-and-a11y.spec.ts` ✅ |
| REG-SECTION-08 | RTL with LTR math inputs | At a section with number_input | 1. Inspect page and a number input. | Page `dir="rtl"`; number input `dir="ltr"`. | − | Both | P1 | `tests/e2e/edge-and-a11y.spec.ts` ✅ |

### Area 6 — Exercise Engine (`REG-EX-NN`)

Kinds: `number_input`, `multiple_choice`, `true_false`, `number_line_jump`, `shape_choice`, `letter_tiles`, `match_pairs`. Selectors: `component.exerciseBox.*`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-EX-01 | number_input correct | Section with a number_input | 1. Type the correct digits in `exerciseBox.input(exId)`. 2. Click `exerciseBox.check(exId)`. | Marked correct; correct state recorded. | + | Both | P0 | `tests/e2e/answering.ts` / `day-smoke.spec.ts` ✅ |
| REG-EX-02 | multiple_choice correct | Section with MC | 1. Click correct `exerciseBox.choice(exId, key)`. | Marked correct. | + | Both | P0 | `tests/e2e/day-smoke.spec.ts` ✅ |
| REG-EX-03 | true_false correct | Section with T/F | 1. Tap correct choice. | Marked correct. | + | Both | P1 | `tests/unit/lib/utils/exercise.test.ts` ✅ |
| REG-EX-04 | number_line_jump correct | Section with number line | 1. Select correct jump target. | Marked correct. | + | Both | P1 | `tests/unit/lib/utils/exercise.test.ts` ✅ |
| REG-EX-05 | shape_choice correct | Section with shapes | 1. Tap correct shape (`component.shapeIcon.root(shape)`). | Marked correct. | + | Both | P1 | `tests/unit/lib/utils/exercise.test.ts` ✅ |
| REG-EX-06 | letter_tiles correct (English) | English section | 1. Tap tiles (`exerciseBox.tile(exId,i)`) to spell the word. 2. Check. | Word assembled; marked correct. | + | Both | P1 | `tests/unit/lib/utils/exercise-english-kinds.test.ts` ✅ |
| REG-EX-07 | match_pairs correct (English) | English section | 1. Match each `matchLeft(exId,i)` to its `matchRight(exId,j)`. | All pairs matched; correct. | + | Both | P1 | `tests/unit/lib/utils/exercise-english-kinds.test.ts` ✅ |
| REG-EX-08 | Empty submit | number_input exercise | 1. Leave input blank. 2. Click `check`. | No false "correct"; not accepted; learner can still answer. | − | Both | P0 | `tests/e2e/exercise-negative.spec.ts` 🆕 |
| REG-EX-09 | Non-numeric input rejected | number_input exercise | 1. Attempt to type letters/symbols. 2. Check. | Input accepts digits only (no free text); letters not gradable as correct. | − | Both | P0 | `tests/e2e/exercise-negative.spec.ts` 🆕 |
| REG-EX-10 | Decimal / sign handling | number_input expecting integer | 1. Type `7.0` / `+7` / `07`. 2. Check. | Graded per `exerciseMathPolicy` normalization; not silently mis-accepted. | − | Both | P1 | `tests/unit/lib/utils/exerciseMathPolicy.test.ts` ✅ |
| REG-EX-11 | Wrong answer → retry visible | any gradable exercise | 1. Submit a wrong answer. | Marked wrong; `exerciseBox.retry(exId)` becomes available. | − | Both | P0 | `tests/e2e/exercise-negative.spec.ts` 🆕 |
| REG-EX-12 | Retry then correct | After a wrong answer | 1. Click retry. 2. Submit correct answer. | Now marked correct; first-attempt-wrong recorded for spiral review. | + | Both | P1 | `tests/e2e/exercise-negative.spec.ts` 🆕 |
| REG-EX-13 | Hint reveal | Exercise with hint | 1. Click `exerciseBox.hint(exId)`. | `exerciseBox.hintText(exId)` shown; no auto-pass. | − | Both | P2 | `tests/e2e/day-smoke.spec.ts` ✅ |
| REG-EX-14 | No free-text input anywhere | Any section | 1. Audit all answer controls on a section. | No control accepts arbitrary text; only digit inputs + tap controls exist. | − | Both | P0 | `tests/unit/lib/utils/exerciseMathPolicy.test.ts` ✅ |

### Area 7 — Final Exam (Math) (`REG-FINALEXAM-NN`)

30 questions, pass at **85%** (`lib/final-exam/config.ts`). Selectors: `screen.finalExam.*`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-FINALEXAM-01 | Exam draws 30 questions | Final exam reachable | 1. Open the final exam. | Exactly 30 questions selected (deterministic by seed/pickerVersion). | + | Both | P0 | `tests/unit/lib/final-exam/picker.test.ts` ✅ |
| REG-FINALEXAM-02 | Finish disabled until all answered | Exam open, <30 answered | 1. Answer 29 of 30. 2. Inspect `screen.finalExam.finishCta(grade)`. | Finish CTA disabled / not actionable until all 30 answered. | − | Both | P0 | `tests/unit/lib/final-exam/grading.test.ts` ✅ |
| REG-FINALEXAM-03 | Finish enabled at 30 answered | All 30 answered | 1. Answer all 30. | `finishCta` enabled. | + | Both | P0 | `tests/e2e/grade-a-lifecycle.spec.ts` ✅ |
| REG-FINALEXAM-04 | 85% passes (boundary) | 26/30 correct (≈87%) | 1. Grade with 26 correct. | Pass (≥85%, `Math.round`). | + | Both | P0 | `tests/unit/lib/final-exam/grading.test.ts` ✅ |
| REG-FINALEXAM-05 | 83% fails (boundary) | 25/30 correct (≈83%) | 1. Grade with 25 correct. | Fail (<85%). | − | Both | P0 | `tests/unit/lib/final-exam/grading.test.ts` ✅ |
| REG-FINALEXAM-06 | Fail → retry available | Exam failed | 1. Submit a failing exam. | `screen.finalExam.retryCta(grade)` shown; retry resets attempt. | − | Both | P0 | `tests/e2e/grade-a-lifecycle.spec.ts` ✅ |
| REG-FINALEXAM-07 | Pass Grade-A unlocks B | Grade-A exam passed | 1. Pass A final exam. 2. Observe finish panel. | `screen.finalExam.startGradeB` CTA appears; unlock cookie set. | + | Both | P0 | `tests/e2e/grade-a-lifecycle.spec.ts` ✅ |
| REG-FINALEXAM-08 | Pass Grade-B no further unlock | Grade-B exam passed | 1. Pass B final exam. | No additional grade unlocked; graceful completion state. | − | Both | P1 | `tests/e2e/grade-b-lifecycle.spec.ts` ✅ |
| REG-FINALEXAM-09 | Corrupt stored exam rejected | Tampered exam state | 1. Set invalid version/pickerVersion/length in storage. 2. Reload exam. | Stored state rejected and re-initialized; no crash. | − | Both | P1 | `tests/unit/lib/final-exam/storage.test.ts` ✅ |
| REG-FINALEXAM-10 | Score round-trips in storage | Exam in progress | 1. Answer some, refresh. | Core fields persist (selected ids, answers). | + | Both | P1 | `tests/unit/lib/final-exam/storage.test.ts` ✅ |
| REG-FINALEXAM-11 | GMAT CTA appears after pass | Final exam passed | 1. Inspect `screen.finalExam.gmatChallengeCta(grade)`. | GMAT challenge CTA available post-pass. | + | Both | P2 | `tests/e2e/gmat-challenge.spec.ts` ✅ |

### Area 8 — Grade-B Unlock Chain (`REG-GRADEB-NN`)

`middleware.ts` gate on `/grade/b/*` via cookie `kids_math.unlocked_grade_b`. Locked screen: `screen.gradeBLocked.root`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-GRADEB-01 | Deep link without cookie → locked | No unlock cookie | 1. Navigate to `/grade/b/day/day-1`. | Redirect to `/grade/b/locked?next=/grade/b/day/day-1`; `screen.gradeBLocked.root` visible. | − | Both | P0 | `tests/e2e/grade-b-gate.spec.ts` 🆕 |
| REG-GRADEB-02 | B home without cookie → locked | No unlock cookie | 1. Navigate to `/grade/b`. | Redirect to `/grade/b/locked?next=...`. | − | Both | P0 | `tests/e2e/grade-b.spec.ts` ✅ |
| REG-GRADEB-03 | Cookie present → B home shows | Cookie `=1` set | 1. Set cookie. 2. Navigate to `/grade/b`. | `screen.home.root("b")` renders. | + | Both | P0 | `tests/e2e/grade-b.spec.ts` ✅ |
| REG-GRADEB-04 | Cookie value not "1" → locked | Cookie set to junk | 1. Set cookie to `0`/`true`/random. 2. Navigate to `/grade/b`. | Treated as locked → `/grade/b/locked`. | − | Both | P0 | `tests/e2e/grade-b.spec.ts` ✅ |
| REG-GRADEB-05 | Unlock via API | No cookie | 1. POST `/api/unlock-grade-b`. 2. Navigate to `/grade/b`. | Cookie set; B home accessible. | + | Both | P0 | `tests/e2e/grade-b.spec.ts` ✅ |
| REG-GRADEB-06 | Lock via API re-gates | Cookie set | 1. POST `/api/lock-grade-b`. 2. Navigate to `/grade/b`. | Cookie cleared; redirect back to locked. | − | Both | P1 | `tests/e2e/grade-b-gate.spec.ts` 🆕 |
| REG-GRADEB-07 | Pass A exam → unlock B end-to-end | Grade-A exam passable | 1. Pass A final exam via real flow. 2. Start grade B. | Cookie set automatically; B becomes reachable. | + | Both | P0 | `tests/e2e/grade-a-lifecycle.spec.ts` ✅ |
| REG-GRADEB-08 | Locked page CTAs | At `/grade/b/locked` | 1. Click `gradeBLocked.goFinalExam` / `continueGradeA`. | Routes to A final exam / A home respectively. | + | Both | P1 | `tests/e2e/grade-b-gate.spec.ts` 🆕 |
| REG-GRADEB-09 | `next` param round-trip | Deep link gated | 1. Hit a B deep link. 2. After unlocking, follow `next`. | After unlock, user lands on the originally-requested B path. | − | Both | P1 | `tests/e2e/grade-b-gate.spec.ts` 🆕 |
| REG-GRADEB-10 | preview-all bypasses gate for inspection | `?previewAll=1` | 1. Navigate to `/grade/b?previewAll=1`. | B content viewable in preview mode (inspection only). | + | Manual | P2 | Manual-only 📝 |

### Area 9 — GMAT Challenge (`REG-GMAT-NN`)

Route: `routes.gradeGmatChallenge(grade)`. Selectors: `screen.gmatChallenge.*`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-GMAT-01 | Locked until final exam passed | Final exam not passed | 1. Open GMAT challenge. | `screen.gmatChallenge.locked(grade)` shown; challenge not startable. | − | Both | P0 | `tests/e2e/gmat-challenge.spec.ts` ✅ |
| REG-GMAT-02 | Rules panel after unlock | Final exam passed | 1. Open GMAT challenge. | `rulesPanel(grade)` visible. | + | Both | P1 | `tests/e2e/gmat-challenge.spec.ts` ✅ |
| REG-GMAT-03 | Section order panel | Unlocked | 1. Proceed past rules. | `orderPanel(grade)` shows section order. | + | Both | P2 | `tests/e2e/gmat-challenge.spec.ts` ✅ |
| REG-GMAT-04 | Section flow + finish | In a section | 1. Answer items. 2. Click `finishSectionCta(grade)`. | Advances; break panel where applicable. | + | Both | P1 | `tests/e2e/gmat-challenge.spec.ts` ✅ |
| REG-GMAT-05 | Break panel | Between sections | 1. Reach `breakPanel(grade)`. | Break shown; can continue. | + | Both | P2 | `tests/e2e/gmat-challenge.spec.ts` ✅ |
| REG-GMAT-06 | Results screen | All sections done | 1. Finish the challenge. | `results(grade)` shows score breakdown. | + | Both | P1 | `tests/e2e/gmat-challenge.spec.ts` ✅ |
| REG-GMAT-07 | Grading scores correctly | Known answers | 1. Grade a known answer set. | Score matches expected per `gradeGmatChallenge`. | + | Auto | P1 | `tests/unit/lib/gmat-challenge/grading.test.ts` ✅ |
| REG-GMAT-08 | Item classifier routing | Mixed items | 1. Classify word-problem vs quant. | Word problems → verbal; default → quant. | − | Auto | P2 | `tests/unit/lib/gmat-challenge/classifier.test.ts` ✅ |
| REG-GMAT-09 | Restart resets state | At results | 1. Click `restartCta(grade)`. | Challenge restarts from clean state. | − | Both | P2 | `tests/unit/lib/gmat-challenge/storage.test.ts` ✅ |

### Area 10 — Badges (`REG-BADGE-NN`)

~36 badges (`lib/badges/engine.ts` + `definitions.ts`). Route: `routes.gradeBadges(grade)`. Selectors: `screen.badges.*`, `component.trophyUnlock.*`, `component.starReward.*`.

> Note: badge ids `streak-3-days/5-days/10-days` are driven by **count of completed days** (3/5/10) — distinct from the calendar streak engine's 3/7/30-day milestones (Area 11). Exam badges: `exam-high-score` ≥90%, `exam-ace` =100%.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-BADGE-01 | Badges screen renders | At `/grade/a/badges` | 1. Open badges. | `screen.badges.root("a")`; badge cards render. | + | Both | P1 | `tests/e2e/trophy-unlock-bulk.spec.ts` ✅ |
| REG-BADGE-02 | Day-count badge at 3 days | 3 days completed | 1. Evaluate badges. | `streak-3-days` earned. | + | Auto | P1 | `tests/unit/lib/badges/engine.test.ts` 🆕 |
| REG-BADGE-03 | Day-count boundary 2→not, 3→yes | 2 then 3 days done | 1. Evaluate at 2, then 3. | Not earned at 2; earned at 3 (threshold boundary). | − | Auto | P0 | `tests/unit/lib/badges/engine.test.ts` 🆕 |
| REG-BADGE-04 | Day-count badge at 5 / 10 | 5 / 10 days done | 1. Evaluate badges. | `streak-5-days` at 5, `streak-10-days` at 10. | + | Auto | P1 | `tests/unit/lib/badges/engine.test.ts` 🆕 |
| REG-BADGE-05 | exam-high-score ≥90% | Exam at 90% | 1. Evaluate badges. | `exam-high-score` earned at exactly 90%. | + | Auto | P1 | `tests/unit/lib/badges/engine.test.ts` 🆕 |
| REG-BADGE-06 | exam-high-score boundary 89% | Exam at 89% | 1. Evaluate badges. | `exam-high-score` NOT earned below 90%. | − | Auto | P0 | `tests/unit/lib/badges/engine.test.ts` 🆕 |
| REG-BADGE-07 | exam-ace at 100% only | Exam at 100% vs 99% | 1. Evaluate at 99% then 100%. | `exam-ace` only at 100%. | − | Auto | P1 | `tests/unit/lib/badges/engine.test.ts` 🆕 |
| REG-BADGE-08 | No double-award | Badge already earned | 1. Re-evaluate after earning. | Badge not awarded twice (idempotent). | − | Auto | P0 | `tests/unit/lib/badges/engine.test.ts` 🆕 |
| REG-BADGE-09 | Trophy unlock overlay | New badge earned | 1. Earn a badge in-app. | `component.trophyUnlock.overlay` shows; `confirm` dismisses and stays in viewport. | + | Both | P1 | `tests/e2e/trophy-unlock-bulk.spec.ts` ✅ |
| REG-BADGE-10 | Star reward overlay | Reward event | 1. Trigger star reward. | `component.starReward.overlay`/`dialog` shown; confirm dismisses. | + | Both | P2 | `tests/e2e/trophy-unlock-bulk.spec.ts` ✅ |
| REG-BADGE-11 | Bulk unlock stays usable | Many badges earned at once | 1. Earn several badges simultaneously. | Overlays queue/stack without trapping the user; all dismissible. | − | Both | P1 | `tests/e2e/trophy-unlock-bulk.spec.ts` ✅ |

### Area 11 — Streak (`REG-STREAK-NN`)

`lib/streak/engine.ts`: milestones at **3 / 7 / 30** days (badge ids `streak_3` / `streak_7` / `streak_30`); same-day revisit = no-op; gap > 1 day resets to 1. Selector: `component.streakBadge.root`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-STREAK-01 | First visit sets streak=1 | No streak state | 1. Record activity once. | Streak = 1; no milestone badge. | + | Auto | P0 | `tests/unit/lib/streak/engine.test.ts` 🆕 |
| REG-STREAK-02 | Consecutive day +1 | Streak=1 yesterday | 1. Record activity today. | Streak = 2. | + | Auto | P0 | `tests/unit/lib/streak/engine.test.ts` 🆕 |
| REG-STREAK-03 | Same-day revisit no-op | Already recorded today | 1. Record activity again same day. | Streak unchanged; no new badge. | − | Auto | P0 | `tests/unit/lib/streak/engine.test.ts` 🆕 |
| REG-STREAK-04 | Gap > 1 day resets to 1 | Streak=5, last 3 days ago | 1. Record activity. | Streak resets to 1. | − | Auto | P0 | `tests/unit/lib/streak/engine.test.ts` 🆕 |
| REG-STREAK-05 | Milestone at 3 days | Streak reaches 3 | 1. Record 3rd consecutive day. | `streak_3` milestone earned. | + | Auto | P1 | `tests/unit/lib/streak/engine.test.ts` 🆕 |
| REG-STREAK-06 | Milestone at 7 / 30 | Streak reaches 7 / 30 | 1. Reach each milestone. | `streak_7` at 7, `streak_30` at 30. | + | Auto | P1 | `tests/unit/lib/streak/engine.test.ts` 🆕 |
| REG-STREAK-07 | No milestone re-award | Milestone already earned | 1. Continue past a milestone. | Milestone not re-awarded. | − | Auto | P1 | `tests/unit/lib/streak/engine.test.ts` 🆕 |
| REG-STREAK-08 | longestStreak retained on reset | Streak=10 then reset | 1. Reset via gap. | Current=1 but longest=10 retained. | − | Auto | P1 | `tests/unit/lib/streak/engine.test.ts` 🆕 |
| REG-STREAK-09 | Streak badge renders in UI | Streak active | 1. Open grade home. | `component.streakBadge.root` shows current streak. | + | Both | P2 | `tests/e2e/grade-a-lifecycle.spec.ts` ✅ |

### Area 12 — Plan Page (`REG-PLAN-NN`)

Routes: `routes.gradePlan(grade)`. Selectors: `screen.plan.*`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-PLAN-01 | Plan renders strands | At `/grade/a/plan` | 1. Open plan. | `screen.plan.root("a")` + strand rows (`screen.plan.strand(...)`). | + | Both | P1 | `tests/unit/lib/routes.test.ts` ✅ |
| REG-PLAN-02 | Overall progress shown | Some days done | 1. Inspect `screen.plan.overall`. | Overall progress reflects completed days. | + | Both | P1 | Manual-only 📝 |
| REG-PLAN-03 | Day link navigates | At plan | 1. Click `screen.plan.dayLink("a","day-1")`. | Navigates to that day overview. | + | Both | P1 | `tests/unit/lib/routes.test.ts` ✅ |
| REG-PLAN-04 | Progress updates after completion | Complete a day | 1. Complete day-1. 2. Reopen plan. | Strand/overall progress increases. | + | Both | P2 | Manual-only 📝 |
| REG-PLAN-05 | Plan for invalid grade | — | 1. Navigate to `/grade/z/plan`. | 404, no crash. | − | Both | P2 | `tests/e2e/edge-and-a11y.spec.ts` ✅ |
| REG-PLAN-06 | Plan respects RTL | At plan | 1. Inspect layout. | RTL layout intact. | − | Both | P2 | Manual-only 📝 |

### Area 13 — English Layer (`REG-ENG-NN`)

Routes: `routes.englishLevelPicker()`, `englishHome(level)`, `englishDay(...)`, `englishSection(...)`, `englishExam(level)`. Selectors: `screen.english.*`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-ENG-01 | Level picker renders | At `/english` | 1. Open `/english`. | `screen.english.levelPicker.root`; level cards visible. | + | Both | P1 | `tests/e2e/english-day-smoke.spec.ts` ✅ |
| REG-ENG-02 | Level → home | At level picker | 1. Click `levelPicker.levelCardCta("a")`. | `screen.english.home.root`; day cards visible. | + | Both | P1 | `tests/e2e/english-day-smoke.spec.ts` ✅ |
| REG-ENG-03 | Locked level hint | Higher level locked | 1. Inspect `levelPicker.levelLockedHint(level)`. | Locked hint shown for not-yet-unlocked level. | − | Both | P1 | `tests/e2e/english-exam-smoke.spec.ts` ✅ |
| REG-ENG-04 | Day end-to-end | At an English day | 1. Complete every section of Day 1. | Day completion panel; `day.completeCta` actionable. | + | Both | P0 | `tests/e2e/english-day-smoke.spec.ts` ✅ |
| REG-ENG-05 | English exercise kinds | English section | 1. Answer `letter_tiles` + `match_pairs`. | Tap-only kinds gradable; correct accepted. | + | Both | P1 | `tests/unit/lib/utils/exercise-english-kinds.test.ts` ✅ |
| REG-ENG-06 | Exam locked until all days done | Days incomplete | 1. Open English home. 2. Inspect exam card. | `english.exam.lockedNotice`; exam not startable from home. | − | Both | P0 | `tests/e2e/english-exam-smoke.spec.ts` ✅ |
| REG-ENG-07 | Exam pass (all correct) | Preview-unlocked exam | 1. Answer all correctly. 2. Finish. | `english.exam.finishPanel` shows pass. | + | Both | P0 | `tests/e2e/english-exam-smoke.spec.ts` ✅ |
| REG-ENG-08 | Exam fail → retry | Below threshold | 1. Submit failing exam. | `english.exam.retryCta` shown. | − | Both | P1 | `tests/e2e/english-exam-smoke.spec.ts` ✅ |
| REG-ENG-09 | Exam bank disjoint per level | — | 1. Build bank per level. | Each level draws only its own exercises (disjoint). | − | Auto | P1 | `tests/unit/lib/english/final-exam.test.ts` ✅ |
| REG-ENG-10 | Deterministic exam by seed | — | 1. Build with same seed twice. | Identical selection; different seed differs. | + | Auto | P2 | `tests/unit/lib/english/final-exam.test.ts` ✅ |
| REG-ENG-11 | English storage isolated from math | — | 1. Save English progress. | Uses subject-namespaced key; never touches math workbook keys. | − | Auto | P0 | `tests/unit/lib/english/storage.test.ts` ✅ |
| REG-ENG-12 | English progress round-trips | — | 1. Save then load. | State preserved; empty when nothing stored. | + | Auto | P1 | `tests/unit/lib/english/storage.test.ts` ✅ |

### Area 14 — Auth (`REG-AUTH-NN`)

`/api/auth/{login,logout,me}`, login modal, avatar dropdown, pre-login snapshot merge + server sync. Selectors: `component.auth.*`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-AUTH-01 | Login button when logged out | Not logged in | 1. Load any page. | `component.auth.loginButton` visible; avatar NOT visible. | + | Both | P1 | `tests/e2e/auth.spec.ts` ✅ |
| REG-AUTH-02 | Login modal opens | Logged out | 1. Click login button. | `component.auth.loginModal` shown with username/password inputs. | + | Both | P1 | `tests/e2e/auth.spec.ts` ✅ |
| REG-AUTH-03 | Valid login succeeds | Valid credentials | 1. Enter username/password. 2. Submit. | Modal closes; avatar (`component.auth.avatar`) appears. | + | Both | P0 | `tests/e2e/auth.spec.ts` ✅ |
| REG-AUTH-04 | Invalid login shows error | Bad credentials | 1. Enter wrong password. 2. Submit. | `component.auth.errorMessage` shown; stays logged out. | − | Both | P0 | `tests/e2e/auth.spec.ts` ✅ |
| REG-AUTH-05 | Empty credentials rejected | Logged out | 1. Submit empty form. | Submission blocked / error; no login. | − | Both | P1 | `tests/e2e/auth.spec.ts` ✅ |
| REG-AUTH-06 | Logout clears session | Logged in | 1. Open avatar dropdown. 2. Click `logoutButton`. | Returns to logged-out (login button back). | + | Both | P0 | `tests/e2e/auth.spec.ts` ✅ |
| REG-AUTH-07 | /api/auth/me 401 handled silently | Not logged in | 1. Load app while `me` returns 401. | App renders normally; no console error. | − | Both | P1 | `tests/e2e/auth-backward-compat.spec.ts` ✅ |
| REG-AUTH-08 | TopBar non-intrusive | Any page | 1. Inspect TopBar over content. | TopBar present on every page without hiding/overlapping content. | + | Both | P1 | `tests/e2e/auth-backward-compat.spec.ts` ✅ |
| REG-AUTH-09 | Pre-login snapshot merge | Local progress before login | 1. Make progress logged-out. 2. Log in. | Local snapshot merged into server progress; nothing lost. | + | Auto | P0 | `tests/unit/lib/auth/serverSync.test.ts` ✅ |
| REG-AUTH-10 | Server sync debounce | Logged in | 1. Make rapid saves. | `scheduleSync` debounces (fires once after window). | − | Auto | P1 | `tests/unit/lib/auth/serverSync.test.ts` ✅ |
| REG-AUTH-11 | localStorage write unchanged by sync | Logged in | 1. Save progress. | Still writes to localStorage; sync added but storage behavior unchanged. | − | Auto | P0 | `tests/unit/lib/auth/storageBackwardCompat.test.ts` ✅ |

### Area 15 — Admin (`REG-ADMIN-NN`)

`/admin/progress` (PIN, mark/reset day+section, mark-all, force-final-exam, TTS toggle), `/admin/users` (CRUD, change password). Selectors: `screen.adminProgress.*`, `component.adminUsers.*`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-ADMIN-01 | PIN gate blocks access | At `/admin/progress` | 1. Load page without PIN. | Content hidden behind `adminProgress.pinInput`/`pinSubmit`. | − | Both | P0 | `tests/e2e/admin-progress.spec.ts` ✅ |
| REG-ADMIN-02 | Wrong PIN rejected | At PIN gate | 1. Enter wrong PIN. 2. Submit. | `adminProgress.pinError` shown; not unlocked. | − | Both | P0 | `tests/e2e/admin-progress.spec.ts` ✅ |
| REG-ADMIN-03 | Correct PIN unlocks | At PIN gate | 1. Enter correct PIN. 2. Submit. | Admin progress UI revealed. | + | Both | P0 | `tests/e2e/admin-progress.spec.ts` ✅ |
| REG-ADMIN-04 | Mark day complete | Unlocked admin | 1. Click `markComplete(grade,dayId)`. | Day shows complete; `statusMessage` confirms. | + | Both | P1 | `tests/e2e/admin-progress.spec.ts` ✅ |
| REG-ADMIN-05 | Reset day requires confirm | Unlocked admin | 1. Click `reset(...)`. 2. Click `resetConfirm(...)`. | Day reset only after confirm. | − | Both | P1 | `tests/e2e/admin-progress.spec.ts` ✅ |
| REG-ADMIN-06 | Reset cancel aborts | Reset prompt open | 1. Click `reset(...)`. 2. Click `resetCancel(...)`. | No reset performed. | − | Both | P1 | `tests/e2e/admin-progress.spec.ts` ✅ |
| REG-ADMIN-07 | Grade isolation preserved | Two grades with data | 1. Modify grade A. 2. Inspect grade B. | Grade B progress untouched. | − | Both | P0 | `tests/e2e/admin-progress.spec.ts` ✅ |
| REG-ADMIN-08 | Force final exam complete | Unlocked admin | 1. Click `forceFinalExamComplete(grade)`. | Produces a passed exam state (100%, full correctMap). | + | Both | P1 | `tests/unit/lib/admin/forcedFinalExam.test.ts` ✅ |
| REG-ADMIN-09 | Reset final-exam day cascades | Day-29/final | 1. Reset the final-exam day. | Clears final-exam + GMAT storage. | − | Auto | P1 | `tests/unit/lib/admin/resetDayProgress.test.ts` ✅ |
| REG-ADMIN-10 | Add user success | At `/admin/users` | 1. Fill add form. 2. Submit. | New user appears in list. | + | Both | P1 | `tests/e2e/admin-users.spec.ts` ✅ |
| REG-ADMIN-11 | Duplicate / invalid user rejected | At add form | 1. Add a duplicate username (or empty). | Error; user not created. | − | Both | P0 | `tests/e2e/admin-users.spec.ts` ✅ |
| REG-ADMIN-12 | Change password / delete confirm | Existing user | 1. Change password (success). 2. Delete with confirm; also test cancel. | Password change confirmed; delete only after confirm, cancel aborts. | + | Both | P1 | `tests/e2e/admin-users.spec.ts` ✅ |

### Area 16 — TTS / Voice (`REG-TTS-NN`)

Student + admin TTS toggles, Hebrew normalization (`normalizeTextForHebrewTts`). Selectors: `component.topBar.studentTtsToggle`, `screen.adminProgress.ttsToggle`, `component.exerciseBox.tts`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-TTS-01 | Student toggle visible when admin TTS on | Admin TTS enabled (default) | 1. Load page. | `component.topBar.studentTts.toggle` visible. | + | Both | P1 | `tests/e2e/tts-accessibility.spec.ts` ✅ |
| REG-TTS-02 | Toggle defaults OFF | Fresh state | 1. Inspect toggle. | Student TTS OFF by default. | − | Both | P1 | `tests/e2e/tts-accessibility.spec.ts` ✅ |
| REG-TTS-03 | Toggle switches ON | Toggle OFF | 1. Click toggle. | State becomes ON. | + | Both | P1 | `tests/e2e/tts-accessibility.spec.ts` ✅ |
| REG-TTS-04 | ON persists across navigation | Toggle ON | 1. Navigate to another page. | ON state persists within session. | + | Both | P1 | `tests/e2e/tts-accessibility.spec.ts` ✅ |
| REG-TTS-05 | Exercise prompt TTS speaks normalized text | TTS ON | 1. Click `exerciseBox.tts(exId)`. | Speech invoked with Hebrew-normalized text (symbols/comparisons voiced). | + | Both | P1 | `tests/unit/lib/utils/exercisePromptSpeakText.test.ts` ✅ |
| REG-TTS-06 | Admin TTS toggle hides student toggle | Admin TTS disabled | 1. In admin, set `adminProgress.ttsToggle` off. | Student toggle not offered when admin TTS disabled. | − | Both | P1 | `tests/unit/lib/admin/prefs.test.ts` ✅ |
| REG-TTS-07 | Hebrew normalization of symbols | — | 1. Normalize `>`/`<`/`=`/`+`/`-`. | Symbols converted to spoken Hebrew correctly. | − | Auto | P1 | `tests/unit/lib/tts/engine.test.ts` ✅ |
| REG-TTS-08 | Audio manifest integrity | — | 1. Validate manifest. | Manifest entries valid; no missing/dup refs. | + | Auto | P2 | `tests/unit/lib/tts/audioManifest.test.ts` ✅ |

### Area 17 — Storage & Backward-Compat (`REG-STORAGE-NN`)

Keys prefixed `kids_math.*`; legacy → per-grade migration (`lib/progress/storage.ts`); `component.ui.storageErrorBoundary`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-STORAGE-01 | Progress round-trips | — | 1. Save then load progress. | Identical state restored. | + | Auto | P0 | `tests/unit/lib/progress/storage.test.ts` ✅ |
| REG-STORAGE-02 | Legacy → per-grade migration | Legacy-format key present | 1. Seed legacy state. 2. Load. | Migrated to per-grade keys; no data lost. | + | Auto | P0 | `tests/unit/lib/progress/storage.test.ts` ✅ |
| REG-STORAGE-03 | Corrupt JSON does not wipe / crash | Malformed value at a `kids_math.*` key | 1. Set malformed JSON. 2. Load app. | Either safe default or StorageErrorBoundary; never a silent wipe of valid data, never a hard crash. | − | Both | P0 | `tests/unit/lib/progress/storage.test.ts` ✅ |
| REG-STORAGE-04 | StorageErrorBoundary renders | Unrecoverable storage error | 1. Force a storage read error. | `component.ui.storageErrorBoundary.root` shows with reset CTA. | − | Both | P0 | `tests/e2e/edge-and-a11y.spec.ts` ✅ |
| REG-STORAGE-05 | Reset CTA recovers | At StorageErrorBoundary | 1. Click `storageErrorBoundary.cta.reset`. | Storage cleared/repaired; app returns to usable state. | + | Both | P1 | Manual-only 📝 |
| REG-STORAGE-06 | localStorage throws → graceful | Storage access throws | 1. Simulate `localStorage` throwing. | Reads return safe defaults (e.g. cookie-consent false), no crash. | − | Auto | P1 | `tests/unit/lib/cookieConsent/storage.test.ts` ✅ |
| REG-STORAGE-07 | Review storage round-trips | — | 1. Save/load review (weak-spot) state. | Preserved; selection deterministic. | + | Auto | P1 | `tests/unit/lib/review/storage.test.ts` ✅ |
| REG-STORAGE-08 | Sync does not alter storage shape | Logged in saves | 1. Save with sync registered. | localStorage shape unchanged vs. logged-out. | − | Auto | P0 | `tests/unit/lib/auth/storageBackwardCompat.test.ts` ✅ |
| REG-STORAGE-09 | English keys never collide with math | Both subjects used | 1. Use both. 2. Inspect keys. | Distinct namespaced keys; no cross-write. | − | Auto | P0 | `tests/unit/lib/english/storage.test.ts` ✅ |

### Area 18 — Legal & Consent (`REG-LEGAL-NN`)

`/privacy`, `/cookies`, cookie-consent banner, site footer. Selectors: `screen.privacy.*`, `screen.cookies.*`, `layout.cookieConsent.*`, `layout.siteFooter.*`.

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-LEGAL-01 | Privacy page renders | — | 1. Open `/privacy`. | `screen.privacy.root` visible. | + | Both | P1 | `tests/e2e/legal-pages.spec.ts` ✅ |
| REG-LEGAL-02 | Cookies page renders | — | 1. Open `/cookies`. | `screen.cookies.root` visible. | + | Both | P1 | `tests/e2e/legal-pages.spec.ts` ✅ |
| REG-LEGAL-03 | Footer links navigate | At home | 1. Click footer privacy/cookies links. | Navigate to the legal pages. | + | Both | P1 | `tests/e2e/legal-pages.spec.ts` ✅ |
| REG-LEGAL-04 | Consent banner appears then dismisses | Fresh state | 1. Load app (banner shows). 2. Accept. 3. Reload. | `layout.cookieConsent.root` shown first time; stays dismissed after reload. | + | Both | P1 | `tests/e2e/legal-pages.spec.ts` ✅ |
| REG-LEGAL-05 | Consent persists across storage error | Storage throws | 1. Force storage error before consent read. | Defaults to not-accepted; no crash. | − | Auto | P2 | `tests/unit/lib/cookieConsent/storage.test.ts` ✅ |
| REG-LEGAL-06 | Legal nav back | At `/privacy` | 1. Click `screen.privacy.navBack`. | Returns to prior screen. | − | Both | P2 | `tests/e2e/legal-pages.spec.ts` ✅ |

### Area 19 — Cross-Cutting: RTL / a11y / routes / preview (`REG-XCUT-NN`)

| ID | Title | Pre-conditions | Steps | Expected result | +/− | Type | Priority | Automated spec |
|----|-------|----------------|-------|-----------------|-----|------|----------|----------------|
| REG-XCUT-01 | Document is RTL globally | Any page | 1. Inspect `<html>`. | `lang="he" dir="rtl"`. | + | Both | P0 | `tests/e2e/edge-and-a11y.spec.ts` ✅ |
| REG-XCUT-02 | Math inputs are LTR | Section with number_input | 1. Inspect the number input. | `dir="ltr"` on the input only. | + | Both | P0 | `tests/e2e/edge-and-a11y.spec.ts` ✅ |
| REG-XCUT-03 | Keyboard navigation works | Any interactive screen | 1. Tab through controls; Enter to activate. | Focus order sensible; controls reachable/activatable. | + | Both | P1 | `tests/e2e/edge-and-a11y.spec.ts` ✅ |
| REG-XCUT-04 | Route builders preserve preview | `?previewAll=1` | 1. Navigate via CTAs. | `previewAll` preserved across builders. | + | Auto | P1 | `tests/unit/lib/routes.test.ts` ✅ |
| REG-XCUT-05 | Route builders attach grade query | Route with grade | 1. Build a route with grade opt. | `grade` query appended correctly. | + | Auto | P2 | `tests/unit/lib/routes.test.ts` ✅ |
| REG-XCUT-06 | Invalid grade param 404 | — | 1. Navigate to `/grade/z`. | 404, no crash. | − | Both | P1 | `tests/e2e/edge-and-a11y.spec.ts` ✅ |
| REG-XCUT-07 | Invalid day format 404 | — | 1. Navigate to malformed day path. | 404, no crash. | − | Both | P1 | `tests/e2e/edge-and-a11y.spec.ts` ✅ |
| REG-XCUT-08 | Persistence basics (RTL) | Mid-flow | 1. Make progress. 2. Refresh. | State persists; layout stays RTL. | + | Both | P1 | `tests/e2e/edge-and-a11y.spec.ts` ✅ |
| REG-XCUT-09 | Visual smoke: no console errors | All key screens | 1. Visit each key screen. 2. Capture screenshot. 3. Listen for `console.error`/`pageerror`. | Every key screen renders root testId; zero console/page errors. | − | Auto | P1 | `tests/e2e/visual-smoke.spec.ts` 🆕 |
| REG-XCUT-10 | Monkey / fuzz invariants hold | Seeded random walk | 1. Run seeded random actions (adversarial inputs, random clicks, corrupt localStorage injection, back/forward). | No uncaught exception, no `console.error`, body stays interactive, `dir="rtl"` preserved, no silent progress wipe; StorageErrorBoundary is an acceptable graceful state. | − | Manual | P2 | Manual-only (ad-hoc exploratory; see `docs/REGRESSION_FINDINGS.md`) |

---

## 5. Negative-Case Coverage Index

The negative cases from the plan are woven into the areas above. Quick index:

| Negative concern | Case ID(s) |
|------------------|-----------|
| Exercise: empty submit | REG-EX-08 |
| Exercise: non-numeric / decimal entry | REG-EX-09, REG-EX-10 |
| Exercise: wrong answer → retry | REG-EX-11, REG-EX-12 |
| Exercise: no free-text input allowed | REG-EX-14 |
| Final exam: finish disabled until 30 answered | REG-FINALEXAM-02 |
| Final exam: 83% fails / 87% passes (boundary) | REG-FINALEXAM-04, REG-FINALEXAM-05 |
| Final exam: Grade-A pass unlocks B; B pass no further unlock | REG-FINALEXAM-07, REG-FINALEXAM-08 |
| Gate: direct `/grade/b/...` without cookie → locked | REG-GRADEB-01, REG-GRADEB-02, REG-HOME-07, REG-GRADEPICK-04 |
| Gate: junk cookie value treated as locked | REG-GRADEB-04 |
| Auth: invalid login / empty credentials | REG-AUTH-04, REG-AUTH-05 |
| Admin: wrong PIN | REG-ADMIN-02 |
| Admin: duplicate / invalid username | REG-ADMIN-11 |
| Admin: delete-confirm cancel | REG-ADMIN-06, REG-ADMIN-12 |
| Streak: gap > 1 day resets to 1 | REG-STREAK-04 |
| Streak: same-day revisit no-op | REG-STREAK-03 |
| Badges: threshold boundaries / no double-award | REG-BADGE-03, REG-BADGE-06, REG-BADGE-07, REG-BADGE-08 |
| Storage: corrupt/legacy → migrate or boundary, never wipe/crash | REG-STORAGE-02, REG-STORAGE-03, REG-STORAGE-04 |
| RTL: page rtl, math input ltr | REG-XCUT-01, REG-XCUT-02, REG-SECTION-08 |

---

## 6. Traceability Appendix — Existing Specs → Plan IDs

Every existing `tests/**` spec mapped to the plan IDs it satisfies. 🆕 marks plan IDs that require a **new** spec (not yet in the repo).

### E2E specs

| Spec | Plan IDs covered |
|------|------------------|
| `tests/e2e/subject-picker.spec.ts` | REG-SUBJECT-01/02/03/04, REG-GRADEPICK-01/03 |
| `tests/e2e/grade-a-lifecycle.spec.ts` | REG-GRADEPICK-02, REG-HOME-01/06, REG-SECTION-02/03/05/06, REG-FINALEXAM-03/06/07, REG-GRADEB-07, REG-STREAK-09 |
| `tests/e2e/grade-b.spec.ts` | REG-GRADEB-02/03/04/05 |
| `tests/e2e/grade-b-lifecycle.spec.ts` | REG-FINALEXAM-08, (B day persistence) |
| `tests/e2e/day-smoke.spec.ts` | REG-HOME-02, REG-DAYOV-01/02/04, REG-SECTION-01, REG-EX-01/02/13 |
| `tests/e2e/all-days-completion.spec.ts` | REG-DAYOV-06/07 |
| `tests/e2e/spiral-review.spec.ts` | REG-DAYOV-08, REG-SECTION-04 |
| `tests/e2e/gmat-challenge.spec.ts` | REG-HOME-05, REG-FINALEXAM-11, REG-GMAT-01/02/03/04/05/06 |
| `tests/e2e/trophy-unlock-bulk.spec.ts` | REG-HOME-04, REG-BADGE-01/09/10/11 |
| `tests/e2e/auth.spec.ts` | REG-AUTH-01/02/03/04/05/06 |
| `tests/e2e/auth-backward-compat.spec.ts` | REG-AUTH-07/08 |
| `tests/e2e/admin-progress.spec.ts` | REG-ADMIN-01/02/03/04/05/06/07 |
| `tests/e2e/admin-users.spec.ts` | REG-ADMIN-10/11/12 |
| `tests/e2e/tts-accessibility.spec.ts` | REG-DAYOV-05, REG-TTS-01/02/03/04 |
| `tests/e2e/legal-pages.spec.ts` | REG-LEGAL-01/02/03/04/06 |
| `tests/e2e/edge-and-a11y.spec.ts` | REG-SUBJECT-05/06, REG-GRADEPICK-05, REG-HOME-08, REG-SECTION-07/08, REG-PLAN-05, REG-STORAGE-04, REG-XCUT-01/02/03/06/07/08 |
| `tests/e2e/english-day-smoke.spec.ts` | REG-ENG-01/02/04 |
| `tests/e2e/english-exam-smoke.spec.ts` | REG-ENG-03/06/07/08 |
| `tests/e2e/grade-b-gate.spec.ts` 🆕 | REG-GRADEPICK-04, REG-HOME-07, REG-GRADEB-01/06/08/09 |
| `tests/e2e/exercise-negative.spec.ts` 🆕 | REG-EX-08/09/11/12 |
| `tests/e2e/visual-smoke.spec.ts` 🆕 | REG-XCUT-09 |

### Unit specs

| Spec | Plan IDs covered |
|------|------------------|
| `tests/unit/lib/routes.test.ts` | REG-GRADEPICK-06, REG-HOME-03, REG-PLAN-01/03, REG-XCUT-04/05 |
| `tests/unit/lib/final-exam/grading.test.ts` | REG-FINALEXAM-02/04/05 |
| `tests/unit/lib/final-exam/picker.test.ts` | REG-FINALEXAM-01 |
| `tests/unit/lib/final-exam/storage.test.ts` | REG-FINALEXAM-09/10 |
| `tests/unit/lib/gmat-challenge/grading.test.ts` | REG-GMAT-07 |
| `tests/unit/lib/gmat-challenge/classifier.test.ts` | REG-GMAT-08 |
| `tests/unit/lib/gmat-challenge/storage.test.ts` | REG-GMAT-09 |
| `tests/unit/lib/gmat-challenge/picker.test.ts` | (GMAT item selection — supports REG-GMAT-04) |
| `tests/unit/lib/utils/exercise.test.ts` | REG-EX-03/04/05 |
| `tests/unit/lib/utils/exercise-english-kinds.test.ts` | REG-EX-06/07, REG-ENG-05 |
| `tests/unit/lib/utils/exerciseMathPolicy.test.ts` | REG-EX-10/14 |
| `tests/unit/lib/utils/exercisePromptSpeakText.test.ts` | REG-TTS-05 |
| `tests/unit/lib/tts/engine.test.ts` | REG-TTS-07 |
| `tests/unit/lib/tts/audioManifest.test.ts` | REG-TTS-08 |
| `tests/unit/lib/admin/prefs.test.ts` | REG-TTS-06 |
| `tests/unit/lib/admin/forcedFinalExam.test.ts` | REG-ADMIN-08 |
| `tests/unit/lib/admin/resetDayProgress.test.ts` | REG-ADMIN-09 |
| `tests/unit/lib/auth/serverSync.test.ts` | REG-AUTH-09/10 |
| `tests/unit/lib/auth/storageBackwardCompat.test.ts` | REG-AUTH-11, REG-STORAGE-08 |
| `tests/unit/lib/progress/storage.test.ts` | REG-STORAGE-01/02/03 |
| `tests/unit/lib/progress/engine.test.ts` | (progress derivation — supports REG-SECTION/REG-DAYOV completion) |
| `tests/unit/lib/review/storage.test.ts` | REG-STORAGE-07 |
| `tests/unit/lib/review/engine.test.ts`, `select.test.ts` | (spiral-review selection — supports REG-SECTION-04) |
| `tests/unit/lib/cookieConsent/storage.test.ts` | REG-STORAGE-06, REG-LEGAL-05 |
| `tests/unit/lib/english/storage.test.ts` | REG-ENG-11/12, REG-STORAGE-09 |
| `tests/unit/lib/english/final-exam.test.ts` | REG-ENG-09/10 |
| `tests/unit/lib/streak/engine.test.ts` 🆕 | REG-STREAK-01/02/03/04/05/06/07/08 |
| `tests/unit/lib/badges/engine.test.ts` 🆕 | REG-BADGE-02/03/04/05/06/07/08 |

### Uncovered plan IDs (🆕 / Manual-only)

| Plan ID | Status |
|---------|--------|
| REG-GRADEB-10 | Manual-only 📝 |
| REG-PLAN-02/04/06 | Manual-only 📝 |
| REG-STORAGE-05 | Manual-only 📝 |
| REG-BADGE-02/03/04/05/06/07/08 | 🆕 `tests/unit/lib/badges/engine.test.ts` |
| REG-STREAK-01..08 | 🆕 `tests/unit/lib/streak/engine.test.ts` |
| REG-GRADEB-01/06/08/09, REG-HOME-07, REG-GRADEPICK-04 | 🆕 `tests/e2e/grade-b-gate.spec.ts` |
| REG-EX-08/09/11/12 | 🆕 `tests/e2e/exercise-negative.spec.ts` |
| REG-XCUT-09 | 🆕 `tests/e2e/visual-smoke.spec.ts` |
| REG-XCUT-10 | 📝 Manual-only (ad-hoc exploratory) |

---

## 7. Notes on Content & Voice Regression

Educational-content accuracy and spoken-content (TTS) correctness are continuously guarded by existing specs and the audit script — this plan **references** them as regression areas rather than re-authoring content checks:

- Content validity / curriculum shape: `tests/unit/lib/content/content-validity.test.ts`, `day-concepts.test.ts`, `english-content-validity.test.ts`, `day-10-place-value.test.ts`.
- Teaching primer copy & speak-text: `teaching-primer-content.test.ts`, `buildDayPrimerSpeakText.test.ts`, `workedExampleSpeakText.test.ts`.
- AI content-accuracy audit: `scripts/audit-content-accuracy.mjs` (word-problem / distractor / syllabus-fit checks the deterministic suite cannot catch).

When adding or editing exercises/day content or any read-aloud text, run the content-accuracy and voice review per `AGENTS.md → Educational Content Changes` in addition to this regression suite.
