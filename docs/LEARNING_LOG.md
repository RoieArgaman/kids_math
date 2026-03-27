# Learning Log (kids_math)

Append-only record of what we learned while working on this repo.

## Unreleased

- (Add new entries here. Prefer short, concrete notes.)

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

