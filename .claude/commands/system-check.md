# System Check

Run a full, risk-first health audit of the codebase and produce a ranked, verified
findings report.

**Invoke the `system-check` skill** (`.claude/skills/system-check/SKILL.md`) and
follow it exactly. That skill is the single source of truth for the method:

- Phase 0 recon → Phase 1 static sweeps → Phase 2 the 7 risk-first tranches
  (auth → data/sync → access/unlock → assessment → progress/metrics →
  content/TTS/pedagogy → cross-cutting/ops) → Phase 3 verify & reconcile →
  Phase 4 write `roadmap/CODE_REVIEW_FINDINGS_<date>.md`.
- Verification discipline: every CRITICAL/HIGH finding needs a traced, concrete
  failure path; separate NEW findings from KNOWN/accepted ones (roadmap + comments).
- Find-and-report only — do NOT fix anything until the user picks an item.

If the user passed arguments after `/system-check` (e.g. a subsystem like "auth" or
"sync", or "quick"/"static-only"), treat them as scope: run just that tranche's map,
or limit to the static sweeps, per the skill's scope-control guidance. With no
arguments, run the full audit.
