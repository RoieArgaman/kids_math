## Source documents

- **Grade 1 (כיתה א׳)**: MoE syllabus PDF downloaded to `tmp/moe/kita1.pdf` (original URL: `https://meyda.education.gov.il/files/Tochniyot_Limudim/Math/Yesodi/kita1_1204762245.pdf`).
- **Grade 2 (כיתה ב׳)**: MoE syllabus PDF downloaded to `tmp/moe/kita2.pdf` (original URL: `https://meyda.education.gov.il/files/mazkirut_pedagogit/matematika/tochnyotlemud/kita2.pdf`).
- **General (א׳–ו׳)**: MoE overview PDF downloaded to `tmp/moe/mavo1.pdf` (original URL: `https://meyda.education.gov.il/files/Tochniyot_Limudim/Math/Yesodi/mavo1.pdf`).

This doc maps the MoE expectations for Grades 1–2 into the app’s existing `SkillTag` taxonomy (`lib/types.ts`).

## Grade 1 (כיתה א׳) → `SkillTag` mapping

### Numbers (1–100)

- **Counting / counting-on / skip counting** → `counting`
  - Includes: counting to 50, counting forward to 100, skip-counting by 2/5/10.
- **Number recognition, reading/writing numbers** → `number-recognition`
- **Compare & order** → `comparing`
  - Includes: “who is bigger/smaller”, between, before/after, inequality signs.
- **Number line (introduce & complete missing ticks)** → `number-line`
- **Units/tens language (intro terms)** → `place-value`
  - MoE explicitly expects learners to know the terms יחידות/עשרות by end of Grade 1.
- **Even/odd (concrete pairing intuition; no need to formalize 0)** → `comparing` (and optionally `counting`)

### Operations (focus: +/−, intro ×/÷)

- **Addition** → `addition`
- **Subtraction** → `subtraction`
- **Fluency (facts within 10)** → `addition`, `subtraction`
- **Number bonds / “make 10” decompositions** → `number-bonds`
- **Word problems (single-step +/−, money/time contexts; emphasize method not only answer)** → `word-problems`
- **Intro multiplication/division as repeated addition & equal groups up to 20** → `multiplication-intro`, `division-equal-groups`

### Measurement & geometry

- **Length / time (whole hours)** → `measurement-length`, `measurement-time`
- **Polygons & quadrilaterals (triangle/rectangle/square identification)** → `geometry-shapes`
- **Translations / reflections (intuitive, manipulatives)** → `symmetry-transform`

## Grade 2 (כיתה ב׳) → `SkillTag` mapping

### Numbers (1–1,000)

- **Counting & skip counting (units/tens/hundreds; start from non-1)** → `counting`
- **Reading/writing & place value (units/tens/hundreds; 0 as placeholder)** → `place-value`, `number-recognition`
- **Order/compare in 2–3 digit numbers** → `comparing`
- **Money contexts (ways to pay / give change)** → `money-shekel`

### Operations (within 100+, mastery progression)

- **Addition** (incl. mental strategies + place-value grounding) → `addition`, `place-value`
- **Subtraction** → `subtraction`, `place-value`
- **Fluency** (automatic facts: addition table up to 9+9; tens addition to 100) → `addition`, `subtraction`
- **Word problems** (single- and multi-step; emphasize structure not trigger words; comparison problems) → `word-problems`
- **Multiplication/division meaning + tables (mastery to 6×6; extension to 10×10)** → `multiplication-intro`, `multiplication-tables`, `division-equal-groups`
- **Divisibility (2/5/10) as patterns in times tables** → `multiplication-tables`
- **Parentheses (only as order control; formal order of ops later in Grade 3)** → (no dedicated `SkillTag` today; can be tracked under `addition`/`subtraction`/`multiplication-intro` as a meta-skill)

### Expanded number domain

- **Number line (incl. negatives as real-life examples: temps/debt/floors; still intuitive)** → `number-line`
- **Fractions (half/quarter as part of a whole and part of a quantity; symbols optional)** → `fractions-parts`

### Data investigation (Grade 2 begins “חקר נתונים”)

- **Collect/sort/represent data; bar charts with unit squares; discuss findings** → `patterns` (closest existing tag)
  - If this becomes a major pillar, consider adding a dedicated `SkillTag` (e.g. `data-investigation`) later, but keep additive-only.

### Measurement & geometry

- **Length with cm/m; area by covering; perimeter by counting units; distinguish area vs perimeter** → `measurement-length`, `measurement-area`
- **Weight experiments and non-standard units** → `measurement-weight`
- **Time (half/quarter hours; duration across 12)** → `measurement-time`
- **3D solids (cube/box/cylinder/pyramid/cone/sphere; faces/edges/vertices)** → `geometry-solids`
- **Reflection/translation (intuitive comparison)** → `symmetry-transform`

## Gaps / mismatches to watch in the app

- **Grade 2 data investigation** is not currently a first-class `SkillTag` (we map to `patterns` for now).
- **Parentheses / order control** similarly lacks a dedicated tag; may be okay to keep embedded.

