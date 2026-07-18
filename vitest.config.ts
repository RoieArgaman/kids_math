import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Match Next.js: components rely on the automatic JSX runtime and do not
  // import React explicitly. Without this the transformer defaults to the
  // classic runtime and component tests fail with "React is not defined".
  // Vite 8 (Vitest 4) transforms with oxc, not esbuild — the old `esbuild.jsx`
  // key is ignored, which surfaces as "Unexpected JSX expression" on .tsx.
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // .tsx included so JSX component tests are collected — a *.test.tsx file
    // would otherwise be silently skipped (pass with zero tests = false green).
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      // Scope to lib/ — the risk areas (storage/exam/grade-unlock). Components
      // and app/ are covered by unit + E2E but intentionally not gated here.
      include: ["lib/**/*.{ts,tsx}"],
      exclude: [
        // Node/Admin SDK surfaces jsdom can't meaningfully exercise.
        "lib/server/**",
        "lib/firestore/**",
        // Pure types / barrels — no executable lines to cover.
        "lib/types/**",
        "lib/**/types.ts",
        "lib/types.ts",
        "lib/**/*.d.ts",
        "lib/**/index.ts",
      ],
      // Ratchet, not big-bang. Values are pinned just below the measured
      // baseline (re-based 2026-07-18) so CI is green today but cannot
      // regress. Glob keys check the AGGREGATE of matching files (perFile is
      // off); the global block is the floor across all included files. Raise
      // these as coverage improves — never lower to make a red build pass;
      // add a test.
      //
      // RE-BASELINE (2026-07-18, @vitest/coverage-v8 2.x → 4.x): v4 made
      // AST-aware remapping unconditional and removed the opt-out flag, so it
      // no longer credits non-executable lines. Identical tests and source
      // measured 91.26% statements / 85.26% branches under v2 and 75.47% /
      // 74.45% under v4 — a ~16pt methodology shift, NOT a coverage
      // regression. Every threshold below was re-derived from the v4 numbers.
      // Do not compare these against pre-2026-07-18 values.
      thresholds: {
        // Global floor (measured 2026-07-18 after the badges/gmat test pass:
        // 79.02 lines / 77.84 stmts / 78.23 branches / 70.55 funcs).
        // functions floor is low because several React hooks in lib/hooks are
        // exercised only via E2E, not unit — out of scope for this gate.
        lines: 78,
        statements: 77,
        branches: 77,
        functions: 69,

        // --- Highest-risk domains (CLAUDE.md MAX areas): teeth here ---

        // Exam grading is fully covered today — keep it that way.
        "lib/exam/**": { lines: 100, branches: 100, functions: 100, statements: 100 },
        "lib/gradeUnlock.ts": { lines: 100, branches: 100, functions: 100, statements: 100 },

        // Storage / progression: pinned ~1-2pts below the v4 baseline.
        "lib/progress/**": { lines: 83, branches: 76, functions: 93, statements: 83 },
        "lib/final-exam/**": { lines: 89, branches: 64, functions: 89, statements: 82 },
        // Ratcheted up 2026-07-18: loader-rejection + config + grading tests
        // took this from 71/55 to 94.86/90.97. The remaining branch gap is
        // picker.ts's leftover-backfill and insufficient-bank throw, which are
        // unreachable with a healthy curriculum — deliberately not mocked.
        "lib/gmat-challenge/**": { lines: 96, branches: 92, functions: 100, statements: 95 },
        "lib/completion/**": { lines: 98, branches: 84, functions: 100, statements: 92 },
        "lib/review/**": { lines: 95, branches: 85, functions: 100, statements: 90 },
        // Ratcheted up 2026-07-18: the higher badge tiers (calendar streaks,
        // grand-master, strand + graduation badges) plus the SSR and sanitizer
        // fallbacks were previously unverified; 75/67 -> 100/98.22. Pinned at
        // 100 like lib/exam — the module is fully covered, so any new
        // uncovered line is a missing test, not an acceptable drift.
        "lib/badges/**": { lines: 100, branches: 97, functions: 100, statements: 100 },
        "lib/streak/**": { lines: 98, branches: 82, functions: 100, statements: 88 },
        "lib/user-data/**": { lines: 84, branches: 73, functions: 92, statements: 80 },
        // Per-file, not `lib/auth/**`: that glob averages in api.ts (client fetch wrapper, E2E-
        // only) and context.tsx, dragging the aggregate to ~78 and forcing a toothless threshold.
        // These two are the authorization boundary and are fully covered.
        "lib/auth/session.server.ts": { lines: 100, branches: 100, functions: 100, statements: 100 },
        "lib/auth/accountStatus.ts": { lines: 100, branches: 100, functions: 100, statements: 100 },
      },
    },
  },
});
