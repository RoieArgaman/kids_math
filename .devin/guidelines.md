# Devin Guidelines — kids_math

> **Canonical source of truth: `AGENTS.md` at project root.**
> Read `AGENTS.md` completely before starting any task. This file provides Devin-specific guidance that complements it.

---

## Mandatory First Steps (Every Task)

1. **Read `AGENTS.md`** — understand modes, gates, roles, conventions, checkpoints
2. **Determine mode** using `AGENTS.md` → Mode Selection Rules
3. **State mode** at the start of your response: `Mode: [PRO/ULTRA/MAX] — [reason]`
4. **Research before writing** — read files, grep for patterns, check helpers (see below)
5. **Follow the mode's process exactly** — no shortcuts, no skipped phases or checkpoints
6. **Run Self-Review Protocol** before every response

---

## Mandatory Behaviors (No Exceptions)

### Research Before Writing
Before modifying ANY file:
- **Read the file first** — understand existing code before changing it
- **Search for existing patterns** — look for similar implementations in the codebase
- **Check helpers/utils** — reuse existing functions from `lib/`, don't reinvent
- **Check learning log** — read `docs/LEARNING_LOG.md` for relevant past decisions
- **Check Cursor rules** — read `.cursor/rules/*.mdc` for domain conventions (apply to ALL agents)
- **Check cross-file dependencies**:
  ```bash
  grep -r "from.*<module-path>" --include="*.ts" --include="*.tsx" .
  ```
  If >5 files import from a changed module → flag as HIGH IMPACT.

### Minimal Diffs
- Make the smallest correct change
- No drive-by refactors or "while I'm here" improvements
- No adding comments, docstrings, or type annotations to unchanged code

**Diff size limits:**
| Mode | Max files | Max insertions |
|------|-----------|----------------|
| PRO | 2 | 50 lines |
| ULTRA | 8 | 300 lines |
| MAX | No limit | Each file needs rationale |

### Never Weaken Configs
- Don't modify `.eslintrc`, `tsconfig.json`, `tailwind.config`, `next.config`, `playwright.config`, `vitest.config` to suppress errors
- Fix the code, not the config

### No Secrets in Code
- Never hardcode API keys, passwords, tokens, or credentials
- Never commit `.env` files
- If you FIND a secret: **STOP, flag as CRITICAL, auto-escalate to MAX**

### Preserve Backward Compatibility
- localStorage schemas are versioned — additive changes only
- Schema changes require version bump + migration + MAX mode
- **Auto-escalate to MAX** when editing any `lib/*/storage.ts`

### Self-Review Before Handoff (mandatory)
Run this checklist before every response:
```
SELF-REVIEW
===========
[ ] Read all relevant files BEFORE making changes?
[ ] Checked for existing patterns/helpers to reuse?
[ ] Checked cross-file dependencies?
[ ] Diff minimal? (within mode size limits)
[ ] No config weakening?
[ ] No console.log in production code?
[ ] No hardcoded secrets?
[ ] All interactive elements have data-testid via lib/testIds.ts?
[ ] Route references use lib/routes.ts?
[ ] Storage schemas unchanged OR migration included?
[ ] RTL preserved? dir="ltr" only for math inputs?
[ ] Quality gates ran and pass?
[ ] Verification report filled (ULTRA/MAX)?
[ ] Learning log updated (ULTRA/MAX) or skip justified?
```

---

## Project Context

| Aspect | Detail |
|--------|--------|
| **App** | Daily math workbook for Israeli elementary students (Grades 1-2) |
| **Stack** | Next.js 14 App Router, React 18, TypeScript (strict), Tailwind CSS |
| **UI** | Hebrew RTL (`<html lang="he" dir="rtl">`) |
| **State** | localStorage only, keys: `kids_math.*` |
| **Path alias** | `@/*` imports |
| **Unit tests** | Vitest (`tests/unit/`), config: `vitest.config.ts` |
| **E2E tests** | Playwright, Chromium (`tests/e2e/`), config: `playwright.config.ts` |
| **Deploy** | Firebase App Hosting (Node 20, Blaze plan) |
| **CI** | GitHub Actions: lint, testids, build, unit, E2E |

