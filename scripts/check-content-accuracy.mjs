#!/usr/bin/env node
/**
 * CI content-accuracy advisory (roadmap finding F5).
 *
 * WARN-LEVEL, FAIL-OPEN. Runs the AI content audit (scripts/audit-content-accuracy.mjs)
 * on the day/exercise content files a pull request CHANGED, so no new/edited content ships
 * without an automatic pedagogy pass. Findings are advisory — a human still triages them
 * (AGENTS.md → Educational Content Changes). This script NEVER fails the build:
 *
 *   - not a pull_request event (no GITHUB_BASE_REF) → no-op, exit 0
 *   - no ANTHROPIC_API_KEY (local run, or a fork PR that can't see repo secrets) → skip, exit 0
 *   - no changed content files → exit 0
 *   - API error on a file → notice + skip that file, keep going
 *   - always exit 0
 *
 * Warn-level is enforced at the job level (`continue-on-error: true` in ci.yml), mirroring the
 * check:coverage-matrix advisory; this script's own contract is simply "never exit non-zero".
 *
 * Scope: only the four learner-content subdirs — engine/factories/templates are infrastructure,
 * not pedagogy, and a syllabus prompt has nothing to say about them.
 *
 * Usage (CI): npm run check:content     (with ANTHROPIC_API_KEY + AUDIT_MODEL in the job env)
 * For a local/manual deep pass use the human CLI instead:
 *   node --env-file=.env.local scripts/audit-content-accuracy.mjs <files>
 */
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

import { auditFile, MODEL } from "./audit-content-accuracy.mjs";

// Learner-content subdirs only (grade-a/-b math, english, science day files). Excludes
// lib/content/engine/** and top-level assemblers/templates — infrastructure, not content.
const CONTENT_PREFIXES = [
  "lib/content/grade-a/",
  "lib/content/grade-b/",
  "lib/content/english/",
  "lib/content/science/",
];
// Bounds token cost per run. A new-grade PR can touch ~30 day files; audit the first N and
// report the rest as unchecked (author runs the full CLI locally) rather than spend on all.
const MAX_FILES = 12;

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
/** Print to the log and, in CI, to the job step summary. */
function report(line) {
  console.log(line);
  if (summaryPath) {
    try {
      appendFileSync(summaryPath, `${line}\n`);
    } catch {
      /* step summary is best-effort; never let it break the run */
    }
  }
}

function changedContentFiles(baseRef) {
  // Three-dot: files this branch ADDED vs. the merge-base, not everything that diverged on
  // the base since. --diff-filter=d drops deletions (a removed day must not be sent to the API).
  const out = execFileSync(
    "git",
    ["diff", "--name-only", "--diff-filter=d", `origin/${baseRef}...HEAD`],
    { encoding: "utf8" },
  );
  return out
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f.endsWith(".ts") && CONTENT_PREFIXES.some((p) => f.startsWith(p)));
}

async function main() {
  const baseRef = process.env.GITHUB_BASE_REF;
  if (!baseRef) {
    console.log("content-accuracy: not a pull_request event (no GITHUB_BASE_REF) — skipping.");
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(
      "content-accuracy: ANTHROPIC_API_KEY not set (local run or fork PR) — skipping the AI audit.",
    );
    return;
  }

  let files;
  try {
    files = changedContentFiles(baseRef);
  } catch (err) {
    // A git/merge-base problem must not fail the build — surface it and move on.
    console.log(`content-accuracy: could not compute changed files (${err.message}) — skipping.`);
    return;
  }

  if (files.length === 0) {
    console.log("content-accuracy: no changed learner-content files — nothing to audit.");
    return;
  }

  const audited = files.slice(0, MAX_FILES);
  const overflow = files.slice(MAX_FILES);

  report(`## Content-accuracy advisory (F5)`);
  report(`Model: \`${MODEL}\` · auditing ${audited.length} of ${files.length} changed content file(s).`);
  report("");

  for (const file of audited) {
    console.log(`[content-accuracy] auditing ${file} …`);
    try {
      const findings = await auditFile(file);
      report(`### ${file}`);
      report("");
      report(findings || "_No response._");
      report("");
    } catch (err) {
      // API/network/rate-limit error on one file → note it and keep going. Fail-open.
      report(`### ${file}`);
      report(`_Audit unavailable (${err.message}) — not checked; run the CLI locally._`);
      report("");
    }
  }

  if (overflow.length > 0) {
    report(
      `> ⚠ ${overflow.length} more changed content file(s) exceeded the ${MAX_FILES}-file cap and were **not** audited:`,
    );
    for (const f of overflow) report(`> - \`${f}\``);
    report(
      `> Run \`node --env-file=.env.local scripts/audit-content-accuracy.mjs ${overflow.join(" ")}\` locally.`,
    );
  }

  report("");
  report("_Advisory only — triage by hand (AGENTS.md → Educational Content Changes). Does not gate the build._");
}

// Contract: this script NEVER exits non-zero. Any unexpected throw is caught and downgraded
// to a notice so an infra hiccup can't wedge (or even redden) CI.
main().catch((err) => {
  console.log(`content-accuracy: unexpected error, skipping (${err.message}).`);
  process.exit(0);
});
