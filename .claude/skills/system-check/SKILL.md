---
name: system-check
description: >-
  Run a systematic, risk-first health audit of the whole kids_math codebase to
  surface real bugs, latent risks, and development gaps — then produce a ranked,
  verified findings report. Use this whenever the user asks to "system check",
  "audit the codebase", "review all the code", "do a code review", "find bugs and
  gaps", "health check", "security/data review", "production-readiness review", or
  otherwise wants a broad sweep for problems rather than a single-file fix. Trigger
  it even when the user names only a subsystem ("check the auth/sync/exam code") —
  the same method applies scoped to that tranche. Do NOT use it for implementing a
  known change or fixing one identified bug; this skill finds and reports, it does
  not fix.
---

# System Check — whole-codebase audit

You are auditing kids_math for bugs, risks, and gaps. The deliverable is a
**ranked, verified findings report** — not source changes. Finding first; fixes
are a separate, user-approved follow-up (storage/auth/exam touches are MAX per
`CLAUDE.md`). Announce scope, work the tranches, verify every claim, then write
the report.

## Why this skill exists

A flat file-by-file read of ~400 source files is low-signal and slow. This codebase
is already disciplined (no `any`, no `TODO`, transactional writes, tolerant-reader
merge layer), so the bugs that survive are **subtle**: cross-device data loss,
timezone basis mismatches, defensive guards that run in the wrong order, untested
edge branches. Catching those needs a risk-ordered method and hard verification,
not volume. The whole point is to spend attention where blast radius is highest and
to never ship a finding you haven't traced to a concrete failure.

## Operating principles (the part that makes findings trustworthy)

- **Verify before you report.** Every CRITICAL/HIGH finding needs a concrete,
  traced failure path — specific inputs/state → wrong output. If you can't state
  one, it's a PLAUSIBLE lead, not a finding. When cheap, confirm with a scratch
  `vitest` run or by reading the exact call site, rather than asserting from a
  pattern. A single false positive costs the whole report its credibility.
- **Read the comments — this repo documents its trade-offs.** Many "bugs" are
  deliberate, explained decisions (unauthenticated unlock routes, staged CSP,
  fail-open limiters). Reconcile against `roadmap/PRODUCTION_HARDENING_ROADMAP.md`
  and code comments so you separate *new* findings from *known/accepted* ones.
- **A gap needs evidence too.** "No test for X" is only credible when you name the
  untested function/branch and show the existing test doesn't cover it.
- **Don't fix mid-audit.** Note it and move on; a half-fix pollutes the diff and
  the review. The user chooses what to fix after seeing the ranked list.
- **Scope control.** If the user named a subsystem, run only that tranche's map.
  A full pedagogy/content-accuracy pass across `lib/content/**` is a large separate
  effort — flag it, don't silently expand into it.

## Method

Work in order. Use the task list to track tranches so nothing is dropped.

### Phase 0 — Recon (cheap, do first)
Map before reading. Get the domain layout and sizes so you audit the fattest,
riskiest code first, not alphabetically.
```bash
ls lib/ && find app/api -name '*.ts'
for d in lib/*/; do n=$(find "$d" -name '*.ts' -o -name '*.tsx' | grep -v test | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'); echo "$n  $d"; done | sort -rn | head -30
grep -nE '^#{2,3} ' roadmap/PRODUCTION_HARDENING_ROADMAP.md   # known findings register
```

### Phase 1 — Static sweeps (whole-repo, high signal-per-second)
Run these first; they either surface hotspots or confirm the baseline is clean so
you can trust that remaining issues are logic-level. Prefer the Grep tool.
- Type escapes: `:\s*any\b|as any|@ts-ignore|@ts-nocheck|@ts-expect-error` (source, not tests)
- Debug leaks: `console\.(log|debug|warn|error)` outside `lib/observability`
- Rot markers: `TODO|FIXME|HACK|XXX`
- Swallowed errors: `catch\s*\([^)]*\)\s*\{\s*\}` (multiline)
- Injection surface: `dangerouslySetInnerHTML|innerHTML|eval\(|new Function`
- Non-determinism: `Math\.random\(\)` in id/answer generation
- **Storage key drift:** `kids_math\.` across `lib/**` — cross-check every key against
  the `clearLocalProgress` allow-list AND the sync bundle build/hydrate. Keys that
  are cleared but never re-hydrated (or saved but never bundled) = silent data loss.
- **Timezone basis:** `getHours|getDay|getDate|substring(0, ?10)|toISOString` — mixing
  UTC (`toISOString().slice(0,10)`) and local (`getFullYear/Month/Date`) date buckets
  is a recurring bug class here (streak/badges).

### Phase 2 — Risk-first tranches (deep-read)
Audit in this order — highest blast radius first. For each, read the core files,
trace the real logic, enumerate edge cases, and cross-reference `tests/` for
untested branches. The file map below is the current layout; let it drift as the
codebase grows — the *lens* per tranche is what matters.