### Key Directories
```
app/                  # Next.js routes (thin server pages → client screens)
components/           # React components (screens/, ui/, exercises/, timed-exam/, layout/, legal/)
lib/                  # Shared logic (content/, progress/, badges/, final-exam/, gmat-challenge/,
                      #   exam-session/, hooks/, utils/, types/, analytics/, admin/)
tests/unit/           # Vitest unit tests
tests/e2e/            # Playwright E2E tests
docs/                 # Learning log, pedagogy docs, deployment guide
scripts/              # Codemods (testid checks, auto-add, dedupe)
.cursor/rules/        # Agent rules (apply to ALL agents, not just Cursor)
```

---

## Workflow Modes

### PRO Mode (Fast & Focused)

**When**: Single file edits, copy changes, isolated UI tweaks, bug fixes in one module.

**Process**:
1. Research: read files, grep patterns, check helpers
2. Implement: smallest correct change
3. Self-review: run checklist above
4. Verify: `npm run lint` + `npm run check:testids` + targeted tests
5. Output: handoff format

**Review**: Self-review only.
**PRO self-review escalation**: If you discover RTL/a11y regression risk, storage impact, >2 files affected, or >3 cross-file dep impact → escalate to ULTRA.

---

### ULTRA Mode (Rigorous & Multi-perspective)

**When**: Multi-file features, logic changes, new UI screens, content changes.

**Process**:
1. **Plan** — clarify goal, identify files, risks, validation steps
2. ⛔ **CHECKPOINT: Plan Review** — present plan with multi-role input, WAIT for user
3. **Explore** — locate existing patterns, confirm assumptions by reading code
4. ⛔ **CHECKPOINT: Explore Findings** — present findings, WAIT for user
5. **Implement** — smallest correct change following conventions
6. **Self-review** — run checklist
7. **Multi-role Review** — 5 core roles (all must participate)
8. **Test** — `lint` + `check:testids` + `build` + `test:unit` + targeted E2E (name exact specs)
9. **Visual Verify** — MCP Playwright smoke test on changed screens
10. **CI Final** — run `npm run test:qa` — all checks must pass
11. **Verify** — produce verification report
12. ⛔ **CHECKPOINT: Verification** — present report, WAIT for user
13. **Output** — handoff format + learning log entry

**Core review team** (ALL 5 must participate):
- `SeniorDev_TechLead` — architecture, simplicity, maintainability
- `SeniorFrontEnd_TechLead` — UI patterns, RTL, accessibility
- `Dev_Architect` — data flow, server/client boundaries, storage
- `QA_Architect` — test strategy, coverage sufficiency
- `SeniorAutomation_Engineer` — which tests to add/update

**Manual RTL checklist**:
- [ ] Home → plan → day navigation works
- [ ] Keyboard navigation (Tab/Shift+Tab) on changed elements
- [ ] Touch targets >= 44px on new/changed buttons

---

### MAX Mode (Full Rigor, Zero Gaps)

**When**: Routing/middleware/gate changes, schema migrations, final-exam/unlock flow, new grades, broad refactors, security changes.

**Process**:
1. **Plan** — full multi-role plan with ALL specialist roles contributing
2. ⛔ **CHECKPOINT: Plan Review Round 1** — all roles review, produce punch-list
3. **Plan Revision** — address all plan-level issues
4. ⛔ **CHECKPOINT: Plan Review Round 2** — re-review, all roles must approve
5. ⛔ **CHECKPOINT: User Confirmation** — present final plan, WAIT for user
6. **Explore** — comprehensive "where to change" map with risk annotations
7. ⛔ **CHECKPOINT: Explore Findings** — present findings, WAIT for user
8. **Implement** — changes with explicit rationale for every decision
9. **Self-review** — run checklist
10. **Review Cycle 1** — full team (8+ roles), produce punch-list with severity
11. **Fix** — address all CRITICAL and HIGH issues
12. ⛔ **CHECKPOINT: Fixes Ready** — list fixes, WAIT for user
13. **Review Cycle 2** — re-review, all roles must approve
14. **If Cycle 2 still has CRITICAL/HIGH** → BLOCK + escalate to user
15. **Test (QA Multi-role Team)** — full automation + manual QA
16. **Visual Verify** — MCP Playwright full smoke test (all changed screens + critical paths)
17. **CI Final** — run `npm run test:qa` — MUST pass with zero failures
18. **Verify** — produce verification report
19. ⛔ **CHECKPOINT: Final Verification** — present report, WAIT for user
20. **PR preparation** — summary, test plan, risk notes, migration notes
21. **Output** — handoff format + learning log + rule updates

