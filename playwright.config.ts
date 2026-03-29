import { defineConfig, devices } from "@playwright/test";

const PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005";
const PLAYWRIGHT_WEB_SERVER_URL = process.env.PLAYWRIGHT_WEB_SERVER_URL ?? PLAYWRIGHT_BASE_URL;
const PLAYWRIGHT_WEB_SERVER_COMMAND =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
  (process.env.CI ? "npm run start -- -p 3005" : "npm run dev -- -p 3005");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: PLAYWRIGHT_BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // CI uses production server (expects `npm run build` first). Local defaults to dev on port 3005
  // to avoid clashing with a common `next dev` on 3000.
  webServer: {
    command: PLAYWRIGHT_WEB_SERVER_COMMAND,
    url: PLAYWRIGHT_WEB_SERVER_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
