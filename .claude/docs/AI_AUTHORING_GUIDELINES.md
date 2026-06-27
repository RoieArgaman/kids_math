# AI Authoring Guidelines (kids_math)

> How to use the AI authoring/audit scripts safely. Companion to
> [AI_MIGRATION_PLAN.md](AI_MIGRATION_PLAN.md). AI runs **at authoring time only** — never
> in the running app or CI.

## Principles

1. **AI drafts, a human approves.** No AI-generated content reaches `lib/content/` without
   a human + pedagogy (`MoE_PedagogyLead`) review.
2. **Deterministic IDs are sacred.** New days/sections/exercises use the existing ID
   scheme (`day-N-section-M-exercise-K`). Renaming existing IDs can orphan saved progress
   (see [AGENTS.md](../AGENTS.md) → Data & Storage Rules). Add, don't rename.
3. **Numbers-only answers.** Generated exercises must use existing kinds
   (`number_input`, `multiple_choice`, `true_false`, …). No free-text input.
4. **Fail-safe over clever.** Everything must pass the deterministic gates below before
   commit; a draft that needs the gates relaxed is wrong, not the gate.

## The scripts (all human-run, need keys in `.env.local`)

| Script | Purpose | Writes to | Key |
|--------|---------|-----------|-----|
| `scripts/author-content.mjs` | Draft new days → validate → emit TS for review | stdout / a review file | `ANTHROPIC_API_KEY` |
| `scripts/audit-content-accuracy.mjs` | Review existing content; report only | `tmp/content-audit.md` only | `ANTHROPIC_API_KEY` |
| `scripts/generate-audio.mjs` | Pre-generate TTS audio | `public/audio/`, `lib/tts/audioManifest.data.json` | `GCP_TTS_CREDENTIALS_JSON` |

The audit script is **write-restricted to `tmp/`** and cannot edit content.

## Review checklist (before committing any generated/repaired content)

- [ ] `npm run test:unit -- tests/unit/lib/content/` passes (includes the deterministic
      arithmetic backstop `validateExerciseArithmetic`).
- [ ] `npm run check:testids` passes.
- [ ] IDs follow the scheme and **no existing ID was renamed**.
- [ ] Number ranges / operations fit the Grade 1–2 MoE band.
- [ ] Distractors are plausible but unambiguous; the correct answer is in `options`.
- [ ] `true_false` boolean matches whether the stated equation actually holds (unless the
      statement is intentionally non-arithmetic).
- [ ] Hebrew niqqud reads correctly (run the primer Hebrew lint where applicable).
- [ ] `MoE_PedagogyLead` sign-off recorded in the PR.

## How the deterministic backstop works

`validateExerciseArithmetic` (in `lib/content/engine/validate.ts`) is **conservative**: it
only flags a clear contradiction in an unambiguously evaluable prompt, and skips anything
it cannot evaluate (word problems, "fix the mistake" prompts, place-value, ranges). It
catches:
- `a + b = ?` where the exercise answer ≠ the computed result.
- `true_false` where the boolean answer disagrees with whether the equation holds.

It deliberately does **not** flag deliberately-wrong equations embedded in `number_input`
"correct the mistake" prompts — those are valid pedagogy.