**Full review team** (ALL must participate):
- `SeniorDev_TechLead`, `SeniorFrontEnd_TechLead`, `Dev_Architect`
- `QA_Architect`, `SeniorAutomation_Engineer`, `SeniorQA_Engineer`
- `SeniorProductDesigner`, `SeniorProductManager`
- (+ `MoE_PedagogyLead` when educational content changes)

**Full manual checklist**:
- [ ] Home → plan → day/grade navigation (all grades)
- [ ] Locked/unlocked gate behavior (cookies/storage)
- [ ] Keyboard navigation for all changed elements
- [ ] Touch target size (44-52px) for all buttons
- [ ] RTL layout correctness for all changed screens
- [ ] Error states (storage errors, empty states)
- [ ] Browser back/forward cache state sync
- [ ] Cross-tab storage sync

---

## Mode Selection Rules

| Signal | Mode |
|--------|------|
| Single file, no routing/storage/gate logic | **PRO** |
| Copy/label/style change in isolated component | **PRO** |
| Adding/updating a single unit test | **PRO** |
| Bug fix in one module, no schema change | **PRO** |
| Multi-file feature (2-8 files) | **ULTRA** |
| Logic changes in `lib/progress/`, `lib/utils/exercise.ts` | **ULTRA** |
| New UI screen or major component changes | **ULTRA** |
| Changes to content/day generation | **ULTRA** |
| New exercise type | **ULTRA** |
| Routing, middleware, gate changes | **MAX** |
| Persisted schema changes (localStorage shapes) | **MAX** |
| Final exam / unlock chain / grade gating | **MAX** |
| Adding a new grade | **MAX** |
| Broad refactor (>8 files) | **MAX** |
| Security-sensitive (cookies, API routes, admin) | **MAX** |
| CI/CD pipeline changes | **MAX** |

**When in doubt, go one level up.**

**Auto-escalation** (no user confirmation needed, just inform):
- Editing `lib/*/storage.ts` → MAX
- Diff exceeds mode limit → +1 level
- Security finding CRITICAL → MAX
- Cross-file impact >5 files → ULTRA minimum

---

## Quality Gates by Mode

### PRO
```bash
npm run lint
npm run check:testids
# If behavior changed:
npm run build
# If logic changed:
npm run test:unit -- <relevant-test-file>
```

### ULTRA
```bash
npm run lint
npm run check:testids
npm run build
npm run test:unit
npm run test:e2e -- <exact-spec-files>  # Must name exact specs
# Then: MCP Playwright visual check (if UI changed)
# Then: npm run test:qa (full CI suite)
```

### MAX
```bash
npm run test:qa   # = lint + check:testids + build + unit + E2E
# No exceptions — all must pass
# Then: MCP Playwright full visual check (always)
```

### Mandatory Test Targeting
| Changed Area | Must Run |
|-------------|----------|
| UI copy/layout | `tests/e2e/day-smoke.spec.ts` |
| Routing/gates | `tests/e2e/grade-b.spec.ts grade-a-lifecycle.spec.ts admin-progress.spec.ts` |
| Progress/storage | `tests/unit/lib/progress/` AND `tests/e2e/grade-a-lifecycle.spec.ts` |
| Final exam | `tests/unit/lib/final-exam/` AND `tests/e2e/grade-a-lifecycle.spec.ts grade-b-lifecycle.spec.ts` |
| Content/days | `tests/unit/lib/content/content-validity.test.ts` AND `tests/e2e/day-smoke.spec.ts` |
| GMAT | `tests/unit/lib/gmat-challenge/` AND `tests/e2e/gmat-challenge.spec.ts` |

