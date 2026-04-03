# AI Prompt Library (kids_math)

> This file contains reusable prompt blocks for all AI agents (Claude Code, Cursor, Devin).
> For the full workflow system, see `AGENTS.md` at project root.

---

## Before Starting Any Task

```
1. Read AGENTS.md → Mandatory Behaviors
2. Determine mode: PRO / ULTRA / MAX (see Mode Selection Rules)
3. State mode at start of response: "Mode: [PRO/ULTRA/MAX] — [reason]"
4. Research before writing: read files, grep patterns, check helpers, check learning log
5. Check cross-file deps: grep -r "from.*<module>" --include="*.ts" --include="*.tsx" .
6. Run Self-Review Protocol before every response
7. Follow mode process and checkpoints EXACTLY — no skipping
```

---

## Common Context Block

```
Project: Next.js 14 App Router, React 18, TypeScript (strict), Tailwind CSS
UI: Hebrew RTL (<html lang="he" dir="rtl">)
State: localStorage only, keys namespaced kids_math.*
Tests: Vitest (unit) + Playwright (E2E, Chromium)
Path alias: @/* imports
Deploy: Firebase App Hosting (Node 20)
CI: GitHub Actions (lint, testids, build, unit, E2E)
```

---

## Common Constraints Block

```
- Follow existing conventions and keep diffs minimal
  (PRO ≤50 lines/2 files, ULTRA ≤300 lines/8 files)
- Research before writing: read files, grep for patterns, check lib/ helpers
- Check cross-file deps before changing any shared module
- Never weaken configs (eslint, tsconfig, etc.) to suppress errors
- **Storage backward compatibility:** Learner data must survive deploys across all `lib/*/storage.ts` domains (not only workbook days/sections). Renaming `dayId` / section or exercise ids without a migration plan can orphan `localStorage`. See **`AGENTS.md` → Data & Storage Rules** — version bump + migration when the persisted shape must change
- Avoid breaking RTL/a11y
- No console.log in production code
- No hardcoded secrets
- All interactive elements need data-testid via lib/testIds.ts
- Use lib/routes.ts for all route references
- Self-review before every response
```

---

## Acceptance Criteria Template

```
- (1) [Specific observable outcome]
- (2) [Specific observable outcome]
- (3) Quality gates pass for selected mode (see AGENTS.md)
- (4) No CRITICAL or HIGH issues in review
- (5) Security gate PASS
- (6) MCP Playwright visual check PASS (if UI changed)
- (7) CI suite (npm run test:qa) PASS (ULTRA/MAX)
```

---

## Test Plan Template

```
Automated:
  - npm run lint
  - npm run check:testids
  - npm run build (if behavior changed)
  - npm run test:unit (if logic changed)
  - npm run test:e2e -- [specific specs] (if routes/gates changed)
  - npm run test:qa (ULTRA/MAX — full CI suite before PR)

Visual (MCP Playwright — if UI changed):
  - preview_start → navigate to changed screens → preview_screenshot
  - Check: RTL layout, no visual breaks, touch targets
  - preview_console_logs → verify no runtime errors

Manual:
  - RTL critical path: Home → plan → day navigation
  - Keyboard: Tab/Shift+Tab on changed elements
  - Touch: targets >= 44px on new/changed buttons
```

---

## Verification Report Template

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

READY requires: zero CRITICAL, zero HIGH, all gates PASS, Security PASS, Visual PASS, CI Suite PASS.
SKIPPED must include reason: `Unit: SKIPPED [PRO mode, only copy changed]`.

---

## Code Review Template

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

Role Participation: (ULTRA/MAX)
| Role | Participated | Finding | Verdict |
|------|-------------|---------|---------|
| SeniorDev_TechLead | ✅ | ... | APPROVE |
| SeniorFrontEnd_TechLead | ✅ | ... | APPROVE |
| Dev_Architect | ✅ | ... | APPROVE |
| QA_Architect | ✅ | ... | APPROVE |
| SeniorAutomation_Engineer | ✅ | ... | APPROVE |

Verdict:   [APPROVE / CHANGES REQUESTED / BLOCK]
```

Verdict rules:
- **APPROVE**: Zero CRITICAL, zero HIGH, security PASS
- **CHANGES REQUESTED**: HIGH found → must fix before merge
- **BLOCK**: CRITICAL found → no merge under any circumstances

---

## Handoff Format (end of every agent response)

```markdown
### Mode
PRO / ULTRA / MAX — reason

### Findings
- 3-7 bullets, CONCRETE (file path + function + decision)
- VAGUE: "UI patterns reused"
- CONCRETE: "Reused testIds.screen.day.root(dayId) from lib/testIds.ts"

### Files
- Exact file paths touched or inspected

### Cross-File Impact
- Files that import from changed modules
- If >5 files: flag HIGH IMPACT

### Decisions
- Trade-offs chosen and WHY (not just what)

### Self-Review
- Issues caught and fixed (or "Self-review clean")

### Review Team (ULTRA/MAX)
[Role participation table]

### Verification Report (ULTRA/MAX)
[Full report including Visual and CI Suite fields]

### Caveats & Open Questions
- What was NOT done and why
- Open questions pending user guidance

### Next Actions
- Ordered list another agent can execute

### For Next Agent
- Context: [task state summary]
- Read these files: [recently changed files]
- Known issues: [blockers]
- Verify: [what to double-check]

### Learning Update
- Entry for docs/LEARNING_LOG.md
- Rule update for .cursor/rules/ (if convention is stable)
- ULTRA/MAX: MUST include entry OR "No new learning — [reason]"
```

---

## Severity Reference

| Level | Meaning | Action | Auto-block? |
|-------|---------|--------|------------|
| CRITICAL | Security vuln, data loss, broken gate | BLOCK — must fix | YES |
| HIGH | Bug, test failure, type error, broken flow | BLOCK — must fix | YES |
| MEDIUM | Warning, missing test, minor regression | WARN — should fix | NO |
| LOW | Style, suggestion | NOTE — optional | NO |

### Security Severity
| Finding | Severity |
|---------|----------|
| Hardcoded secret / credential | CRITICAL |
| XSS vector | CRITICAL |
| console.log in production | HIGH |
| Sensitive data in testid | HIGH |
| Weak input validation | MEDIUM |

---

## Checkpoint Template (Blocking ⛔)

```
---
⛔ CHECKPOINT: [Phase Name]
Status: [COMPLETE / NEEDS REVISION]

Summary: [1-2 sentences]

Checklist:
[X] [requirement met]
[ ] [requirement not met — explain why]

Roles participated: [list — ULTRA/MAX only]

Ready for next phase? Awaiting your confirmation.
Options: (proceed / revise / different approach / escalate mode)
---
```

---

## Escalation Template

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
- MCP Playwright: [required]
- CI suite: [required]

Next step: Should I replan in [mode]? (yes / stay with justification)
```

---

## Mode Quick Reference

| Mode | When | Checkpoints | Review | Quality Gates |
|------|------|-------------|--------|--------------|
| **PRO** | Single file, isolated | None | Self-review | lint + testids + targeted |
| **ULTRA** | Multi-file, features | 3 blocking ⛔ | 5 core roles | lint + testids + build + unit + E2E + MCP Playwright + CI |
| **MAX** | Routes/schema/security | 6+ blocking ⛔ | Full team (2 cycles) | Full test:qa + MCP Playwright (always) |
