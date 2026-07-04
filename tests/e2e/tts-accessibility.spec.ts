import { test, expect } from "@playwright/test";
import type { WorkbookDay } from "@/lib/types";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import { testIds } from "@/lib/testIds";

/**
 * TTS accessibility smoke tests.
 *
 * Voice auto-play is always on for students (there is no student toggle) and is
 * gated only by the admin master TTS switch. Voice reaches the browser via two
 * paths (engine.ts `speakUtterance`): pre-generated neural audio via `new Audio()`
 * (manifest hit, the common case in a production build) or the Web Speech engine
 * (`speechSynthesis.speak`). We mock BOTH and record every spoken utterance on
 * `window.__KIDS_MATH_SPOKEN__` to assert auto-play behavior without real audio.
 *
 * The positive/negative auto-play assertions drive an exercise (section) page:
 * ExerciseBox auto-plays its prompt on mount behind an `autoPlayedRef` guard, so
 * it fires on the first effect invocation and survives React StrictMode's
 * dev-only double-invoke (unlike the primer, whose timer is cleared on re-run).
 */

const GRADE = "a";
const DAY_ID = "day-1";
const DAY_URL = `/grade/${GRADE}/day/${DAY_ID}`;

const AUTO_PLAY_WAIT_MS = 2000;

function warmupSectionId(): string {
  const byId = getWorkbookDaysById(GRADE) as Record<string, WorkbookDay>;
  return byId[DAY_ID]!.sections[0]!.id;
}

function firstSectionCta(page: Parameters<typeof test>[1]) {
  return page.getByTestId(
    testIds.screen.dayOverview.sectionCardCta(GRADE, DAY_ID, warmupSectionId()),
  );
}

async function mockSpeechSynthesis(page: Parameters<typeof test>[1]) {
  await page.addInitScript(() => {
    // @ts-expect-error test mock
    window.__KIDS_MATH_E2E_TTS_MOCK__ = true;
    // @ts-expect-error test mock
    window.__KIDS_MATH_SPOKEN__ = [];
    const synth = {
      speak: (utterance: { text?: string }) => {
        // Ignore empty warm-up utterances (audio-unlock prime); record real content only.
        const text = utterance?.text ?? "";
        if (!text) return;
        // @ts-expect-error test mock
        window.__KIDS_MATH_SPOKEN__.push(text);
      },
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
    // Manifest-first playback goes through `new Audio(url).play()`. Stub it so a
    // manifest hit records instead of hitting a real (autoplay-blocked) media element.
    // The silent `data:` prime from the audio-unlock gesture is ignored — only real
    // manifest URLs count as spoken content.
    // @ts-expect-error test mock
    window.Audio = class {
      src: string;
      volume = 1;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(src: string) {
        this.src = src;
        if (src && !src.startsWith("data:")) {
          // @ts-expect-error test mock
          window.__KIDS_MATH_SPOKEN__.push(`audio:${src}`);
        }
      }
      play() {
        return Promise.resolve();
      }
      pause() {
        return undefined;
      }
    };
  });
}

function spokenCount(page: Parameters<typeof test>[1]) {
  // @ts-expect-error test mock
  return page.evaluate(() => (window.__KIDS_MATH_SPOKEN__ ?? []).length);
}

test.describe("Student voice auto-play (always on)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await mockSpeechSynthesis(page);
  });

  test("the student TTS toggle button no longer exists", async ({ page }) => {
    await page.goto(DAY_URL);
    // Legacy testid was "km.component.topbar.studenttts.toggle" — it must be gone.
    await expect(page.locator('[data-testid*="studenttts"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: /הקראה אוטומטית/ })).toHaveCount(0);
  });

  test("exercise prompt auto-plays after entering a section (nav click unlocks audio)", async ({ page }) => {
    // No voice on load (autoplay policy) — the section-card click is the user gesture that
    // unlocks audio; the exercise prompt then plays automatically once the section mounts.
    await page.goto(DAY_URL);
    expect(await spokenCount(page)).toBe(0);
    await firstSectionCta(page).click();
    await page.waitForTimeout(AUTO_PLAY_WAIT_MS);
    expect(await spokenCount(page)).toBeGreaterThan(0);
  });

  test("voice stays silent when admin disables TTS (even after interaction)", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "kids_math.admin_prefs.v1",
        JSON.stringify({ ttsEnabled: false }),
      );
    });
    await page.goto(DAY_URL);
    await firstSectionCta(page).click();
    await page.waitForTimeout(AUTO_PLAY_WAIT_MS);
    expect(await spokenCount(page)).toBe(0);
  });
});