---

## Verification Report Format (ULTRA/MAX mandatory)

```
VERIFICATION REPORT (kids_math)
================================
Mode:        [PRO/ULTRA/MAX]
Changed:     [brief description]

Lint:        [PASS/FAIL] (details if fail)
TestIDs:     [PASS/FAIL] (details if fail)
Build:       [PASS/FAIL/SKIPPED — reason]
Unit:        [PASS/FAIL/SKIPPED — reason] (X passed, Y failed)
E2E:         [PASS/FAIL/SKIPPED — reason] (X passed, Y failed; specs: list.spec.ts)
Security:    [PASS/FAIL] (findings with severity)
Visual:      [PASS/FAIL/SKIPPED — reason] (screens checked: list)
CI Suite:    [PASS/FAIL] (lint ✓, testids ✓, build ✓, unit X/X ✓, e2e X/X ✓)
Diff:        [X files, Y insertions, Z deletions]

Learning:    [YES — summary / NO — reason skipped]

Overall:     [READY / NOT READY]
```

**READY** requires ALL: zero CRITICAL, zero HIGH, all gates PASS, Security PASS, Visual PASS, CI Suite PASS, report 100% filled.
**SKIPPED** must include reason: `Unit: SKIPPED [PRO mode, only copy changed]` — never just `SKIPPED`.

---

## Checkpoint Format (Blocking)

Every ⛔ checkpoint — STOP and wait for user confirmation:

```
---
⛔ CHECKPOINT: [Phase Name]
Status: [COMPLETE / NEEDS REVISION]

Summary: [1-2 sentences]

Checklist:
[X] [requirement 1]
[X] [requirement 2]
[ ] [requirement not met — explain why]

Roles participated: [list — ULTRA/MAX only]

Ready for next phase? Awaiting your confirmation.
Options: (proceed / revise / different approach / escalate mode)
---
```

---

## Review Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **CRITICAL** | Security vuln, data loss, broken gate | **BLOCK** — must fix, no exceptions |
| **HIGH** | Bug, test failure, type error, broken flow | **BLOCK** — must fix before merge |
| **MEDIUM** | Warning, missing test, minor regression | **WARN** — should fix |
| **LOW** | Style suggestion, optional | **NOTE** — optional |

### Security Severity
| Finding | Severity |
|---------|----------|
| Hardcoded secret / credential | **CRITICAL** |
| XSS vector | **CRITICAL** |
| `console.log` in production | **HIGH** |
| Sensitive data in testid | **HIGH** |
| Weak input validation | **MEDIUM** |

---

## Security Gate (Every Commit)

```
SECURITY GATE
=============
[ ] No hardcoded secrets (grep: API_KEY, SECRET, TOKEN, PASSWORD, sk-, pk_)
[ ] No console.log in production code
[ ] No sensitive data in data-testid values
[ ] No unvalidated user input reaching storage or DOM
[ ] Cookie operations use proper flags
[ ] API route handlers validate inputs
[ ] No TODO/FIXME/HACK in security-critical code

Result: [PASS / FAIL — list findings with severity]
```

If CRITICAL → auto-BLOCK, stop all work.
If HIGH → BLOCK merge, must fix.

---

## MCP Playwright Visual Verification

When ANY UI screen was changed:
1. `preview_start` — launch app
2. `preview_screenshot` — check RTL layout, no visual breaks
3. Navigate to changed screens: `preview_click`, `preview_fill` as needed
4. `preview_screenshot` at each changed screen
5. `preview_console_logs` — verify no runtime errors
6. `preview_stop`

Report result in `Visual:` field of verification report.

---

## CI Final Verification (Pre-PR Gate)

Before declaring a PR READY:
```bash
npm run test:qa 2>&1 | tail -50
```

Must confirm ALL pass:
- [ ] Lint: PASS
- [ ] TestIDs: PASS
- [ ] Build: PASS
- [ ] Unit tests: PASS (0 failures)
- [ ] E2E tests: PASS (0 failures)

**Do NOT declare READY if any CI check fails.** Fix and re-run.

