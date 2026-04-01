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
npm run lint             # ESLint
npm run check:testids    # Test ID coverage
npm run build            # Production build
npm run test:unit        # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)
npm run test:qa          # Full QA suite (lint + unit + build + E2E)
```

## Key Rules

### Research First (before ANY change)
1. Read the file before editing
2. Search for existing patterns (grep)
3. Check helpers in `lib/`
4. Check `docs/LEARNING_LOG.md` for past decisions
5. Check `.cursor/rules/*.mdc` for domain conventions
6. Check cross-file dependencies (grep for imports)

### Implementation
1. Minimal diffs — smallest correct change (PRO: ≤50 lines, ULTRA: ≤300 lines)
2. No `any` — use type guards
3. `data-testid` required — via `lib/testIds.ts`
4. Route builders — `lib/routes.ts`, never hardcode
5. Storage is sacred — schema changes auto-escalate to MAX
6. RTL first — `dir="ltr"` only for math inputs
7. Never weaken configs — fix code, not eslint/tsconfig
8. No console.log — in production code
9. No secrets — flag immediately if found
10. Numbers only — students type digits or click buttons. **No text/character input.** Use `number_input` or `multiple_choice`, never free-text fields

### Self-Review (before every response)
Run the Self-Review Protocol from `AGENTS.md` — catch your own mistakes before handing off.

### Verification (after changes)
- ULTRA/MAX: produce full verification report (all fields filled, SKIPPED needs reason)
- Use severity: CRITICAL/HIGH = auto-BLOCK, MEDIUM = warn, LOW = optional
- Include role participation table for reviews
- **MCP Playwright**: visual smoke test on changed screens (ULTRA if UI changed, MAX always)
- **CI Suite**: run `npm run test:qa` before declaring READY (ULTRA/MAX mandatory)

## Mode Quick Reference

### PRO
Research → Implement → Self-review → Verify → Output

### ULTRA (3 blocking checkpoints)
Plan → ⛔ USER CONFIRMS → Explore → ⛔ USER CONFIRMS → Implement → Self-review → Multi-role Review (5 roles) → Test → **MCP Playwright Visual Check** → **CI Suite (`test:qa`)** → Verify → ⛔ USER CONFIRMS → Output

### MAX (6+ blocking checkpoints)
Plan → ⛔ Plan Review R1 → Revise → ⛔ Plan Review R2 → ⛔ USER CONFIRMS → Explore → ⛔ USER CONFIRMS → Implement → Self-review → Review Cycle 1 → Fix → ⛔ USER CONFIRMS → Review Cycle 2 → QA Team → **MCP Playwright Visual Check** → **CI Suite (`test:qa`)** → Verify → ⛔ USER CONFIRMS → PR → Output

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

- `AGENTS.md` — **Complete workflow** (modes, checkpoints, gates, roles, handoff, security, escalation)
- `.cursor/rules/*.mdc` — Domain rules (also applicable here)
- `docs/LEARNING_LOG.md` — Project decisions and learnings
- `docs/AI_PROMPT_LIBRARY.md` — Prompt templates