| # | Tranche | Core files | The lens (what breaks here) |
|---|---------|-----------|------------------------------|
| T1 | **Auth & session** | `lib/auth/*` (`jwt.server`, `session.server`, `serverSync`), `app/api/auth/*`, `app/api/admin/*`, `middleware.ts`, `lib/security/*`, `firestore.rules` | Token revocation (`tokenVersion`), version-check on data routes, timing side-channels, last-admin race, field-masked vs whole-doc writes, limiter fail-open, deny-all rules |
| T2 | **Data & sync** | `lib/user-data/*` (`merge`, `api`), `app/api/user/progress`, `lib/*/storage.ts` | LWW correctness, per-day merge, clear-list vs bundle vs hydrate symmetry (**the F1 data-loss class**), clamp-before-merge order, tolerant reader, per-student isolation (epoch/primed/active) |
| T3 | **Access & unlock** | `lib/access/anonDailyLimit`, `lib/hooks/useAnonDailyGate`, `lib/gradeUnlock`, `lib/server/gradeUnlockCookies`, `app/api/*-grade-b*`, `lib/completion/*` | Gate bypass, cookie↔localStorage reconcile, unlock-only (never auto-revoke), auth-settle races in the client gate |
| T4 | **Assessment** | `lib/exam/*`, `lib/final-exam/*`, `lib/gmat-challenge/*`, `lib/exam-session/*`, `lib/review/*` | Scoring boundaries, `total===0` guards, `canFinish` count invariants, Leitner box transitions, picker collisions |
| T5 | **Progress & metrics** | `lib/progress/*`, `lib/parent/metrics`, `lib/streak/*`, `lib/badges/*`, `lib/analytics/*` | `attempts[]` (first-try) vs `correctAnswers` (ever-correct) invariant, off-by-one day/section, timezone buckets, analytics not cleared on identity switch |
| T6 | **Content, TTS & pedagogy** | `lib/content/engine/*`, `lib/content/**`, `lib/tts/*` | Generator invariants (by construction), deterministic arithmetic backstop coverage, `normalizeTextForHebrewTts` symbol/gender voicing, RTL. Deep MoE syllabus/distractor/word-problem accuracy is a **separate large pass** — sample a few days, flag the gap, don't audit all ~9,760 LOC inline unless asked |
| T7 | **Cross-cutting & ops** | `next.config.mjs`, `apphosting.yaml`, `firebase.json`, `app/api/health`, CI config, `vitest.config.ts` | Type safety, error boundaries, CSP/HSTS enforcing vs report-only, staged flags (`RATE_LIMIT_ENFORCE`, `PROGRESS_BODY_CAP_ENFORCE`), deploy/scaling gaps |

### Phase 3 — Verify & reconcile
For each candidate: (1) trace a concrete failure path; downgrade to a lead if you
can't. (2) Confirm the "gap" by checking the actual test files. (3) Label **NEW** vs
**KNOWN** against the roadmap register and code comments. Optionally run a scratch
`vitest run <file>` to confirm a suspected logic bug.

### Phase 4 — Write the report
Create `roadmap/CODE_REVIEW_FINDINGS_<YYYY-MM-DD>.md`. Then self-review: is every
CRITICAL/HIGH backed by a reproduction? Any finding that's actually documented-intent?

## Severity rubric
- **CRITICAL** — account takeover, auth bypass, secret exposure, unrecoverable data
  corruption. Auto-escalate; needs an airtight repro.
- **HIGH** — silent data loss, privilege/gate bypass, wrong grade/exam outcome.
- **MEDIUM** — real bug with a workaround or bounded blast radius (e.g. one subject/
  level, cross-device only).
- **LOW** — robustness/consistency (cosmetic mis-count, 500-on-malformed-self-input).
- **GAP / INFO** — missing test/gate, or a documented staged posture worth surfacing.

## Report structure
Use this template. Summary table sorted most-severe-first; every finding carries a
traced failure scenario.

```markdown
# Code Review Findings — Full-Codebase Audit (<date>)
> Read-only audit. No source changed. Fixes are a separate, user-approved follow-up.

**Scope / Method / Headline** — tranches covered, how, and the one-line takeaway.

## Summary (most-severe first)
| # | Sev | Category | Area | One line | New? |

## F<n> — <title> (<SEVERITY>)
**Files:** path:line, …
**Verified chain:** the code path, quoted where it matters.
**Failure scenario:** concrete inputs/state → wrong result.
**Status:** NEW / KNOWN (roadmap ref); tested / untested.
**Fix direction:** shortest correct change + which mode it needs.

## Coverage-gap notes  — untested branches, cross-ref LEARNING_LOG thin spots.
## What was checked and found clean  — so the reader trusts the silence.
```

## Finish
Report the ranked summary in chat (don't make the user open the file to learn the
headline), commit the report to the working branch (the container is ephemeral), and
offer to open fixes — recommend starting with the highest-severity item and naming
the mode its fix needs. Do not fix anything without the user picking it first.
