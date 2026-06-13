#!/usr/bin/env node
/**
 * Content accuracy audit (Case B of docs/AI_MIGRATION_PLAN.md) — REAL Claude call.
 *
 * HUMAN-RUN, OFFLINE, READ-ONLY. Requires ANTHROPIC_API_KEY in `.env.local`. Never
 * invoked by `next build` / CI.
 *
 * Reads the SOURCE of one or more content files (plain text — no TS loader needed) and
 * asks Claude to flag issues the deterministic validator (lib/content/engine/validate.ts)
 * cannot catch: confusing wording, implausible/ambiguous distractors, reading level, and
 * Grade 1–2 MoE syllabus-band fit. Writes a human-review report to tmp/content-audit.md.
 *
 * SAFETY: writes ONLY to tmp/. It never edits content — a human triages the report.
 *
 * Usage:
 *   node --env-file=.env.local scripts/audit-content-accuracy.mjs lib/content/grade-a/day-08.ts
 *   node --env-file=.env.local scripts/audit-content-accuracy.mjs            # default sample
 *
 * Model: claude-opus-4-8 (override with AUDIT_MODEL, e.g. claude-haiku-4-5 for cheaper bulk).
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_PATH = join(ROOT, "tmp", "content-audit.md");
const MODEL = process.env.AUDIT_MODEL || "claude-opus-4-8";
const API_KEY = process.env.ANTHROPIC_API_KEY;

// Default sample if no file is passed (keeps token cost bounded).
const DEFAULT_TARGETS = ["lib/content/grade-a/day-08.ts"];

// Hard guard: refuse to write anywhere except tmp/.
function assertSafeOutput(path) {
  const rel = relative(ROOT, path);
  if (rel.startsWith("..") || !rel.startsWith("tmp/")) {
    throw new Error(`audit-content-accuracy: refusing to write outside tmp/: ${rel}`);
  }
}

const SYSTEM = `You are a meticulous math-pedagogy reviewer for an Israeli Hebrew-language
math workbook for Grades 1–2 (ages 6–8). You review exercise SOURCE CODE (TypeScript).
Find issues a calculator cannot: arithmetic that is wrong in context, answers that don't
match the prompt, implausible or ambiguous multiple-choice distractors, wording too hard
for the age, and content outside the Grade 1–2 syllabus band (number ranges, operations).
Hebrew text uses niqqud — that is expected, not an error. Be precise and conservative:
only report genuine problems. For each finding give: the exercise id (if visible), a
severity (HIGH/MEDIUM/LOW), the issue, and a concrete fix. If a file is clean, say so.`;

async function auditFile(relPath) {
  const source = await readFile(resolve(ROOT, relPath), "utf8");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Review this content file: ${relPath}\n\n\`\`\`ts\n${source}\n\`\`\``,
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  // Extract the visible text blocks (skip empty/omitted thinking blocks).
  return (data.content || [])
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("\n")
    .trim();
}

async function main() {
  assertSafeOutput(OUT_PATH);
  if (!API_KEY) {
    console.error("Missing ANTHROPIC_API_KEY. Add it to .env.local and run with --env-file=.env.local.");
    process.exit(2);
  }
  const targets = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_TARGETS;
  const sections = [`# Content accuracy audit`, ``, `Model: ${MODEL}`, `Generated: ${new Date().toISOString()}`, ``];
  for (const target of targets) {
    console.log(`[audit] reviewing ${target} …`);
    const findings = await auditFile(target);
    sections.push(`## ${target}`, ``, findings || "_No response._", ``);
  }
  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, `${sections.join("\n")}\n`);
  console.log(`[audit] wrote → tmp/content-audit.md (review by hand; nothing was changed)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
