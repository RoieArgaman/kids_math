# Learning Log (kids_math)

Append-only record of what we learned while working on this repo.

## Unreleased

- (Add new entries here. Prefer short, concrete notes.)

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

