# CLAUDE.md — Claude Code Configuration (kids_math)

> Read this file first, then follow `AGENTS.md` for the complete workflow system.

## Before ANY Task

1. Read `AGENTS.md` → Mandatory Behaviors (applies to ALL modes, no exceptions)
2. Determine mode: PRO / ULTRA / MAX (see Mode Selection Rules)
3. State mode at the start of your response
4. Follow the mode's process and checkpoints EXACTLY — no skipping phases or checkpoints
5. Run Self-Review Protocol before every response

## Slash Commands

| Command | When | What it does |
|---------|------|-------------|
| `/plan` | Before non-trivial work | Multi-role plan with risk assessment, waits for confirmation before coding |
| `/verify` | After completing changes | Runs quality gates, produces structured PASS/FAIL verification report |
| `/review` | Before PR / after implementation | Multi-role code review with severity levels, role participation tracking |

## Auto-Enforced Hooks

These run automatically via `.claude/settings.json`:
- **`--no-verify` blocked** — git hook bypass flags are rejected
- **TypeScript check** — warns after editing `.ts/.tsx` files (non-blocking)
- **console.log detection** — warns when found in production code
- **Config protection** — warns when editing config files
- **Pre-commit scan** — checks modified files for `console.log` and `TODO/FIXME/HACK`

## Project Context

- **Stack**: Next.js 14 App Router, React 18, TypeScript (strict), Tailwind CSS
- **UI**: Hebrew RTL (`<html lang="he" dir="rtl">`)
- **State**: localStorage only, keys: `kids_math.*`
- **Path alias**: `@/*` imports
- **Tests**: Vitest (unit), Playwright (E2E, Chromium)

## Shell Commands

```bash
npm run dev              # Dev server
npm run lint             # ESLint                       (fast — run locally)
npm run check:testids    # Test ID coverage             (fast — run locally)
npm run build            # Production build
npm run test:unit        # Unit tests (Vitest)          (fast — run locally)
npm run test:e2e         # E2E tests (Playwright)        # CI ONLY — do not run locally
npm run test:qa          # Full QA (lint+unit+build+E2E) # CI ONLY — do not run locally
```

> **Tests run on CI, not locally.** Run only the fast gates locally (`tsc`, `lint`,
> `check:testids`, `test:unit`); push and let the PR's CI run `test:e2e`/`test:qa`.
> CI is faster and costs fewer tokens. See `AGENTS.md` → Testing Strategy → Where tests run.

## Key Rules

### Research First (before ANY change)
1. Read the file before editing
2. Search for existing patterns (grep)
3. Check helpers in `lib/`
4. **Reuse the shared UI library** (see `.claude/docs/UI_COMPONENTS.md`) before building new card/button/input/banner markup; run `npm run check:cards` for guidance
5. Check `.claude/docs/LEARNING_LOG.md` for past decisions
6. Check `.claude/rules/*.mdc` for domain conventions (indexed under Reference Files)
7. Check cross-file dependencies (grep for imports)

### Implementation
1. Minimal diffs — smallest correct change (PRO: ≤50 lines, ULTRA: ≤300 lines)
2. No `any` — use type guards
3. `data-testid` required — via `lib/testIds.ts`
4. Route builders — `lib/routes.ts`, never hardcode
5. **Storage backward compatibility** — Learner data in `localStorage` (all domains under `lib/*/storage.ts`: workbook, final exam, GMAT, badges, streak) must survive deploys; renaming content IDs (`dayId`, section/exercise ids) can orphan data without a plan. Full rules: **`AGENTS.md` → Data & Storage Rules**. Edits to `lib/*/storage.ts` → MAX (auto-escalate).
6. RTL first — `dir="ltr"` only for math inputs
7. Never weaken configs — fix code, not eslint/tsconfig
8. No console.log — in production code
9. No secrets — flag immediately if found
10. Numbers only — students type digits or click buttons. **No text/character input.** Use `number_input` or `multiple_choice`, never free-text fields
11. **Content accuracy audit** — when adding/editing exercises or day content, run an AI content audit (in-session, or `scripts/audit-content-accuracy.mjs`) for word-problems, natural-language claims, distractor plausibility, and MoE syllabus fit. The deterministic checker can't catch these. Full rules: **`AGENTS.md` → Educational Content Changes**
12. **Voice/speech review** — when adding/editing any read-aloud text (exercise prompts, teaching primers, worked examples, English layer), review how it *sounds*: niqqud/spelling, grammar & gender agreement, math/comparison symbols voiced by `normalizeTextForHebrewTts`, and step-label numbering. The deterministic lint and content audit don't cover pronunciation. Full rules: **`AGENTS.md` → Educational Content Changes → Spoken-Content / Voice Review**

