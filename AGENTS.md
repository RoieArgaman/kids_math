# AGENTS.md — Universal Agent Workflow (kids_math)

> **This file is the single source of truth for all AI agents working on this repo.**
> Claude Code reads `CLAUDE.md` → this. Cursor reads `.cursor/rules/` → this. Devin reads `.devin/guidelines.md` → this.

---

## Table of Contents

1. [Project Snapshot](#project-snapshot)
2. [Mandatory Behaviors (All Modes)](#mandatory-behaviors-all-modes)
3. [Workflow Modes (PRO / ULTRA / MAX)](#workflow-modes)
4. [Phase Checkpoints (Blocking)](#phase-checkpoints-blocking)
5. [Mode Selection Rules](#mode-selection-rules)
6. [Quality Gates by Mode](#quality-gates-by-mode)
7. [Verification Report](#verification-report)
8. [Review Severity Levels](#review-severity-levels)
9. [Self-Review Protocol](#self-review-protocol)
10. [Role Definitions](#role-definitions)
11. [Multi-Role Review Process](#multi-role-review-process)
12. [Handoff Format](#handoff-format)
13. [Escalation Playbook](#escalation-playbook)
14. [Code Conventions](#code-conventions)
15. [Testing Strategy](#testing-strategy)
16. [Security Gate](#security-gate)
17. [Data & Storage Rules](#data--storage-rules)
18. [Routing & Navigation](#routing--navigation)
19. [UI & Accessibility](#ui--accessibility)
20. [Git & PR Rules](#git--pr-rules)
21. [Learning Loop](#learning-loop)
22. [Domain-Specific Checklists](#domain-specific-checklists)
23. [Agent-Specific Entry Points](#agent-specific-entry-points)

---

## Project Snapshot

- **App**: Daily math workbook for Israeli elementary students (Grades 1-2)
- **Stack**: Next.js 14 App Router, React 18, TypeScript (strict), Tailwind CSS
- **Language**: Hebrew RTL UI (`<html lang="he" dir="rtl">`)
- **State**: localStorage (no Redux/Zustand) — keys namespaced `kids_math.*`
- **Tests**: Vitest (unit) + Playwright (E2E, Chromium)
- **Deploy**: Firebase App Hosting (Node 20, Blaze plan)
- **CI**: GitHub Actions (lint, testids, build, unit, E2E)
- **Path alias**: `@/*` (per tsconfig.json)

### Key Directories

```
app/                  # Next.js routes (thin server pages → client screens)
components/           # React components (screens/, ui/, exercises/, timed-exam/, layout/, legal/)
lib/                  # Shared logic (content/, progress/, badges/, final-exam/, gmat-challenge/, exam-session/, hooks/, utils/, types/, analytics/, admin/)
tests/unit/           # Vitest unit tests
tests/e2e/            # Playwright E2E tests
docs/                 # Learning log, pedagogy docs, deployment guide
scripts/              # Codemods (testid checks, auto-add, dedupe)
.cursor/rules/        # Agent rules (apply to ALL agents)
```

---

## Mandatory Behaviors (All Modes)

These rules apply to EVERY task, regardless of mode. No exceptions.

### 1. Research Before Writing (mandatory)
Before modifying ANY file:
- **Read the file first** — understand existing code before changing it
- **Search for existing patterns** — grep for similar implementations in the codebase
- **Check helpers/utils** — reuse existing functions from `lib/`, don't reinvent
- **Check learning log** — read `docs/LEARNING_LOG.md` for relevant past decisions
- **Check agent rules** — read relevant `.cursor/rules/*.mdc` for domain conventions
- **Check cross-file dependencies** — grep for all files that import from files you plan to change:
  ```bash
  grep -r "from.*<module-path>" --include="*.ts" --include="*.tsx" .
  ```
  If >5 files import from a changed module → flag as HIGH IMPACT in your risk assessment.

### 2. State Your Mode (mandatory)
Every response that involves code changes must begin with:
> **Mode: [PRO/ULTRA/MAX]** — [one-line reason]

### 3. Minimal Diffs (mandatory)
- Make the smallest correct change
- No drive-by refactors, no "while I'm here" improvements
- No adding comments, docstrings, or type annotations to unchanged code
- Don't create abstractions for one-time operations

**Diff size guidelines:**
| Mode | Max files | Max insertions | Exceeding limit |
|------|-----------|---------------|-----------------|
| PRO | 2 files | 50 lines | Justify in Decisions OR escalate to ULTRA |
| ULTRA | 8 files | 300 lines | Justify in Decisions OR escalate to MAX |
| MAX | No limit | No limit | Each file must have rationale in Decisions |

### 4. Never Weaken Configs (mandatory)
- Don't modify `.eslintrc`, `tsconfig.json`, `tailwind.config`, `next.config`, `playwright.config`, `vitest.config` to suppress errors
- Fix the code, not the config
- If a config change is truly needed: explain why, get explicit user approval

### 5. No Secrets in Code (mandatory)
- Never hardcode API keys, passwords, tokens, or credentials
- Never commit `.env` files or files containing secrets
- If you FIND a secret in existing code: **STOP, flag it as CRITICAL, do not proceed**

### 6. Preserve Backward Compatibility (mandatory)
- localStorage schemas are versioned — additive changes only
- If schema must change: version bump + migration + MAX mode
- **Storage file detection**: if you edit any file under `lib/*/storage.ts`, auto-escalate to MAX mode

### 7. Self-Review Before Handoff (mandatory)
Every agent must review its own work before responding. See [Self-Review Protocol](#self-review-protocol).

---

## Workflow Modes

### PRO Mode (Fast & Focused)

**When**: Small, well-scoped tasks — single file edits, copy changes, isolated UI tweaks, bug fixes in one module, adding a test.

**Process**:
1. **Research** — read relevant files, check patterns and helpers
2. **Implement** — make the smallest correct change
3. **Self-review** — run Self-Review Protocol (catch your own mistakes)
4. **Verify** — run quality gates
5. **Output** — handoff format

**Review**: Self-review only (no multi-role loop)
**Roles active**: Implementer + self-review

**PRO self-review escalation**: If during self-review you discover ANY of these, escalate to ULTRA:
- Potential RTL/a11y regression
- Potential storage schema impact
- Change affects >2 files
- Cross-file dependency impact >3 files

---

### ULTRA Mode (Rigorous & Multi-perspective)

**When**: Multi-file changes, new features, logic changes, UI changes affecting multiple screens.

**Process**:
1. **Plan** — clarify goal, risks, files, validation steps
2. ⛔ **CHECKPOINT: Plan Review** — present plan, get multi-role input, WAIT for user to confirm
3. **Explore** — locate existing patterns, confirm assumptions by reading code
4. ⛔ **CHECKPOINT: Explore Findings** — present findings, WAIT for user to confirm approach
5. **Implement** — make changes following conventions, keep diffs minimal
6. **Self-review** — run Self-Review Protocol
7. **Multi-role Review** — 5 core roles review (1 cycle)
8. **Test** — run quality gates + targeted automation + manual RTL checklist
9. **Visual Verify** — MCP Playwright smoke test on changed screens (see MCP Playwright section)
10. **CI Final** — run `npm run test:qa` to confirm all CI checks pass
11. **Verify** — produce verification report (including Visual + CI Suite fields)
12. ⛔ **CHECKPOINT: Verification** — present report, WAIT for user to approve
13. **Output** — handoff format + learning log entry

**Review**: One cycle with 5 core roles (all must participate)
**Roles active**: Planner, Explorer, Implementer, Reviewer (5 core), Tester

**Core review team (ULTRA)** — ALL 5 must participate:
- `SeniorDev_TechLead` — architecture, simplicity, maintainability
- `SeniorFrontEnd_TechLead` — UI patterns, RTL, accessibility
- `Dev_Architect` — data flow, server/client boundaries, storage
- `QA_Architect` — test strategy, coverage sufficiency
- `SeniorAutomation_Engineer` — which tests to add/update

---

### MAX Mode (Full Rigor, Zero Gaps)

**When**: Routing/middleware/gates, schema migrations, final-exam/unlock flow, new grades, broad refactors, security-sensitive changes.

**Process**:
1. **Plan** — full multi-role plan with ALL specialist roles contributing
2. ⛔ **CHECKPOINT: Plan Review Round 1** — all roles review plan, produce punch-list
3. **Plan Revision** — address all plan-level issues
4. ⛔ **CHECKPOINT: Plan Review Round 2** — re-review plan, all roles must approve
5. ⛔ **CHECKPOINT: User Confirmation** — present final plan, WAIT for user to approve
6. **Explore** — comprehensive "where to change" map with risk annotations
7. ⛔ **CHECKPOINT: Explore Findings** — present findings, WAIT for user to confirm
8. **Implement** — changes with explicit rationale for every decision
9. **Self-review** — run Self-Review Protocol
10. **Review Cycle 1** — full team review, produce punch-list with severity levels
11. **Fix** — address all CRITICAL and HIGH issues
12. ⛔ **CHECKPOINT: Fixes Ready** — list fixes made, WAIT for user to confirm re-review
13. **Review Cycle 2** — re-review, all roles must approve
14. **If Cycle 2 still has CRITICAL/HIGH** → see [Escalation: Stuck Review Loop](#stuck-review-loop)
15. **Test (QA Multi-role Team)** — full automation + manual QA
16. **Visual Verify** — MCP Playwright full smoke test (all changed screens + critical paths)
17. **CI Final** — run `npm run test:qa` — must pass with zero failures
18. **Verify** — produce verification report (including Visual + CI Suite fields)
19. ⛔ **CHECKPOINT: Final Verification** — present report, WAIT for user to approve
20. **PR preparation** — summary, test plan, risk notes, migration notes
21. **Output** — handoff format + learning log + rule updates

**Review**: Up to 2 review cycles with full team, all must approve
**Roles active**: All roles

**Full review team (MAX)** — ALL must participate:
- `SeniorDev_TechLead`
- `SeniorFrontEnd_TechLead`
- `Dev_Architect`
- `QA_Architect`
- `SeniorAutomation_Engineer`
- `SeniorQA_Engineer`
- `SeniorProductDesigner`
- `SeniorProductManager`
- (+ `MoE_PedagogyLead` when educational content changes)

**QA team (MAX)** — ALL must participate:
- `SeniorAutomation_Engineer`
- `SeniorAutomation_TechLead`
- `SeniorManualQA_Engineer`
- `UX_QA_Engineer`
- `QA_Architect`

---

## Phase Checkpoints (Blocking)

⛔ Checkpoints are **blocking** — the agent MUST stop and wait for user confirmation before proceeding. No checkpoint may be skipped.

### Checkpoint Format (use this template exactly)

```
---
⛔ CHECKPOINT: [Phase Name]
Status: [COMPLETE / NEEDS REVISION]

Summary: [1-2 sentence description of what was done]

Checklist:
[X] [requirement 1]
[X] [requirement 2]
[ ] [requirement not met — explain why]

Roles participated: [list roles that contributed, ULTRA/MAX only]

Ready for next phase? Awaiting your confirmation.
Options: (proceed / revise / different approach / escalate mode)
---
```

### When Checkpoints Apply

| Mode | Checkpoints Required |
|------|---------------------|
| PRO | None (self-review only) |
| ULTRA | After Plan, after Explore, after Verification |
| MAX | After Plan R1, after Plan R2, User Confirm, after Explore, after Fixes, after Verification |

---

## Mode Selection Rules

Use these rules to determine the correct mode. **When in doubt, go one level up.**

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

### Escalation Rule

If during ANY phase you discover the task is bigger than the selected mode allows:

1. **STOP** — do not continue implementation
2. **Report** what was discovered (concrete finding)
3. **Recommend** the correct mode with reason
4. **Ask**: "Should I replan in [ULTRA/MAX]? (yes / stay in current mode with justification)"
5. **WAIT** for user response

**Auto-escalation triggers** (no user confirmation needed, just inform):
- Editing any `lib/*/storage.ts` file → auto-escalate to MAX
- Diff exceeds mode limit → escalate one level
- Security finding discovered → auto-escalate to MAX

---

## Quality Gates by Mode

### PRO Quality Gates
```bash
npm run lint
npm run check:testids
# If behavior changed:
npm run build
# If logic changed:
npm run test:unit -- <relevant-test-file>
```

### ULTRA Quality Gates
```bash
npm run lint
npm run check:testids
npm run build
npm run test:unit
# Targeted E2E (MUST specify which specs):
npm run test:e2e -- <spec-files>
```

### MAX Quality Gates
```bash
npm run test:qa   # = lint + check:testids + build + unit + E2E (full suite, no exceptions)
```

### Mandatory Test Targeting (not "targeted" — specific)

| Changed Area | Must Run These Tests |
|-------------|---------------------|
| UI copy/layout in 1 component | `npm run test:e2e -- tests/e2e/day-smoke.spec.ts` |
| Routing/gates/middleware | `npm run test:e2e -- tests/e2e/grade-b.spec.ts tests/e2e/grade-a-lifecycle.spec.ts tests/e2e/admin-progress.spec.ts` |
| Progress/storage/engine | `npm run test:unit -- tests/unit/lib/progress/` AND `npm run test:e2e -- tests/e2e/grade-a-lifecycle.spec.ts` |
| Final exam logic | `npm run test:unit -- tests/unit/lib/final-exam/` AND `npm run test:e2e -- tests/e2e/grade-a-lifecycle.spec.ts tests/e2e/grade-b-lifecycle.spec.ts` |
| Content/day generation | `npm run test:unit -- tests/unit/lib/content/content-validity.test.ts` AND `npm run test:e2e -- tests/e2e/day-smoke.spec.ts` |
| GMAT challenge | `npm run test:unit -- tests/unit/lib/gmat-challenge/` AND `npm run test:e2e -- tests/e2e/gmat-challenge.spec.ts` |
| Badges | `npm run test:unit -- tests/unit/lib/badges/` |

### When to Add Tests

| Situation | Requirement |
|-----------|------------|
| Logic in `lib/progress/`, `lib/final-exam/`, `lib/gmat-challenge/` | MUST add/update unit tests |
| New exercise types or content builders | MUST add content validity test |
| Storage serialization/deserialization | MUST add unit test |
| New hooks (`lib/hooks/`) | SHOULD add unit test |
| Route builders or routing changes | SHOULD add E2E coverage |
| Copy/style changes only | OPTIONAL |
| Trivial helpers (<3 lines) | OPTIONAL |

---

## Verification Report

After running quality gates, produce this report. **Mandatory for ULTRA/MAX, recommended for PRO.**

```
VERIFICATION REPORT (kids_math)
================================
Mode:        [PRO/ULTRA/MAX]
Changed:     [brief description of what changed]

Lint:        [PASS/FAIL] (details if fail)
TestIDs:     [PASS/FAIL] (details if fail)
Build:       [PASS/FAIL/SKIPPED — reason] (details if fail)
Unit:        [PASS/FAIL/SKIPPED — reason] (X passed, Y failed, Z% coverage)
E2E:         [PASS/FAIL/SKIPPED — reason] (X passed, Y failed; specs: list.spec.ts)
Security:    [PASS/FAIL] (see Security Gate checklist below)
Visual:      [PASS/FAIL/SKIPPED — reason] (screens checked: list)
CI Suite:    [PASS/FAIL] (lint ✓, testids ✓, build ✓, unit X/X ✓, e2e X/X ✓)
Diff:        [X files, Y insertions, Z deletions]

Learning:    [YES — summary / NO — reason skipped]

Overall:     [READY / NOT READY]
```

### "Overall" Decision Tree (no ambiguity)

Mark **READY** if ALL of these are true:
- [ ] Zero CRITICAL issues
- [ ] Zero HIGH issues
- [ ] All quality gates PASS (or SKIPPED with valid reason per mode)
- [ ] Security gate PASS
- [ ] Visual verification PASS (or SKIPPED with valid reason)
- [ ] CI suite PASS (ULTRA/MAX: full `test:qa` must pass)
- [ ] Verification report 100% filled (no blank fields)
- [ ] Self-review completed
- [ ] Learning log updated (ULTRA/MAX) or skip justified

Mark **NOT READY** if ANY:
- [ ] Any CRITICAL issue → auto-BLOCK
- [ ] Any HIGH issue → BLOCK (must fix)
- [ ] Any quality gate FAIL → BLOCK (must fix)
- [ ] Security gate FAIL → BLOCK (must fix)
- [ ] Verification report incomplete → NOT READY (complete it first)

**SKIPPED fields must always include a reason in brackets:**
- VALID: `Unit: SKIPPED [PRO mode, only copy changed, no logic affected]`
- INVALID: `Unit: SKIPPED`

---

## Review Severity Levels

All agents must use these levels consistently in ALL reviews:

| Level | Meaning | Action | Auto-block? |
|-------|---------|--------|------------|
| **CRITICAL** | Security vuln, data loss, broken gate/unlock, hardcoded secret | **BLOCK** — must fix, no exceptions | YES |
| **HIGH** | Bug, test failure, type error, broken user flow, schema breakage | **BLOCK** — must fix before merge | YES |
| **MEDIUM** | Warning, missing test, minor regression, a11y concern | **WARN** — should fix, can merge with justification | NO |
| **LOW** | Style suggestion, minor improvement, optional | **NOTE** — optional, don't block | NO |

### Security Finding Severity (specific)

| Finding | Severity |
|---------|----------|
| Hardcoded API key, password, token, credential | **CRITICAL** |
| Private/internal endpoint exposed | **CRITICAL** |
| XSS vector (unescaped user input in HTML) | **CRITICAL** |
| `console.log` in production code | **HIGH** |
| Sensitive data in `data-testid` or analytics | **HIGH** |
| TODO/FIXME in security-critical code | **HIGH** |
| Weak input validation | **MEDIUM** |
| Overly permissive cookie flags | **MEDIUM** |

---

## Self-Review Protocol

**Every agent must run this protocol before producing the final response.** This is how agents catch their own mistakes.

### Self-Review Checklist (run mentally before responding)

```
SELF-REVIEW (before handoff)
=============================
[ ] Did I read all relevant files BEFORE making changes?
[ ] Did I check for existing patterns/helpers I could reuse?
[ ] Did I check cross-file dependencies (grep for imports)?
[ ] Is my diff minimal? (within mode size limits)
[ ] Did I avoid weakening any config files?
[ ] No console.log in production code?
[ ] No hardcoded secrets?
[ ] All interactive elements have data-testid via lib/testIds.ts?
[ ] Route references use lib/routes.ts (no hardcoded paths)?
[ ] Storage schemas unchanged OR migration included?
[ ] RTL preserved? dir="ltr" only for math inputs?
[ ] "use client" only where necessary?
[ ] @/* imports used?
[ ] TypeScript strict — no any?
[ ] Quality gates ran and all pass?
[ ] Verification report filled completely (ULTRA/MAX)?
[ ] Learning log updated (ULTRA/MAX) or skip justified?

Issues found during self-review:
- [list any issues you caught and fixed]
```

**If self-review catches issues**: Fix them BEFORE responding. Document what you caught in the handoff "Self-Review" section.

**If self-review reveals mode should escalate**: STOP and escalate (see Escalation Playbook).

---

## Role Definitions

### Core Roles (always available)

#### Planner
- Clarify goal, constraints, definition of done
- Identify files, risks (storage schema, RTL, a11y), validation steps
- **Output**: plan + risk table + checklist + WAIT for user

#### Explorer
- Search codebase for real patterns (routing, storage, analytics, UI tokens)
- Check cross-file dependencies for planned changes
- Cite concrete file paths and existing helpers
- **Output**: "where to change" map + cross-file impact + constraints + WAIT for user

#### Implementer
- Make the smallest correct change matching conventions
- **Research before writing**: read file, grep for patterns, check helpers, check learning log
- Keep diffs readable, no drive-by refactors
- Run Self-Review Protocol before handoff
- **Output**: code changes + rationale + self-review findings

#### Reviewer
- Review diff for correctness, edge cases, readability, convention alignment
- Check for: schema breakage, `"use client"` spread, RTL regressions, a11y, untyped payloads, console.log, config weakening, security
- Use severity levels (CRITICAL/HIGH/MEDIUM/LOW) for every finding
- **Output**: punch-list with severity + role attribution + approval/block

#### Tester (QA)
- Run automated checks per mode
- Specify WHICH tests were run (not "targeted E2E" — list exact spec files)
- Write manual RTL test plan
- Attempt to add/modify test coverage
- **Output**: commands run with output + manual checklist + repro steps for failures

#### Release/PR
- Prepare PR text: summary + test plan + risk notes
- Verify no secrets or generated files in scope
- **Output**: PR body draft + merge readiness checklist

### Specialist Roles (ULTRA/MAX only)

| Role | Focus | Must Participate In |
|------|-------|-------------------|
| `SeniorDev_TechLead` | Architecture boundaries, simplicity, maintainability | ULTRA Plan+Review, MAX all |
| `SeniorFrontEnd_TechLead` | UI patterns, Tailwind tokens, RTL, accessibility | ULTRA Plan+Review, MAX all |
| `Dev_Architect` | `app/` vs `components/` vs `lib/` boundaries, data flow, side effects | ULTRA Plan+Review, MAX all |
| `QA_Architect` | Test strategy for risky changes (state, progress, analytics) | ULTRA Plan+Review, MAX all |
| `SeniorAutomation_Engineer` | Most valuable automated coverage, stable selectors | ULTRA Plan+Review, MAX all |
| `SeniorAutomation_TechLead` | Test maintainability, flakiness mitigation, shared helpers | MAX only |
| `SeniorManualQA_Engineer` | Step-by-step RTL manual test script, edge cases | MAX only |
| `UX_QA_Engineer` | Focus order, keyboard nav, touch ergonomics, error clarity | MAX only |
| `SeniorQA_Engineer` | Edge cases, failure modes, manual checklist | MAX only |
| `SeniorProductDesigner` | Visual consistency, tokens, accessibility, touch-first | MAX only |
| `SeniorProductManager` | User value, acceptance criteria, scope control | MAX only |
| `MoE_PedagogyLead` | Exercise content, learning progressions, MoE syllabus alignment | When educational content changes |

---

## Multi-Role Review Process

### Role Participation Tracking (mandatory for ULTRA/MAX)

Every review output must include a role participation table:

```
### Review Team Participation
| Role | Participated | Finding | Verdict |
|------|-------------|---------|---------|
| SeniorDev_TechLead | ✅ | [1-line summary] | APPROVE / BLOCK(severity) |
| SeniorFrontEnd_TechLead | ✅ | [1-line summary] | APPROVE / BLOCK(severity) |
| Dev_Architect | ✅ | [1-line summary] | APPROVE / BLOCK(severity) |
| QA_Architect | ✅ | [1-line summary] | APPROVE / BLOCK(severity) |
| SeniorAutomation_Engineer | ✅ | [1-line summary] | APPROVE / BLOCK(severity) |
```

**Rules:**
- ULTRA: ALL 5 core roles must participate. If any is "not applicable" for this change, mark as `N/A — [reason]` but still list it.
- MAX: ALL roles in the full team must participate.
- A single role with BLOCK(CRITICAL) → entire review is BLOCKED.
- A single role with BLOCK(HIGH) → entire review is BLOCKED.

### Multi-Role Plan Input Example

Each role contributes 1-3 bullets with role attribution:

```
**SeniorDev_TechLead:**
"Architecture: storing exam state in localStorage per grade (kids_math.final_exam.v1.grade.*)
 is consistent with progress schema. Risk: if exam question count changes, need migration."

**SeniorFrontEnd_TechLead:**
"UI: reuse TimedExamSectionHeader component. RTL concern: review button stack in results panel."

**Dev_Architect:**
"Data flow: exam picker reads from workbook, writes to localStorage. Server boundary:
 no API calls needed. Side effect: unlock-grade-b POST on pass — must await before CTA."

**QA_Architect:**
"Test strategy: unit tests for picker + grading + storage. E2E for full exam flow +
 grade-b unlock. Edge case: 10-wrong reset during exam."

**SeniorAutomation_Engineer:**
"Add tests: tests/unit/lib/final-exam/picker.test.ts, extend grade-a-lifecycle.spec.ts
 with exam completion scenario. Use data-testid selectors only."
```

### Review & Fix Loop (MAX only)

1. **Review Cycle 1** — all roles review, produce punch-list with severity
2. **Agent fixes** all CRITICAL and HIGH issues
3. ⛔ **CHECKPOINT** — list fixes made, wait for user confirmation
4. **Review Cycle 2** — re-review only flagged items, all roles must approve

#### Stuck Review Loop (if Cycle 2 still has issues)

If Review Cycle 2 still has CRITICAL issues:
→ **BLOCK** — escalate to user with full punch-list, do NOT proceed

If Review Cycle 2 still has HIGH issues:
→ Agent proposes fix + asks user: "Allow Cycle 3 (exception) OR defer this change?"

If roles DISAGREE on severity:
→ Escalate to `SeniorProductManager` for final call, document dissent in handoff

---

## Handoff Format

**Every agent response must include these sections.** Mandatory for ULTRA/MAX, recommended for PRO.

```markdown
### Mode
[PRO/ULTRA/MAX] — [reason]

### Findings
- 3-7 bullets, CONCRETE (must include: file path + specific function/pattern + decision)
- VAGUE (bad): "UI patterns are reused"
- CONCRETE (good): "Reused `testIds.screen.day.root(dayId)` from lib/testIds.ts for day-screen anchor"

### Files
- Exact file paths touched or inspected

### Cross-File Impact
- Files that import from changed modules (from dependency check)
- If >5 files affected, flag as HIGH IMPACT

### Decisions
- Trade-offs chosen and WHY (not just what)

### Self-Review
- Issues caught and fixed during self-review
- "Self-review clean" if nothing found

### Review Team (ULTRA/MAX)
[Role participation table — see Multi-Role Review Process]

### Verification Report (ULTRA/MAX)
[Full verification report — see format above]

### Caveats & Open Questions
- What was NOT done and why
- Open questions pending user guidance
- Known limitations or deferred decisions
- If nothing: "No caveats."

### Next Actions
- Ordered list another agent can execute

### For Next Agent
- Context: [1-2 sentence summary of task state]
- Read these files: [list of most recently changed files]
- Known issues: [blockers/caveats for the next agent]
- Verify: [what the next agent should double-check]

### Learning Update
- Entry for `docs/LEARNING_LOG.md` (if something was learned)
- Rule update for `.cursor/rules/` or `AGENTS.md` (if convention is stable)
- ULTRA/MAX: MUST include entry OR state: "No new learning — [reason]"
```

---

## Escalation Playbook

### Mode Escalation (PRO → ULTRA → MAX)

When you discover the task needs a higher mode:

```
⚠️ MODE ESCALATION

Current mode: [PRO/ULTRA]
Recommended: [ULTRA/MAX]

Reason:
- [Concrete finding that triggered escalation]
- [Which mandatory behavior or rule requires the higher mode]

Impact of escalation:
- Quality gates will add: [specific commands]
- Review team will expand to: [list roles]
- Additional checkpoints: [list]

Next step: Should I replan in [mode]? (yes / stay in current mode with justification)
```

### Auto-Escalation (no user confirmation needed, just inform)

| Trigger | Escalate To | Action |
|---------|------------|--------|
| Editing `lib/*/storage.ts` | MAX | Inform user, switch mode |
| Diff exceeds mode size limit | +1 level | Inform user, switch mode |
| Security finding (CRITICAL) | MAX | Inform user, STOP, switch mode |
| Cross-file impact >5 files | ULTRA minimum | Inform user, switch mode |

### Security Escalation

If a CRITICAL security finding is discovered at any point:
1. **STOP** all implementation immediately
2. Report: "CRITICAL SECURITY FINDING: [description]"
3. Auto-escalate to MAX mode
4. Fix the security issue BEFORE any other work
5. After fix: re-run full security gate

---

## Code Conventions

### TypeScript
- Strict mode, no `any` — narrow unknowns with type guards
- Prefer `const`, early returns, clear naming
- Use `@/*` path alias for imports
- Keep functions pure when possible; isolate IO

### Next.js / React
- App Router: routes in `app/**/page.tsx` and `app/**/layout.tsx`
- Route files are thin and server-first: parse params, delegate to client screens
- `"use client"` only when necessary
- No new global providers unless required
- Client state in `components/screens/**` and `lib/hooks/**`

### UI / Tailwind
- Reuse existing design tokens from `app/globals.css` and `tailwind.config.ts`
- Reuse UI primitives: `Surface`, `Button`, `ButtonLink`, `Chip`, `HeroHeader`, `CenteredPanel`
- Visible focus styles (`:focus-visible`), touch targets 44-52px
- RTL by default; `dir="ltr"` only for math inputs/expressions

### `data-testid`
- All interactive elements must have `data-testid`
- Build IDs using `lib/testIds.ts` helper — prefix `km.`
- Screen roots use `testIds.screen.*.root(...)`, nested elements use `childTid()`
- No Hebrew/localized text in test IDs
- Run `npm run check:testids` before handoff

### Analytics
- Use `lib/analytics/events.ts` only — no new storage keys or event pipelines
- Keep payloads small and typed, never log sensitive data

---

## Testing Strategy

### Unit Tests (Vitest)
- Location: `tests/unit/`
- Config: `vitest.config.ts` (jsdom environment)
- Run: `npm run test:unit`

### E2E Tests (Playwright)
- Location: `tests/e2e/`
- Config: `playwright.config.ts` (Chromium, 4 workers, port 3005 local / 3000 CI)
- Run: `npm run test:e2e`
- Selectors: `getByTestId()` first, never brittle XPath or content-derived selectors
- Retries: 2 in CI, 0 locally

### Adding Tests
- Prefer extending existing tests over adding duplicate coverage
- Use `tests/e2e/testUtils.ts` and `tests/e2e/answering.ts` for shared helpers
- Use `data-testid` based selectors exclusively
- In verification report: list EXACT spec files run (not "targeted E2E")

---

## Security Gate

Security is a **gate**, not just a checklist. Findings auto-block based on severity.

### Security Scan (run before every handoff)

```
SECURITY GATE
==============
[ ] No hardcoded secrets — grep for: API_KEY, SECRET, TOKEN, PASSWORD, sk-, pk_
[ ] No console.log in production code (non-test .ts/.tsx files)
[ ] No sensitive data in data-testid values
[ ] No unvalidated user input reaching storage or DOM
[ ] Cookie operations use proper flags (httpOnly, secure, sameSite)
[ ] API route handlers validate inputs
[ ] No TODO/FIXME/HACK in security-critical code paths

Result: [PASS / FAIL — list findings with severity]
```

**If ANY CRITICAL finding**: auto-BLOCK, stop all work, fix immediately.
**If ANY HIGH finding**: BLOCK merge, must fix before proceeding.

---

## Data & Storage Rules

- Persisted schemas are versioned — prefer additive changes
- Breaking changes require version bump + migration path
- Key format: `kids_math.<domain>.v<schema>.grade.${grade}`
- Sanitize loaded payloads, fail-safe to defaults on parse errors

### Storage Files (editing any of these = auto-escalate to MAX)
- `lib/progress/storage.ts`
- `lib/final-exam/storage.ts`
- `lib/gmat-challenge/storage.ts`
- `lib/badges/storage.ts`
- `lib/streak/storage.ts`

### Storage Change Requirements (MAX mode)
- [ ] Schema version number incremented
- [ ] Migration function written for old → new shape
- [ ] Migration unit test added
- [ ] Backward compatibility verified (old data still loads)

---

## Routing & Navigation

- Use route builders from `lib/routes.ts` — never hardcode paths
- Preserve query state (e.g., `previewAll=1`) through helpers
- Grade B gated by middleware (`middleware.ts`) + cookie `kids_math.unlocked_grade_b=1`
- Legacy day URLs (`/day/[id]`) are hardwired to grade A only

---

## UI & Accessibility

- RTL is default (`dir="rtl"`) — use `dir="ltr"` only for math inputs
- Hebrew font: Rubik (via `next/font`)
- Focus styles: `:focus-visible` patterns throughout
- Touch targets: 44-52px minimum
- Cookie consent banner in root layout
- Guard browser-only state (window, localStorage, URL) until hydrated

---

## Git & PR Rules

- Keep changes focused and reviewable
- PR descriptions must include: summary, test plan, risk notes (storage/analytics)
- No force-push to main
- Branch protection + required CI
- Commit messages: describe the "why" not just the "what"

---

## Learning Loop

### Mandatory for ULTRA/MAX

Every ULTRA/MAX task must produce at least 1 learning entry OR explicitly state:
> "No new learning — [reason: e.g., mechanical change, well-documented pattern]"

This is tracked in the verification report `Learning:` field.

### When to Write

Append to `docs/LEARNING_LOG.md` when you:
- Discover a new repo convention
- Fix a tricky bug (especially cookie gating, storage, RTL)
- Learn something that saves future investigation time
- Make a decision due to constraints

### Format

```markdown
### YYYY-MM-DD (short title)
- **Trigger:** (what request led to this learning)
- **What changed / where:** (file paths)
- **What we learned:** (1-4 bullets, concrete)
- **How to reuse next time:** (rule of thumb)
```

### Cross-Agent Rule Updates

If a learning is stable and recurring, update:
1. `AGENTS.md` first (universal)
2. `.cursor/rules/*.mdc` (domain-specific details)
3. Reference from `CLAUDE.md` and `.devin/guidelines.md`

---

## Domain-Specific Checklists

### Adding a New Grade
**Mode: MAX** — Follow `.cursor/rules/add-grade.mdc`

### Adding a New Timed Exam
**Mode: ULTRA** — Follow `.cursor/rules/timed-exam-session.mdc`

### Building School Year Content
**Mode: ULTRA or MAX** — Follow `.cursor/rules/build-school-year.mdc`

### Educational Content Changes
**Mode: ULTRA minimum** — Must include `MoE_PedagogyLead` verification against Israeli MoE syllabus

---

## Agent-Specific Entry Points

| Agent | Entry File | Auto-enforcement |
|-------|-----------|-----------------|
| **Claude Code** | `CLAUDE.md` → `AGENTS.md` | Hooks in `.claude/settings.json` (typecheck, console.log, config protection, --no-verify block) |
| **Cursor** | `.cursor/rules/*.mdc` → `AGENTS.md` | alwaysApply rules auto-loaded |
| **Devin** | `.devin/guidelines.md` → `AGENTS.md` | Manual compliance |
| **Codex / Other** | `AGENTS.md` (direct) | Manual compliance |

### Claude Code Slash Commands
- `/plan` — Structured plan with multi-role input, waits for confirmation
- `/verify` — Verification loop with PASS/FAIL report
- `/review` — Multi-role review with severity levels

---

## MCP Playwright Visual Verification

After quality gates pass, agents with MCP Playwright access **must** do a visual smoke test.

### When to Run (mandatory)

| Mode | Requirement |
|------|------------|
| PRO | SKIP — unless UI was changed |
| ULTRA | Required if ANY UI/component was changed |
| MAX | Always required |

### Visual Verification Steps

```
MCP PLAYWRIGHT VERIFICATION
=============================
1. Start preview:     preview_start (launches the app)
2. Screenshot home:   preview_screenshot → verify RTL layout, no visual breaks
3. Navigate to changed screen(s):
   - preview_click / preview_fill as needed
   - preview_screenshot at each step
4. Verify:
   - [ ] RTL layout correct (Hebrew text flows right-to-left)
   - [ ] No overlapping elements or broken layouts
   - [ ] Touch targets visually adequate (buttons not too small)
   - [ ] Changed UI matches expected behavior
   - [ ] No console errors: preview_console_logs
5. Stop preview:      preview_stop

Result: [PASS / FAIL — describe visual issues found]
```

### Visual Verification in Reports

Add to the verification report:
```
Visual:      [PASS/FAIL/SKIPPED — reason] (screens checked: list)
```

**If FAIL**: treat as HIGH severity — must fix before merge.

---

## CI Final Verification (Pre-PR Gate)

Before declaring a PR **READY**, the agent must run the full CI suite locally to ensure the PR will pass CI.

### When to Run

| Mode | Requirement |
|------|------------|
| PRO | `npm run lint` + `npm run check:testids` + targeted tests |
| ULTRA | `npm run test:qa` (full suite) |
| MAX | `npm run test:qa` (full suite, no exceptions) |

### CI Verification Steps

```
CI FINAL VERIFICATION
======================
1. Run full CI suite:
   npm run test:qa 2>&1 | tail -50

2. Verify ALL pass:
   - [ ] Lint: PASS
   - [ ] TestIDs: PASS
   - [ ] Build: PASS
   - [ ] Unit tests: PASS (X passed, 0 failed)
   - [ ] E2E tests: PASS (X passed, 0 failed)

3. If ANY failure:
   - Fix the issue
   - Re-run the full suite
   - Do NOT declare READY until all pass

Result: [PASS / FAIL — details]
```

### CI Status in Reports

Add to the verification report:
```
CI Suite:    [PASS/FAIL] (lint ✓, testids ✓, build ✓, unit X/X ✓, e2e X/X ✓)
```

**A PR is NOT READY if CI suite has any failure.** No exceptions.

---

## Quick Reference Commands

```bash
npm run dev              # Local dev server (port 3000)
npm run dev:clean        # Clear .next cache + dev
npm run lint             # ESLint
npm run check:testids    # Verify data-testid coverage
npm run build            # Production build
npm run test:unit        # Vitest unit tests
npm run test:e2e         # Playwright E2E tests
npm run test:qa          # Full QA: lint + unit + build + E2E
```
