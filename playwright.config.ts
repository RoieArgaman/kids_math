import { defineConfig, devices } from "@playwright/test";

const PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005";
const PLAYWRIGHT_WEB_SERVER_URL = process.env.PLAYWRIGHT_WEB_SERVER_URL ?? PLAYWRIGHT_BASE_URL;
const PLAYWRIGHT_WEB_SERVER_COMMAND =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
  (process.env.CI ? "npm run start -- -p 3005" : "npm run dev -- -p 3005");

// Optional explicit Chromium binary. Used by managed/remote environments that ship a
// pre-installed browser whose build differs from the one this @playwright/test version
// would download. Inert in CI (env unset there), which installs its own matching browser
// via `npx playwright install --with-deps chromium`, so committing this changes nothing
// about CI or a normal local run.
const PLAYWRIGHT_CHROMIUM_EXECUTABLE = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Local: `list` only (unchanged dev behavior). CI: also emit a `blob` report per shard,
  // which the `e2e-report` job in ci.yml downloads and stitches into one HTML report via
  // `playwright merge-reports`. Playwright names each blob by its shard index automatically.
  reporter: process.env.CI ? [["list"], ["blob"]] : [["list"]],
  use: {
    baseURL: PLAYWRIGHT_BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(PLAYWRIGHT_CHROMIUM_EXECUTABLE
          ? { launchOptions: { executablePath: PLAYWRIGHT_CHROMIUM_EXECUTABLE } }
          : {}),
      },
    },
  ],
  // CI uses production server (expects `npm run build` first). Local defaults to dev on port 3005
  // to avoid clashing with a common `next dev` on 3000.
  webServer: {
    command: PLAYWRIGHT_WEB_SERVER_COMMAND,
    url: PLAYWRIGHT_WEB_SERVER_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
