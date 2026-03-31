---
description: Run verification loop — structured quality check with PASS/FAIL report and self-review.
---

# Verify Command

Run comprehensive verification and produce a structured report.

## Step 1: Determine Scope

Read `AGENTS.md` → Mode Selection Rules based on what was changed.

## Step 2: Self-Review First

Run the Self-Review Protocol from `AGENTS.md` before running quality gates.
Fix any issues found during self-review.

## Step 3: Run Verification Phases

### Phase 1: Lint
```bash
npm run lint 2>&1 | tail -20
```

### Phase 2: Test ID Coverage
```bash
npm run check:testids 2>&1 | tail -20
```

### Phase 3: Build (ULTRA/MAX, or if behavior changed)
```bash
npm run build 2>&1 | tail -30
```

### Phase 4: Unit Tests (ULTRA/MAX, or if logic changed)
```bash
npm run test:unit 2>&1 | tail -30
```

### Phase 5: E2E Tests (MAX full suite, ULTRA targeted)
Specify EXACT spec files run (not "targeted E2E"):
```bash
npm run test:e2e -- tests/e2e/<specific>.spec.ts 2>&1 | tail -50
```

### Phase 6: Security Gate
Run the Security Gate checklist from `AGENTS.md`:
```
[ ] No hardcoded secrets (grep for: API_KEY, SECRET, TOKEN, PASSWORD, sk-, pk_)
[ ] No console.log in production code
[ ] No sensitive data in data-testid values
[ ] No unvalidated user input reaching storage or DOM
[ ] Cookie operations use proper flags
[ ] API route handlers validate inputs
[ ] No TODO/FIXME/HACK in security-critical code
```

### Phase 7: MCP Playwright Visual Verification (if UI changed)
If ANY UI/component/screen was changed:
```
1. preview_start — launch the app
2. preview_screenshot — check RTL layout, no visual breaks
3. Navigate to changed screens (preview_click, preview_fill as needed)
4. preview_screenshot at each changed screen
5. preview_console_logs — verify no runtime errors
6. preview_stop

Result: [PASS / FAIL — describe visual issues]
```
Report result in verification report `Visual:` field.

### Phase 8: CI Final Verification (ULTRA/MAX mandatory)
Run full CI suite and confirm ALL checks pass:
```bash
npm run test:qa 2>&1 | tail -50
```
Must confirm:
- [ ] Lint: PASS
- [ ] TestIDs: PASS
- [ ] Build: PASS
- [ ] Unit tests: PASS (0 failures)
- [ ] E2E tests: PASS (0 failures)

Report result in verification report `CI Suite:` field.

### Phase 9: Diff Review
```bash
git diff --stat
```
Review each changed file for: unintended changes, missing error handling, edge cases.

## Step 4: Produce Report

```
VERIFICATION REPORT (kids_math)
================================
Mode:        [PRO/ULTRA/MAX]
Changed:     [brief description]

Lint:        [PASS/FAIL] (details if fail)
TestIDs:     [PASS/FAIL] (details if fail)
Build:       [PASS/FAIL/SKIPPED — reason] (details if fail)
Unit:        [PASS/FAIL/SKIPPED — reason] (X passed, Y failed)
E2E:         [PASS/FAIL/SKIPPED — reason] (X passed, Y failed; specs: list.spec.ts)
Security:    [PASS/FAIL] (list findings with severity)
Visual:      [PASS/FAIL/SKIPPED — reason] (screens checked: list)
CI Suite:    [PASS/FAIL] (lint ✓, testids ✓, build ✓, unit X/X ✓, e2e X/X ✓)
Diff:        [X files, Y insertions, Z deletions]

Self-Review: [CLEAN / X issues caught and fixed]
Learning:    [YES — summary / NO — reason]

Overall:     [READY / NOT READY]
```

### "Overall" Decision Tree

Mark **READY** if ALL true:
- [ ] Zero CRITICAL issues
- [ ] Zero HIGH issues
- [ ] All quality gates PASS (or SKIPPED with valid reason)
- [ ] Security gate PASS
- [ ] Visual verification PASS (or SKIPPED with valid reason)
- [ ] CI suite PASS (ULTRA/MAX: full test:qa must pass)
- [ ] All report fields filled (no blanks)
- [ ] Self-review completed
- [ ] Learning log updated (ULTRA/MAX) or skip justified

Mark **NOT READY** if ANY:
- [ ] Any CRITICAL → auto-BLOCK
- [ ] Any HIGH → BLOCK
- [ ] Any gate FAIL → BLOCK
- [ ] Report incomplete → NOT READY

**SKIPPED fields MUST include a reason:**
- VALID: `Unit: SKIPPED [PRO mode, only copy changed]`
- INVALID: `Unit: SKIPPED`

$ARGUMENTS