### Self-Review (before every response)
Run the Self-Review Protocol from `AGENTS.md` — catch your own mistakes before handing off.

### Verification (after changes)
- ULTRA/MAX: produce full verification report (all fields filled, SKIPPED needs reason)
- Use severity: CRITICAL/HIGH = auto-BLOCK, MEDIUM = warn, LOW = optional
- Include role participation table for reviews
- **MCP Playwright**: visual smoke test on changed screens (ULTRA if UI changed, MAX always)
- **CI Suite**: full `test:qa`/E2E runs on the **PR's CI, not locally** (faster, fewer tokens). Locally run only fast gates (tsc/lint/testids/unit); "READY" = fast gates pass + PR CI green. Report the CI Suite field as `DEFERRED TO CI`.

## Mode Quick Reference

### PRO
Research → Implement → Self-review → Verify → Output

### ULTRA (3 blocking checkpoints)
Plan → ⛔ USER CONFIRMS → Explore → ⛔ USER CONFIRMS → Implement → Self-review → Multi-role Review (5 roles) → Test → **MCP Playwright Visual Check** → **CI Suite (on PR's CI, not local)** → Verify → ⛔ USER CONFIRMS → Output

### MAX (6+ blocking checkpoints)
Plan → ⛔ Plan Review R1 → Revise → ⛔ Plan Review R2 → ⛔ USER CONFIRMS → Explore → ⛔ USER CONFIRMS → Implement → Self-review → Review Cycle 1 → Fix → ⛔ USER CONFIRMS → Review Cycle 2 → QA Team → **MCP Playwright Visual Check** → **CI Suite (on PR's CI, not local)** → Verify → ⛔ USER CONFIRMS → PR → Output

## Escalation

If during work you discover the task touches any of these, **STOP and escalate mode**:
- Routing or middleware → MAX
- localStorage schema / `lib/*/storage.ts` → MAX (auto-escalate)
- Grade unlock chain → MAX
- Final exam / GMAT logic → MAX
- Security finding (CRITICAL) → MAX (auto-escalate)
- Diff exceeds mode limit → +1 level

Use the escalation template from `AGENTS.md` → Escalation Playbook.

## Reference Files

Domain rules and docs now live under **`.claude/`** as the single home:
`.claude/rules/*.mdc` (was `.cursor/rules/`) and `.claude/docs/*.md` (was `docs/`).
The old `.cursor/rules/` and `docs/` paths are kept as **symlinks** into `.claude/`,
so Cursor, Devin, and every existing reference still resolve unchanged.

- `AGENTS.md` — **Complete workflow** (modes, checkpoints, gates, roles, handoff, security, escalation). Single source of truth; this file and `.devin/guidelines.md` defer to it.

### Always-applied rules (auto-loaded into context)

These mirror the `alwaysApply: true` rules Cursor always loads — imported so they're in context every session:

@.claude/rules/agent-guidelines.mdc
@.claude/rules/quality-gates.mdc
@.claude/rules/testids.mdc
@.claude/rules/learning-loop.mdc
@.claude/rules/multi-agent-playbook.mdc
@.claude/rules/agent-definer.mdc
@.claude/rules/ai-prompt-templates.mdc

### On-demand rules (read when the task matches)

| Rule | Read when |
|------|-----------|
| `.claude/rules/add-subject.mdc` | Adding a new top-level subject (Math/English/Science siblings) |
| `.claude/rules/add-grade.mdc` | Adding/changing a grade, grade routes, unlock gates |
| `.claude/rules/build-school-year.mdc` | Building/extending a school-year curriculum |
| `.claude/rules/timed-exam-session.mdc` | Adding/changing a timed exam |
| `.claude/rules/day-teaching-primer.mdc` | Changing day teaching primers / hub copy / TTS |

### Key docs (`.claude/docs/`)

- `LEARNING_LOG.md` — project decisions and learnings (append per Learning Loop)
- `UI_COMPONENTS.md` — shared UI/hook/util library catalog + canonical Card tokens (reuse before new card/button/input/banner markup; `npm run check:cards`)
- `AI_PROMPT_LIBRARY.md` / `AI_AUTHORING_GUIDELINES.md` — prompt + authoring templates
- `PEDAGOGY_BENCHMARK_G1_G2.md`, `MOE_GRADE_A_B_SKILLTAG_MAP.md`, `VALIDATION_PLAN_G1_G2_PEDAGOGY.md` — pedagogy / MoE alignment
- `ENGLISH_CURRICULUM.md`, `TEACHING_PRIMER_GUIDELINES.md` — subject/content guides
- `NAVIGATION_IA.md`, `DEPLOYMENT.md`, `REGRESSION_TEST_PLAN.md` — IA, deploy, regression
- Full list: `ls .claude/docs/`
