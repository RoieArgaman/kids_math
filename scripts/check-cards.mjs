#!/usr/bin/env node
/**
 * check-cards.mjs — ADVISORY scanner for the shared UI library.
 *
 * Flags markup that *could* use a shared component instead of hand-rolled
 * Tailwind, to nudge future work toward `components/ui/*`. This is GUIDANCE,
 * not a gate: there are known un-migrated instances and we deliberately do NOT
 * fail CI. It is NOT part of the blocking `test:qa` chain.
 *
 *   - hand-rolled card containers  → prefer <Card> / <ActionCard> / <Surface>
 *   - inline dir="ltr" spans       → prefer <Ltr>
 *   - inline success/error banners → prefer <Alert>
 *
 * ALWAYS exits 0. Run via `npm run check:cards`.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIR = join(ROOT, "components");

// Files that legitimately define the shared primitives themselves — scanning
// them would always "find" the very markup we want callers to reuse.
const SHARED_PRIMITIVE_FILES = new Set([
  "components/ui/Card.tsx",
  "components/ui/Surface.tsx",
  "components/ui/Tile.tsx",
  "components/ui/Alert.tsx",
  "components/ui/Ltr.tsx",
  "components/ui/CenteredPanel.tsx",
  "components/ui/HeroHeader.tsx",
  "components/ui/Chip.tsx",
]);

/** Recursively collect `*.tsx` files under a directory. */
function collectTsx(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectTsx(full));
    } else if (entry.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

// Hand-rolled rounded card containers (rounded-2xl / rounded-3xl / rounded-[NNpx])
// combined with a border or background — the signature of a bespoke card.
const CARD_RE = /\b(rounded-2xl|rounded-3xl|rounded-\[\d+px\])\b[^"'`]*\b(border|bg-)/;
// Inline LTR spans typed directly rather than via <Ltr>.
const LTR_RE = /<span[^>]*\bdir=["']ltr["']/;
// Inline tinted success/error banner divs/ps (the Alert tones) typed by hand.
const BANNER_RE = /\b(bg-\[#d1fae5\]|bg-\[#fee2e2\]|bg-\[#fef3c7\])\b/;

const counts = { card: 0, ltr: 0, banner: 0 };
const samples = { card: [], ltr: [], banner: [] };

function record(kind, relPath, lineNo, line) {
  counts[kind] += 1;
  if (samples[kind].length < 5) {
    samples[kind].push(`${relPath}:${lineNo}  ${line.trim().slice(0, 90)}`);
  }
}

const files = collectTsx(SCAN_DIR);
let scanned = 0;

for (const file of files) {
  const relPath = relative(ROOT, file);
  if (SHARED_PRIMITIVE_FILES.has(relPath)) continue;
  scanned += 1;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const lineNo = i + 1;
    if (CARD_RE.test(line)) record("card", relPath, lineNo, line);
    if (LTR_RE.test(line)) record("ltr", relPath, lineNo, line);
    if (BANNER_RE.test(line)) record("banner", relPath, lineNo, line);
  });
}

function section(title, kind, hint) {
  console.log(`\n${title}: ${counts[kind]}`);
  if (counts[kind] > 0) {
    console.log(`  → ${hint}`);
    for (const s of samples[kind]) console.log(`    ${s}`);
    if (counts[kind] > samples[kind].length) {
      console.log(`    … and ${counts[kind] - samples[kind].length} more`);
    }
  }
}

console.log("check:cards — advisory shared-UI scan (non-blocking)");
console.log(`Scanned ${scanned} components/**/*.tsx file(s).`);

section("Hand-rolled card containers", "card", "prefer <Card> / <ActionCard> / <Surface>");
section('Inline dir="ltr" spans', "ltr", "prefer <Ltr>");
section("Inline success/error banners", "banner", "prefer <Alert>");

const total = counts.card + counts.ltr + counts.banner;
console.log(
  `\nSummary: ${total} guidance hit(s) — ${counts.card} card, ${counts.ltr} ltr, ${counts.banner} banner.`,
);
console.log("Advisory only; nothing here fails the build. See .claude/docs/UI_COMPONENTS.md");

// ALWAYS succeed — this is guidance, not a gate.
process.exit(0);
