# Teaching primer guidelines (kids_math)

Authoring and QA for **לִפְנֵי שֶׁמַּתְחִילִים** on the day overview and Hebrew TTS.

## Sources

- Canonical copy: [`lib/content/teachingPrimerCatalog.ts`](../lib/content/teachingPrimerCatalog.ts) (merged in `buildDayFromConcepts` per grade).
- Optional overrides: `teachingSummary` / `teachingSteps` on `DayConcept` in `lib/content/grade-*/day-*.ts`.
- Pedagogy: [`docs/PEDAGOGY_BENCHMARK_G1_G2.md`](PEDAGOGY_BENCHMARK_G1_G2.md), [`docs/MOE_GRADE_A_B_SKILLTAG_MAP.md`](MOE_GRADE_A_B_SKILLTAG_MAP.md).

## עברית תקנית ופשוטה

1. **משפטים קצרים** — פעולה אחת בכל צעד; פועל ברור («סופרים», «קוראים», «בודקים»).
2. **עברית מדוברת** — לא כותרת לימודית בתוך משפט (לא «בְּמוֹנִים» אלא «לִסְפֹּר» / «בְּסְפִירָה»).
3. **ניסוח לילדים** — «נַעֲשֶׂה לְאִטּוֹ, בְּלִי לַחֲץ» (לא «נַעֲבֹד בְּבִטְחוֹנוּת»).
4. **בלי מילים מופשטות** בכיתה א׳ מוקדמת: «רַעֲיוֹן», «אֶסְטְרָטֶגְיָה».
5. **התאמה ליום** — רמזים רק לפי תרגילי אותו יום (`mainTags`, דוגמה במקטע 2).
6. **ניקוד מלא** — כמו בשאר התוכן.
7. **TTS** — לקרוא בקול אחרי כל שינוי.

| לא לכתוב | עדיף |
|----------|------|
| הַתְּשׁוּבָה נִשְׁמַעַת נָכוֹן | הַתְּשׁוּבָה נְכוֹנָה / זֶה מַסְתַּדֵּר |
| נִתְרַגֵּל בְּמוֹנִים | נִתְרַגֵּל לִסְפֹּר |
| מַזְכִּירִים אֶת רַעֲיוֹן הַיּוֹם (כיתה א׳ מוקדמת) | מַסְתַּכְּלִים / קוֹדְמִים מְבִינִים |
| אותם 3 צעדים בכל יום | צעדים שונים לפי נושא היום |

אוטומציה: `lib/content/teachingPrimerHebrewLint.ts` (ביטויים אסורים + כפילות צעדים).

## Author workflow

1. Read the day `title`, `objective`, and built section 2 `learningGoal` / worked example.
2. Edit **only** [`lib/content/teachingPrimerCatalog.ts`](../lib/content/teachingPrimerCatalog.ts) for that grade + `dayNumber`.
3. Keep one idea per step; spoken Hebrew a child would hear.
4. Tap the speaker on the day hub; listen in Safari and Chrome.

## Grade bands

| Band | Days | Tone |
|------|------|------|
| Early | 1–7 | Very short; concrete verbs |
| Mid | 8–14 | Name the day skill once |
| Late | 15–28 | Strategy hints only if exercises use them |
| Exam | 29 | Calm; no rushing |

Grade ב׳ allows slightly longer summaries than א׳ (see `lib/content/teachingPrimerLimits.ts`).

## TTS

- Student-facing speech uses **child profile** (`CHILD_TTS_RATE` in `lib/tts/constants.ts`).
- Primer audio is **chunked** (summary, then each step with a short pause).
- Display text is not changed for TTS bridges (`עַכְשָׁיו,` is speak-only for step 2+).

### TTS verification (manual)

| Surface | Where |
|---------|--------|
| Primer | Grade A + B — days 1, 8, 15, 29 |
| Exercise | Section screen — one number + one multiple choice per grade |
| Browsers | Safari + Chrome |

Enable TTS: `kids_math.admin_prefs.v1` → `{ "ttsEnabled": true }`.

## Quality (mandatory when editing primer or TTS)

```bash
npm run test:unit -- tests/unit/lib/content/teaching-primer-content.test.ts
npm run test:unit -- tests/unit/lib/content/buildDayPrimerSpeakText.test.ts
npm run test:unit -- tests/unit/lib/tts/engine.test.ts
npm run test:unit -- tests/unit/lib/content/content-validity.test.ts
npm run test:e2e -- tests/e2e/day-smoke.spec.ts
npm run test:e2e -- tests/e2e/grade-b-lifecycle.spec.ts
npm run check:testids
npm run test:qa
```
