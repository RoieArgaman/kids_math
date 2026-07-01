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
  },
});
