# AI Migration Plan (Future Work)

> **Status:** PLANNED — not started. Captured 2026-06-13 via `/plan` (MAX mode, reviewed twice).
> **Mode to execute:** MAX (server/API + secrets + app-wide TTS + content generation).
> **Owner:** TBD.

Research-backed plan for introducing AI into kids_math **without breaking offline-first,
content determinism, numeric-grading correctness, or child-data safety.**

---

## TL;DR

| Case | What | Verdict | When AI runs |
|------|------|---------|--------------|
| **A** | Cloud neural TTS (Google Cloud TTS), pre-generated to static audio files | ✅ Do first | Build-time (offline at runtime) |
| **B** | Claude drafts English/math content; human + pedagogy review, commit static TS | ✅ Do second | Authoring-time |
| **C** | Live server-proxied adaptive hints on wrong answers | ⚠️ Deferred, separate MAX cycle | Server proxy (no PII) |
| **D** | AI answer grading | ❌ Excluded | — |
| **E** | Live runtime exercise generation | ❌ Excluded | — |

D/E are excluded permanently: answers are numeric/MC (deterministic grading is correct),
and live generation would break content IDs that saved progress depends on.

---

## Case A — Cloud TTS (build-time pre-generation)

**Problem.** Runtime uses browser `window.speechSynthesis` only ([lib/tts/engine.ts](../lib/tts/engine.ts)).
On Hebrew-locale devices there is often **no English voice** — [AudioButton](../components/exercises/AudioButton.tsx)
already degrades to *disabled*. Hebrew niqqud needs the `normalizeTextForHebrewTts` hack.

**Solution.** Pre-generate neural audio for **fixed strings only**, save as static files, play
the file at runtime. Browser TTS remains the fallback on any miss.

**Provider: Google Cloud TTS.** Reuses the existing Google service account
(`FIRESTORE_CREDENTIALS_JSON` in [.env.example](../.env.example)) — no new vendor/billing.
Strong `he-IL` (Neural2/Chirp) + `en-US` voices.

### What is / isn't pre-generated (critical scope)

| Bucket | Source | Pre-gen? |
|--------|--------|----------|
| English vocab | `exercise.audioText` — `listenChoose`/`letterTiles` factories ([exercise-factories.ts:140,163](../lib/content/engine/exercise-factories.ts)), spoken via `AudioButton`→`speakEnglish` | ✅ Yes |
| Authored Hebrew | [teachingPrimerCatalog.ts](../lib/content/teachingPrimerCatalog.ts) (542 lines) + `day.teachingSummary`/`teachingSteps`, via `TapToPlayTtsButton`→`speakHebrewChunks` | ✅ Yes |
| Procedural Hebrew math | `buildExercisePromptSpeakText` ([exercisePromptSpeakText.ts](../lib/utils/exercisePromptSpeakText.ts)) — built at runtime from expressions (`countRangePrompt(start,end)`, …) | ❌ No — combinatorial, **stays on `speechSynthesis`** |

### Files to touch
- [lib/tts/engine.ts](../lib/tts/engine.ts) — in `speakUtterance` (~line 125): **manifest lookup first** → play `Audio(url)` on hit; on miss/error → existing `speechSynthesis` path **unchanged**. `speakHebrew`/`speakEnglish`/`speakHebrewChunks` signatures untouched (protects all 4 call sites).
- `lib/tts/audioManifest.ts` *(new)* — pure `lookup(text, lang) => string | null`, keyed `hash(normalizeTextForHebrewTts(text) + lang + voiceId)` so build hash == runtime hash; dedupes identical strings.
- `public/audio/*.mp3` + `public/audio/manifest.json` *(new)* — committed (public dir currently empty, no `.gitignore` rule) → offline-safe.
- `scripts/generate-audio.mjs` *(new)* — offline, human-run: walk English `audioText` + primer catalog → Google Cloud TTS → write files + manifest. **Never invoked by `next build`.**
- `.env.example` — document TTS key (build-time only).
- `tests/unit/lib/tts/audioManifest.test.ts` *(new)* — lookup + fallback (miss === current behavior).

**Hard constraint:** build/CI must have **no** TTS key dependency. Generation is manual/offline; CI consumes the committed manifest + files. Provider mocked in tests; never called from CI.

---

## Case B — AI-assisted content authoring (authoring-time)

