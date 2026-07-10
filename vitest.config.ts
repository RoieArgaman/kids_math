import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Match Next.js: components rely on the automatic JSX runtime and do not
  // import React explicitly. Without this, esbuild defaults to the classic
  // runtime and component tests fail with "React is not defined".
  esbuild: {
    jsx: "automatic",
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
      // baseline (2026-07-10) so CI is green today but cannot regress. Glob
      // keys check the AGGREGATE of matching files (perFile is off); the
      // global block is the floor across all included files. Raise these as
      // coverage improves — never lower to make a red build pass; add a test.
      thresholds: {
        // Global floor (baseline: 90.95 lines / 84.44 branches / 70.52 funcs).
        // functions floor is low because several React hooks in lib/hooks are
        // exercised only via E2E, not unit — out of scope for this gate.
        lines: 88,
        statements: 88,
        branches: 82,
        functions: 68,

        // --- Highest-risk domains (CLAUDE.md MAX areas): teeth here ---

        // Exam grading is fully covered today — keep it that way.
        "lib/exam/**": { lines: 100, branches: 100, functions: 100, statements: 100 },
        "lib/gradeUnlock.ts": { lines: 100, branches: 100, functions: 100, statements: 100 },

        // Storage / progression: pinned ~1-2pts below baseline.
        "lib/progress/**": { lines: 87, branches: 79, functions: 95, statements: 87 },
        "lib/final-exam/**": { lines: 88, branches: 69, functions: 100, statements: 88 },
        "lib/gmat-challenge/**": { lines: 82, branches: 62, functions: 90, statements: 82 },
        "lib/completion/**": { lines: 95, branches: 80, functions: 100, statements: 95 },
        "lib/review/**": { lines: 94, branches: 88, functions: 100, statements: 94 },
        "lib/badges/**": { lines: 91, branches: 72, functions: 100, statements: 91 },
        "lib/streak/**": { lines: 96, branches: 79, functions: 100, statements: 96 },
        "lib/user-data/**": { lines: 85, branches: 72, functions: 92, statements: 85 },
      },
    },
  },
});
