import { test, expect } from "@playwright/test";
import { testIds } from "@/lib/testIds";

/**
 * TTS accessibility smoke tests.
 *
 * speechSynthesis is not available in headless Chromium, so we mock it via
 * addInitScript to keep the toggle visible and testable without real audio.
 */

const GRADE = "a";
const DAY_URL = `/grade/${GRADE}/day/day-1`;

async function mockSpeechSynthesis(page: Parameters<typeof test>[1]) {
  await page.addInitScript(() => {
    // @ts-expect-error test mock
    window.__KIDS_MATH_E2E_TTS_MOCK__ = true;
    const synth = {
      speak: () => undefined,
      cancel: () => undefined,
      resume: () => undefined,
      getVoices: () => [
        {
          name: "Carmit",
          lang: "he-IL",
          localService: true,
          default: false,
          voiceURI: "Carmit",
        },
      ],
      speaking: false,
      pending: false,
      paused: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    };
    Object.defineProperty(window, "speechSynthesis", {
      get: () => synth,
      configurable: true,
    });
    // @ts-expect-error test mock
    window.SpeechSynthesisUtterance = class {
      lang = "";
      rate = 1;
      pitch = 1;
      voice = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {}
    };
  });
}

test.describe("Student TTS toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await mockSpeechSynthesis(page);
  });

  test("toggle is visible in TopBar when admin TTS is enabled (default)", async ({ page }) => {
    await page.goto(DAY_URL);
    const toggle = page.getByTestId(testIds.component.topBar.studentTtsToggle());
    await expect(toggle).toBeVisible();
  });

  test("toggle shows OFF state by default", async ({ page }) => {
    await page.goto(DAY_URL);
    const toggle = page.getByTestId(testIds.component.topBar.studentTtsToggle());
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  test("clicking toggle switches to ON state", async ({ page }) => {
    await page.goto(DAY_URL);
    const toggle = page.getByTestId(testIds.component.topBar.studentTtsToggle());
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  test("toggle ON state persists across navigation within the same session", async ({ page }) => {
    await page.goto(DAY_URL);
    const toggle = page.getByTestId(testIds.component.topBar.studentTtsToggle());
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    // Navigate away and back
    await page.goto(`/grade/${GRADE}`);
    await page.goto(DAY_URL);
    const toggleAfterNav = page.getByTestId(testIds.component.topBar.studentTtsToggle());
    await expect(toggleAfterNav).toHaveAttribute("aria-pressed", "true");
  });

  test("toggle is hidden when admin disables TTS", async ({ page }) => {
    // Set admin prefs with TTS disabled
    await page.addInitScript(() => {
      localStorage.setItem(
        "kids_math.admin_prefs.v1",
        JSON.stringify({ ttsEnabled: false }),
      );
    });
    await page.goto(DAY_URL);
    const toggle = page.getByTestId(testIds.component.topBar.studentTtsToggle());
    await expect(toggle).not.toBeVisible();
  });
});
