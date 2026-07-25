#!/usr/bin/env node
/**
 * Coverage-matrix guard.
 *
 * Every app route (`app/**"/"page.tsx`) must have a row in docs/TEST_COVERAGE_MATRIX.md,
 * so a new user-facing feature cannot ship without a declared regression home. This is
 * the mechanism behind "catch regressions in the development stage": adding a route is a
 * code change, so CI runs the fast lane, this check fires, and an undocumented route
 * fails the build.
 *
 * Usage:
 *   node scripts/check-coverage-matrix.mjs            # blocking: exit 1 on any drift
 *   node scripts/check-coverage-matrix.mjs --advisory # warn only: always exit 0
 *
 * Drift = (a) a route page with no matrix row, or (b) a matrix row pointing at a route
 * that no longer exists (stale). Both are reported; only (a) is treated as fatal.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "app");
const MATRIX = join(ROOT, "docs", "TEST_COVERAGE_MATRIX.md");
const advisory = process.argv.includes("--advisory");

/** Recursively collect every page.tsx under app/, as repo-relative POSIX paths. */
function collectRoutePages(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectRoutePages(full));
    } else if (entry === "page.tsx") {
      out.push(relative(ROOT, full).split("\\").join("/"));
    }
  }
  return out;
}

const routes = collectRoutePages(APP_DIR).sort();
const matrixText = readFileSync(MATRIX, "utf8");

// Routes present in app/ but missing from the matrix (fatal).
const missing = routes.filter((r) => !matrixText.includes(r));

// Route paths referenced in the matrix but no longer present in app/ (stale, warn-only).
// The character class must allow Next.js route-group parens `(group)`, catch-all dots
// `[...slug]`, and dynamic brackets — otherwise those routes silently escape stale detection.
const referenced = [...matrixText.matchAll(/app\/[A-Za-z0-9_.\-[\]()/]+\/page\.tsx/g)].map((m) => m[0]);
const routeSet = new Set(routes);
const stale = [...new Set(referenced)].filter((r) => !routeSet.has(r)).sort();

let failed = false;

if (missing.length > 0) {
  failed = true;
  console.error("\n✗ Routes with NO row in docs/TEST_COVERAGE_MATRIX.md:");
  for (const r of missing) console.error(`  - ${r}`);
  console.error("\n  Add a row for each new route (feature, E2E spec, unit, notes).");
}

if (stale.length > 0) {
  console.warn("\n⚠ Matrix references routes that no longer exist (update or remove):");
  for (const r of stale) console.warn(`  - ${r}`);
}

if (!failed) {
  console.log(`✓ Coverage matrix covers all ${routes.length} app routes.`);
}

if (failed && !advisory) {
  process.exit(1);
}
