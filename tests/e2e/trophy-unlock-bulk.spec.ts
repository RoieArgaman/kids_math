import { expect, test } from "@playwright/test";
import { BADGE_DEFINITIONS } from "@/lib/badges/definitions";
import { testIds } from "@/lib/testIds";
import { seedBadgeState } from "./testUtils";

/**
 * TrophyUnlock with many simultaneous unseen unlocks must keep the confirm CTA reachable
 * (scrollable badge list, viewport-bounded dialog).
 * Badge localStorage: `kids_math.badges.v1.grade.<grade>` (see `lib/badges/storage.ts` + `seedBadgeState` in testUtils).
 */
test.describe("trophy unlock bulk badges", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    const now = new Date().toISOString();
    const unlocked = BADGE_DEFINITIONS.slice(0, 22).map((b) => ({
      id: b.id,
      unlockedAt: now,
    }));
    await seedBadgeState(page, "a", {
      version: 1,
      grade: "a",
      unlocked,
      seenIds: [],
      updatedAt: now,
    });
    await page.setViewportSize({ width: 390, height: 520 });
    await page.goto("/grade/a");
  });

  test("confirm stays in viewport and dismisses modal", async ({ page }) => {
    const overlay = page.getByTestId(testIds.component.trophyUnlock.overlay());
    const confirm = page.getByTestId(testIds.component.trophyUnlock.confirm());
    await expect(overlay).toBeVisible();
    await expect(confirm).toBeInViewport();
    await confirm.click();
    await expect(overlay).toBeHidden();
  });
});
