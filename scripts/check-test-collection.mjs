#!/usr/bin/env node
/**
 * Guard against SILENT UNDER-COLLECTION in the unit suite.
 *
 * Vitest reports "Test Files N passed (N)" using the number of files it actually
 * collected. If a file fails to collect it is simply absent from that total, so a
 * run that executed 176 of 179 files still prints all-green and exits 0.
 *
 * That happened during roadmap Phase 3.5 (D16): two consecutive runs of identical
 * code reported 179/1472 and 176/1442. The 3 missing files were never flagged —
 * the suite "passed" while 30 tests had not run.
 *
 * This compares the files Vitest reported against the files on disk and fails on
 * any shortfall, converting a silent gap into a loud one.
 */
import { readFileSync, existsSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const TEST_DIR = join(ROOT, "tests/unit");
const REPORT = join(ROOT, ".vitest-report.json");

function testFilesOnDisk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...testFilesOnDisk(p));
    else if (/\.test\.tsx?$/.test(entry)) out.push(p);
  }
  return out;
}

if (!existsSync(REPORT)) {
  console.error(`[check-test-collection] No ${relative(ROOT, REPORT)} — did the vitest json reporter run?`);
  process.exit(1);
}

const report = JSON.parse(readFileSync(REPORT, "utf8"));
const collected = new Set((report.testResults ?? []).map((r) => resolve(r.name)));
const onDisk = testFilesOnDisk(TEST_DIR).map((p) => resolve(p));
const missing = onDisk.filter((p) => !collected.has(p));

if (missing.length > 0) {
  console.error(
    `[check-test-collection] ${missing.length} test file(s) on disk were NOT collected — ` +
      `the suite reported success without running them:\n` +
      missing.map((p) => `  ${relative(ROOT, p)}`).join("\n"),
  );
  process.exit(1);
}

// A failing run is Vitest's job to report; this guard only owns collection.
console.log(`[check-test-collection] OK — ${onDisk.length}/${onDisk.length} test files collected`);
