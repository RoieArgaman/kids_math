# Tests-Gaps

Research the codebase to find GAPS in automated test coverage and produce a ranked,
verified gap report — then, on approval, author the missing tests (mostly E2E).

**Invoke the `tests-gaps` skill** (`.claude/skills/tests-gaps/SKILL.md`) and follow
it exactly. That skill is the single source of truth for the method:

- Phase 0 inventory (routes, lib domains, existing E2E + unit, coverage matrix) →
  Phase 1 enumerate candidate gaps (unit-only surfaces, missing negatives/edges,
  known bugs without a regression, skipped/hollow tests, unspecced routes) →
  Phase 2 rank by risk (data-loss/sync → gates → assessment → progress → UX →
  cosmetic) → Phase 3 verify each gap is real → Phase 4 ranked report.
- Evidence discipline: name the untested route/function/branch and show the nearest
  spec doesn't cover it; distinguish "unit-only is fine" from a real E2E gap; verify
  any "known bug" still exists in code before proposing a regression.
- Find-and-report first — author the specs only after the user approves, using the
  repo E2E playbook in the skill (harness reuse, gating, flake avoidance, verify).

If the user passed arguments after `/tests-gaps` (e.g. a subsystem like "auth" or
"sync", or "report-only"), treat them as scope per the skill's scope-control
guidance. With no arguments, run the full surface sweep and then offer to author
the top-ranked gaps.