**Problem.** 29 grade-A + 29 grade-B math days, but only **1 English day**
([lib/content/english/day-01.ts](../lib/content/english/day-01.ts)). Large backlog.

**Solution.** `scripts/author-english-days.mjs` *(new)* uses **Claude** (Haiku
`claude-haiku-4-5` for bulk, Sonnet `claude-sonnet-4-6` for harder pedagogy passes — confirm
current pricing via the `claude-api` skill before running) to draft days → validate against
`WorkbookDay` type + [validate.ts](../lib/content/engine/validate.ts) → emit TS for
**human + `MoE_PedagogyLead` review** → commit as static content.

- Output is plain reviewed TypeScript. **No runtime AI, no prod key, deterministic.**
- New days use **new IDs** (`day-2`…`day-N`) — additive, no rename → existing English
  progress (`kids_math.english.workbook_progress.v1`) is untouched.
- Add `docs/AI_AUTHORING_GUIDELINES.md` *(new)*: review checklist, MoE alignment, ID rules.
- Plug in via [lib/content/english/index.ts](../lib/content/english/index.ts) / `ENGLISH_TOTAL_DAYS`.

---

## Case C — Live adaptive hints (DEFERRED — own MAX cycle)

After 1A/1B ship. Server-proxied hint on a wrong answer.

- `app/api/ai/hint/route.ts` *(new)* — JWT-gated, rate-limited, opt-in.
- **No-PII contract:** payload is **only** the exercise prompt + abstract skill/misconception
  tag. **Never** username, answer history, or progress.
- `lib/hooks/useAiHint.ts` *(new)* — opt-in, graceful degrade (offline → no hint, never blocks).
- Privacy-page disclosure required.
- Kept separate because it's the only case crossing a live server boundary with children's-data
  implications; must not block the high-value offline work.

---

## Risks & mitigations (top)

| Risk | Severity | Mitigation |
|------|----------|------------|
| API key in client bundle | CRITICAL | Cases A/B run build/authoring-time — never in app. Case C server-only, no `NEXT_PUBLIC_`. |
| Child PII to a third-party LLM | CRITICAL | Case C only; no PII in payload; opt-in; privacy disclosure. |
| Runtime AI breaks offline / adds latency | HIGH | A & B build-time → app stays offline. C degrades gracefully. |
| Generated content orphans saved progress | HIGH | Keep deterministic IDs; additive new days only; human review + content-validity test. |
| Unsafe/non-deterministic content reaches kids | HIGH | Human + MoE review gate; `teachingPrimerHebrewLint`; content-validity tests pre-commit. |
| Build/CI accidentally calls the provider | HIGH | Generation is a separate offline script; CI has no key; provider mocked in tests. |
| Audio bloats repo | MEDIUM | Compressed mp3/opus, hashed names, dedupe. Accepted tradeoff vs. offline-first. |

---

## Sequencing

1. **Phase 1A** — Case A: TTS engine seam + manifest + generation script *(first reviewable slice)*.
2. **Phase 1B** — Case B: authoring script → generate English days → human/MoE review → commit.
3. **Phase 2** — Case C: server-proxied hints, later, on its own MAX plan.

## Definition of Done (per phase)

- **1A:** English audio plays on a device with **no English system voice**; app stays offline;
  no key in client bundle; `engine.ts` change additive (all 4 call sites + `speechSynthesis`
  fallback intact); manifest-miss === current behavior; unit + `day-smoke` E2E green.
- **1B:** generated days pass `content-validity` + `check:testids`, deterministic IDs, human +
  pedagogy sign-off; `npm run test:qa` green.
- **2:** no-PII verified; opt-in; graceful offline degrade; privacy page updated.

---

## How to pick this up later

1. Re-read this doc + [AGENTS.md](../AGENTS.md) Data & Storage Rules (content-ID/orphaning rules).
2. Start in **MAX mode** (`/plan` already done — this doc is the approved plan; re-confirm scope).
3. Execute **Phase 1A first**. Run the audio generation script locally with the GCP key in
   `.env.local`; commit `public/audio/` + manifest.
4. Verify: `npm run test:qa`, plus manual check on a Hebrew-locale device with no English voice.
5. For Case B, confirm Claude model/pricing via the `claude-api` skill before batch runs.
6. Keep Case C entirely separate — new `/plan` cycle when 1A/1B have shipped.
