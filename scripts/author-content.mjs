#!/usr/bin/env node
/**
 * AI content authoring (Case B of docs/AI_MIGRATION_PLAN.md).
 *
 * HUMAN-RUN, OFFLINE. Requires ANTHROPIC_API_KEY in `.env.local`. Never invoked by
 * `next build` / CI.
 *
 * Drafts new workbook days (e.g. the English backlog — only day-01 exists today) with
 * Claude, validates the draft against the WorkbookDay shape + the deterministic content
 * rules, and emits TypeScript for HUMAN + MoE review. It does NOT auto-commit content.
 *
 * Output additionally carries an explicit `mathExpression` per math exercise so the
 * renderer uses it directly instead of regex-extracting from the prompt
 * (see lib/utils/mathText.ts → resolvePromptParts). Absent/malformed → renderer falls
 * back to today's behavior.
 *
 * Usage:
 *   node --env-file=.env.local scripts/author-content.mjs --subject english --day 2
 *
 * Wire the Claude call in `draft()` before first use; confirm model id + pricing via the
 * `claude-api` skill. Use Haiku for bulk drafting, Sonnet for harder pedagogy passes.
 */

const args = process.argv.slice(2);

async function draft(_subject, _day) {
  // TODO(human-run): call Claude with the authoring prompt + WorkbookDay schema; return a
  // candidate day object. Read ANTHROPIC_API_KEY from process.env.
  throw new Error(
    "author-content: draft() not wired. Add the Anthropic call before running.",
  );
}

async function main() {
  const subject = valueOf("--subject") ?? "english";
  const day = Number(valueOf("--day"));
  if (!Number.isInteger(day) || day <= 0) {
    console.error("Usage: author-content.mjs --subject <english> --day <n>");
    process.exit(2);
  }
  const candidate = await draft(subject, day);
  // Emit for review (stdout). A human validates with:
  //   npm run test:unit -- tests/unit/lib/content/
  // and only then hand-commits the reviewed file under lib/content/.
  console.log(JSON.stringify(candidate, null, 2));
}

function valueOf(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
