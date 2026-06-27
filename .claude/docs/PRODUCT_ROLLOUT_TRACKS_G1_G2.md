## Goal

Turn international best-practice pedagogy into concrete product changes for kids_math (Grades 1–2), while staying aligned with Israel MoE.

## Track A — Practice-only (minimal UX change, fastest ROI)

**What we change**
- **Sequencing**: build micro-sequences with variation/invariance inside existing day sections.
- **Hints/feedback**: strategy-based, keyed by `skillTags` + `representation`.
- **CPA ramp**: ensure important ideas show up as concrete → pictorial → abstract within a day or across days.

**Why it fits this repo**
- Uses existing data model (`SkillTag`, `RepresentationType`) and content generator (`lib/content/days.ts`).
- Minimal UI additions; most impact comes from better tasks + better hinting.

**What we will implement as MVP**
- Upgrade hint generator in `lib/utils/exercise.ts` to:
  - suggest a **strategy** (make-10, doubles, decomposition, number line) based on `skillTags`
  - suggest a **representation move** (use objects / draw / write equation) based on `representation`
- Add unit tests for the hinting behavior.

## Track B — Micro-lessons + practice (more instruction, still light)

**What we change**
- Use `Section.example: WorkedExample` to present a 60–120s “worked example” before a cluster.
- Add 1–2 “strategy comparison” checks per day (Japan/US inspired).

**Risk**
- Requires UI support for displaying `WorkedExample` consistently and accessibly (RTL + low reading load).

## Track C — Parent/teacher layer (measurement + guidance)

**What we change**
- Skill-tag dashboard, misconceptions, spaced review recommendations.
- Optional offline manipulative suggestions.

**Risk**
- More surfaces, more product decisions; better as a second phase after Track A shows measurable gains.

## Recommendation (phased rollout)

1. **Ship Track A MVP** (hints + variation sequencing) and measure error patterns by `SkillTag`.
2. Add **select Track B** pieces only where learners plateau (e.g., place value, word problems).
3. Consider Track C once we have stable signals and a clear parent/teacher use-case.

