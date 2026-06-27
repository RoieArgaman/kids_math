# English Curriculum (English-for-Hebrew-speakers)

> Status: brought to parity with Math — **two CEFR-aligned levels** (כיתות-style),
> ~28 learning days + a final exam per level.

## Structure — two levels, like Math's grades (כיתות)

English mirrors Math's grade structure:

- `/english` is a **level picker** (שלב א׳ · Pre-A1 / שלב ב׳ · A1) — the analog of the
  grade picker at `/math`.
- Each level has its **own home** at `/english/[level]` (`a`/`b`) showing only its
  lessons, its **own final exam** at `/english/[level]/exam`, and Level B is **locked
  until Level A's exam is passed** (client-side gate; `?previewAll=1` bypasses it).
- Levels reuse the shared `GradeId` axis (`a`/`b`). Lessons are numbered continuously
  (Level A = 1–14, Level B = 15–28) with **disjoint day IDs**, so learner progress
  lives in a **single isolated store** (`kids_math.english.workbook_progress.v1`) yet
  stays effectively separate per level. Only the **final-exam** state is keyed per
  level (`kids_math.english.final_exam.v1.level.{a|b}`; the legacy single key migrates
  to Level A).

## Why this exists

English used to be 7 vocabulary-only days (listen-and-pick), with no alphabet,
phonics, reading, or grammar. This curriculum extends it to a real beginner program a
young Hebrew-speaking child can complete on their own: **listening → the alphabet →
phonics/decoding → reading → grammar → reading comprehension** — without ever typing.

## How other countries teach a foreign language (the research we applied)

- **CEFR** (Council of Europe; the framework Israel's MoE and most of Europe use for
  primary EFL): **Level A = Pre-A1**, **Level B = A1**. Tiny, concrete, high-frequency
  goals.
- **Oral/aural before print** (comprehensible input — Krashen; standard in primary
  EFL): children hear and understand words *first*, then map them to letters. That is
  why the 7 original oral-vocabulary days stay first and **phonics begins after them**.
- **Systematic synthetic phonics** (UK "Letters & Sounds"): teach letter names and
  sounds explicitly, then **blend** them into CVC words (cat, dog, sun).
- **High-frequency sight words** (Dolch/Fry): the, a, I, you, is, like, see…
- **Spiral review** (spaced repetition / Leitner): earlier words and letters keep
  reappearing in later warmups and reviews; the app's review engine reinforces this.

## Designed to NOT be frustrating

- **Tap-only** — listen-and-pick, build-a-word from letter tiles, and match pairs.
  **No typing, ever** (product constraint: numbers/taps only, no free-text input).
- **Audio on every item** (English TTS), so a non-reader can always hear the target.
- Short sections (4–7 items), generous retries, immediate feedback, gentle gating.
- Confidence-building review days at the end of each level.

### Phonics + TTS caveat (important for authors)
Browser text-to-speech reliably speaks **letter names** (and whole words), **not**
isolated phonemes. So phonics is taught via **letter-name recognition** and
**initial-sound-of-a-word** ("which letter does *ball* start with?") — never by asking
the device to pronounce an isolated /b/.

## No new exercise types were needed

Every reading/grammar skill maps onto the 5 existing tap-only exercise kinds:

| Skill | Exercise kind | How |
|-------|---------------|-----|
| Letter recognition / initial sound | `listen_choose` (`optionsLang:"en"`) | hear a letter-name or word, pick the letter |
| Decoding / spelling | `letter_tiles` | hear a word, build it from tiles |
| Read a word / sentence | `multiple_choice` | English text in the prompt, Hebrew-meaning options |
| Grammar (a/an, plurals, this/that, pronouns, to-be, can, like, prepositions, adjectives) | `multiple_choice` / `match_pairs` / `true_false` | pick the grammatical phrase / match / judge |

Reading-comprehension prompts put the English sentence inside the (RTL) Hebrew prompt;
the prompt renders with `unicode-bidi: plaintext`, so the English run lays out LTR.

## Curriculum map

### Level A — Pre-A1 (days 1–14)
1–7. **(existing)** greetings/colors · numbers 1–10 · family · animals · food · body · classroom
8–11. **The alphabet** A–G, H–N, O–T, U–Z (+ A–Z review) — letter names + initial sounds
12. **Initial sounds** — which letter a word starts with
13. **Reading short words** — short vowels + CVC blending (cat, dog, sun, pen, big…)
14. **Level A review** (spiral) — ends with a "Level A complete!" milestone

### Level B — A1 (days 15–28)
15. Word families (-at, -an, -ig, -og)
16. Sight words (the, a, I, you, is, like, see, and)
17. Articles: a / an
18. Plurals (-s)
19. this / that / these / those
20. Pronouns + to be (I am / you are / he is / she is)
21. can / can't + action verbs
22. I like / I don't like (present simple) + food
23. Prepositions of place (in / on / under)
24. Numbers 11–20
25. Adjectives (big/small, hot/cold, happy/sad…)
26. Reading short sentences (comprehension)
27. Level B review (spiral)
28. Final review before the exam

**Final exams:** each level has its own exam (`/english/[level]/exam`) drawing only
from that level's lessons, unlocking after that level's lessons are complete. Passing
Level A's exam unlocks Level B.

## Authoring rules (for adding/editing English days)

- Files: `lib/content/english/day-NN.ts`, registered in
  `lib/content/english/index.ts`. Use the factories in
  `lib/content/engine/exercise-factories.ts`.
- Day shape: 4 sections — warmup (`section-0`) → two teaching (`verbal`) → review
  (last). **Contracts** (enforced by
  `tests/unit/lib/content/english-content-validity.test.ts`): section indexes from 0;
  exercise numbers from 1; non-last sections 4–8 exercises, last section 6–10; every
  answer must self-grade; choice answers must appear in their options; pairs
  well-formed.
- Hebrew prompts, child-friendly. Tap-only. Run an AI content-accuracy audit on new
  content (translations, distractor plausibility, CEFR fit) — see CLAUDE.md rule 11.