---

## Code Conventions

### TypeScript
- Strict mode, no `any` — use type guards
- `@/*` path alias for imports
- `const`, early returns, clear naming

### Next.js / React
- Thin `app/**/page.tsx` (server-first), delegate to `components/screens/**`
- `"use client"` only when necessary
- No new global providers

### UI / Tailwind
- Reuse: `Surface`, `Button`, `ButtonLink`, `Chip`, `HeroHeader`, `CenteredPanel`
- RTL default, `dir="ltr"` only for math inputs
- Touch targets 44-52px, `:focus-visible` patterns

### `data-testid`
- All interactive elements must have `data-testid`
- Use `lib/testIds.ts` — prefix `km.`
- Screen roots: `testIds.screen.*.root(...)`, nested: `childTid()`
- No Hebrew text in test IDs

### Storage
- Versioned schemas, additive changes only
- Key format: `kids_math.<domain>.v<schema>.grade.${grade}`
- Sanitize loaded payloads, fail-safe to defaults

### Routes
- Use `lib/routes.ts` route builders — never hardcode paths

---

## Handoff Format (Every Response)

```markdown
### Mode
PRO / ULTRA / MAX — reason

### Findings
- 3-7 bullets, CONCRETE (file path + function + decision)

### Files
- Exact file paths touched or inspected

### Cross-File Impact
- Files importing from changed modules (from grep)
- If >5 files: flag HIGH IMPACT

### Decisions
- Trade-offs chosen and WHY

### Self-Review
- Issues caught and fixed during self-review (or "clean")

### Review Team (ULTRA/MAX)
| Role | Participated | Finding | Verdict |
|------|-------------|---------|---------|
| SeniorDev_TechLead | ✅ | ... | APPROVE |
...

### Verification Report (ULTRA/MAX)
[Full report — see format above]

### Caveats & Open Questions
- What was NOT done and why
- Open questions pending user guidance

### Next Actions
- Ordered list another agent can execute

### For Next Agent
- Context: [1-2 sentence task state summary]
- Read these files: [recently changed files]
- Known issues: [blockers or caveats]
- Verify: [what to double-check]

### Learning Update
- Entry for docs/LEARNING_LOG.md (ULTRA/MAX: mandatory or state "No new learning — [reason]")
```

---

## Escalation Template

When discovering the task needs a higher mode:

```
⚠️ MODE ESCALATION

Current mode: [PRO/ULTRA]
Recommended: [ULTRA/MAX]

Reason:
- [Concrete finding that triggered escalation]
- [Which rule requires the higher mode]

Impact:
- Quality gates will add: [specific commands]
- Review team will expand to: [list roles]
- Additional checkpoints: [list]

Next step: Should I replan in [mode]? (yes / stay with justification)
```

---

## Key Reference Files

| File | Purpose |
|------|---------|
| **`AGENTS.md`** | Universal workflow (modes, gates, roles, conventions) — READ FIRST |
| **`.cursor/rules/agent-guidelines.mdc`** | Core conventions (all agents) |
| **`.cursor/rules/quality-gates.mdc`** | Quality gates + verification report |
| **`.cursor/rules/multi-agent-playbook.mdc`** | Roles, teams, handoff format |
| **`.cursor/rules/testids.mdc`** | data-testid conventions |
| **`.cursor/rules/add-grade.mdc`** | Adding grades (MAX mode) |
| **`.cursor/rules/timed-exam-session.mdc`** | Adding timed exams |
| **`.cursor/rules/build-school-year.mdc`** | Building curriculum content |
| **`docs/LEARNING_LOG.md`** | Project decisions and learnings |
| **`docs/DEPLOYMENT.md`** | Deploy procedures |

---

## Commands

```bash
npm run dev              # Dev server (port 3000)
npm run dev:clean        # Clear .next cache + dev
npm run lint             # ESLint
npm run check:testids    # Test ID coverage
npm run build            # Production build
npm run test:unit        # Vitest unit tests
npm run test:e2e         # Playwright E2E tests (needs running server)
npm run test:qa          # Full QA: lint + unit + build + E2E
```
