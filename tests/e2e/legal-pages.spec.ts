import { expect, test } from "@playwright/test";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/cookieConsent/storage";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";

async function preAcceptCookieConsent(page: import("@playwright/test").Page) {
  await page.goto(routes.gradePicker());
  await page.evaluate((key) => {
    window.localStorage.setItem(key, "1");
  }, COOKIE_CONSENT_STORAGE_KEY);
}

test.describe("legal pages", () => {
  test("privacy page renders with tier-1 test id", async ({ page }) => {
    await preAcceptCookieConsent(page);
    await page.goto(routes.privacy());
    await expect(page.getByTestId(testIds.screen.privacy.root())).toBeVisible();
    await expect(page.getByRole("heading", { name: "מדיניות פרטיות" })).toBeVisible();
  });

  test("cookies page renders with tier-1 test id", async ({ page }) => {
    await preAcceptCookieConsent(page);
    await page.goto(routes.cookies());
    await expect(page.getByTestId(testIds.screen.cookies.root())).toBeVisible();
    await expect(page.getByRole("heading", { name: "מדיניות עוגיות ואחסון דומה" })).toBeVisible();
  });

  test("footer links navigate from home to legal pages", async ({ page }) => {
    await preAcceptCookieConsent(page);
    await page.goto(routes.gradePicker());
    await expect(page.getByTestId(testIds.layout.siteFooter.root())).toBeVisible();
    await page.getByTestId(testIds.layout.siteFooter.linkPrivacy()).click();
    await expect(page).toHaveURL(new RegExp(`${routes.privacy().replace("?", "\\?")}$`));
    await expect(page.getByTestId(testIds.screen.privacy.root())).toBeVisible();

    await preAcceptCookieConsent(page);
    await page.goto(routes.gradePicker());
    await page.getByTestId(testIds.layout.siteFooter.linkCookies()).click();
    await expect(page).toHaveURL(new RegExp(`${routes.cookies().replace("?", "\\?")}$`));
    await expect(page.getByTestId(testIds.screen.cookies.root())).toBeVisible();
  });

  test("cookie consent banner appears then stays dismissed after reload", async ({ page }) => {
    await page.goto(routes.gradePicker());
    await page.evaluate((key) => {
      window.localStorage.removeItem(key);
    }, COOKIE_CONSENT_STORAGE_KEY);
    await page.reload();

    const bannerRoot = testIds.layout.cookieConsent.root();
    await expect(page.getByTestId(bannerRoot)).toBeVisible();
    await page.getByTestId(childTid(bannerRoot, "cta", "accept")).click();
    await expect(page.getByTestId(bannerRoot)).toHaveCount(0);

    await page.reload();
    await expect(page.getByTestId(bannerRoot)).toHaveCount(0);
  });
});
