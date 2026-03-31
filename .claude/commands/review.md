---
description: Multi-role code review with severity levels, role tracking, and self-review.
---

# Review Command

Perform a thorough code review with multi-role team and structured output.

## Step 1: Understand Changes

```bash
git diff --stat
git diff HEAD
git log --oneline -5
```

Read every changed file completely before reviewing.

## Step 2: Determine Mode

Based on what changed, select PRO / ULTRA / MAX per `AGENTS.md` → Mode Selection Rules.

## Step 3: Cross-File Dependency Check

For each changed file:
```bash
grep -r "from.*<changed-module>" --include="*.ts" --include="*.tsx" .
```
Flag if >5 files import from a changed module.

## Step 4: Security Review (always, all modes)

```
SECURITY GATE
[ ] No hardcoded secrets (grep: API_KEY, SECRET, TOKEN, PASSWORD, sk-, pk_)
[ ] No console.log in production code
[ ] No sensitive data in data-testid values
[ ] User input validated at boundaries
[ ] Cookie operations safe
[ ] API route handlers validate inputs
[ ] No TODO/FIXME/HACK in security-critical code
```

Map findings to severity per `AGENTS.md` → Security Finding Severity.

## Step 5: Code Quality Review (always, all modes)

- [ ] TypeScript strict — no `any`, proper type guards
- [ ] Functions focused and small
- [ ] No deep nesting (>4 levels)
- [ ] Error handling explicit, not swallowed
- [ ] Follows existing conventions (imports, naming, structure)
- [ ] `@/*` imports used

## Step 6: kids_math Specific Review (always)

- [ ] RTL layout preserved
- [ ] `data-testid` on all interactive elements via `lib/testIds.ts`
- [ ] Route builders from `lib/routes.ts` (no hardcoded paths)
- [ ] `"use client"` only where necessary
- [ ] Storage schema backward-compatible (or migration + MAX mode)
- [ ] Touch targets >= 44px on new/changed buttons
- [ ] Reuses existing UI primitives (Surface, Button, Chip, etc.)

## Step 7: Multi-Role Review (ULTRA/MAX)

Each role reviews and produces findings with severity:

### ULTRA (5 core roles):
- `SeniorDev_TechLead` — architecture, boundaries
- `SeniorFrontEnd_TechLead` — UI patterns, RTL, a11y
- `Dev_Architect` — data flow, storage, server/client split
- `QA_Architect` — test coverage sufficiency
- `SeniorAutomation_Engineer` — test quality, selectors

### MAX (add):
- `SeniorQA_Engineer` — edge cases, manual test plan
- `SeniorProductDesigner` — visual consistency, UX
- `SeniorProductManager` — scope, user value
- `MoE_PedagogyLead` (if educational content) — syllabus check

## Step 8: Role Participation Table (ULTRA/MAX mandatory)

```
### Review Team Participation
| Role | Participated | Finding | Verdict |
|------|-------------|---------|---------|
| SeniorDev_TechLead | ✅ | [1-line] | APPROVE / BLOCK(severity) |
| SeniorFrontEnd_TechLead | ✅ | [1-line] | APPROVE / BLOCK(severity) |
| Dev_Architect | ✅ | [1-line] | APPROVE / BLOCK(severity) |
| QA_Architect | ✅ | [1-line] | APPROVE / BLOCK(severity) |
| SeniorAutomation_Engineer | ✅ | [1-line] | APPROVE / BLOCK(severity) |
```

## Step 9: Produce Review Output

```
CODE REVIEW (kids_math)
========================
Mode:      [PRO/ULTRA/MAX]
Files:     [X files reviewed]

Issues Found:
[CRITICAL] file:line — description
[HIGH]     file:line — description
[MEDIUM]   file:line — description
[LOW]      file:line — description

Cross-File Impact:
- [X files import from changed modules]

What's Good:
- [specific positive observations]

Role Participation: [table above]

Verdict:   [APPROVE / CHANGES REQUESTED / BLOCK]
```

### Verdict Rules (no ambiguity)
- **APPROVE**: Zero CRITICAL, zero HIGH, security gate PASS
- **CHANGES REQUESTED**: HIGH issues found → must fix before merge
- **BLOCK**: CRITICAL issues found → must fix, no merge under any circumstances

$ARGUMENTS
