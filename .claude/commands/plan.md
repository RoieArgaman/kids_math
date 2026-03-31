---
description: Create a structured implementation plan with multi-role review. WAIT for user confirmation before coding.
---

# Plan Command

You are the **Planner** for kids_math. Create a comprehensive plan. Do NOT write any code.

## Step 1: Determine Mode

Read `AGENTS.md` → Mode Selection Rules. **State the mode and why.**

## Step 2: Research First (mandatory)

Before planning:
- Read all files that will be affected
- Check existing patterns (grep for similar implementations)
- Check cross-file dependencies: `grep -r "from.*<module>" --include="*.ts" --include="*.tsx" .`
- Identify reusable helpers, hooks, and components in `lib/`
- Check `docs/LEARNING_LOG.md` for relevant past decisions
- Check `.cursor/rules/*.mdc` for domain conventions

## Step 3: Create the Plan

### Requirements Restatement
- What the user wants (1-3 sentences)
- What the user does NOT want (if stated)

### Cross-File Impact
- Files that import from modules you plan to change
- If >5 files affected: flag as HIGH IMPACT

### Risk Assessment
| Risk | Severity (CRITICAL/HIGH/MEDIUM/LOW) | Mitigation |
|------|----------|------------|

### Files to Touch
Every file that will be created, modified, or deleted.

### Implementation Steps
Numbered, ordered. Each step must be:
- **Specific**: which file, which function, what change
- **Testable**: how to verify this step worked
- **Reversible**: can we undo this step?

## Step 4: Multi-Role Plan Review

### ULTRA (5 core roles, each contributes 1-3 bullets with role attribution):

**SeniorDev_TechLead:** [architecture direction, top risks]

**SeniorFrontEnd_TechLead:** [UI/component patterns, RTL concerns]

**Dev_Architect:** [data flow, boundaries, storage impact]

**QA_Architect:** [test strategy, which tests to add/update]

**SeniorAutomation_Engineer:** [specific test files, selectors, coverage gaps]

### MAX (add these roles):

**SeniorQA_Engineer:** [edge cases, manual RTL checklist]

**SeniorProductDesigner:** [UX/a11y expectations, touch-first constraints]

**SeniorProductManager:** [acceptance criteria, scope control]

**MoE_PedagogyLead** (if educational content): [syllabus alignment check]

## Step 5: Role Participation Table

```
| Role | Participated | Key Finding | Verdict |
|------|-------------|-------------|---------|
| SeniorDev_TechLead | ✅ | [summary] | APPROVE/CONCERN |
| ... | ... | ... | ... |
```

## Step 6: Quality Gates
Which checks from `AGENTS.md` → Quality Gates by Mode apply.

## Step 7: Definition of Done
3-6 concrete acceptance criteria.

## Step 8: WAIT FOR USER

**CRITICAL**: Do NOT write any code. Present the plan and use this exact checkpoint:

```
---
⛔ CHECKPOINT: Plan Review
Status: COMPLETE

Summary: [1-2 sentences]

All roles participated: [YES/NO — list any missing]

Ready to proceed? Awaiting your confirmation.
Options: (proceed / revise plan / different approach / escalate mode)
---
```

### For MAX Mode: Plan gets reviewed TWICE

After presenting the plan:
1. Wait for user to review
2. If user says "proceed" → present plan for Round 2 review (re-check all roles)
3. Wait for user to confirm Round 2
4. Only then proceed to Explore phase

$ARGUMENTS
