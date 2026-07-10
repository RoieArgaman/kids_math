import { expect, test, type Page } from "@playwright/test";
import { testIds } from "@/lib/testIds";
import { TEST_PASSWORD } from "./testUtils";

/**
 * Per-student progress isolation (the reported bug).
 *
 * Principle under test: every student's progress is their own and confidential to
 * other students. When logged in, progress comes from the server for THAT student;
 * on logout the device wipes to zero; a different student sees only their own data.
 *
 * These run against a per-user mock server (`/api/user/progress` keyed by the
 * logged-in user), so we can prove isolation without real Firestore. Assertions
 * read the workbook localStorage key — the exact source the UI renders from — so
 * they directly encode the isolation contract.
 */

const WORKBOOK_A_KEY = "kids_math.workbook_progress.v2.grade.a";

const ALICE = { userId: "user-alice", username: "alice", role: "user" as const };
const BOB = { userId: "user-bob", username: "bob", role: "user" as const };

type Bundle = Record<string, unknown>;

/** A server bundle for a student who has completed grade-A day-1. */
function bundleWithCompletedDay1(): Bundle {
  const now = new Date().toISOString();
  return {
    bundleVersion: 4,
    updatedAt: now,
    streak: null,
    grades: {
      a: {
        workbook: {
          version: 1,
          updatedAt: now,
          days: {
            "day-1": {
              dayId: "day-1",
              answers: {},
              correctAnswers: {},
              wrongCount: 0,
              wrongBySection: {},
              attempts: [],
              percentDone: 100,
              isComplete: true,
              updatedAt: now,
            },
          },
        },
        badges: null,
        finalExam: null,
        gmat: null,
        review: null,
      },
      b: { workbook: null, badges: null, finalExam: null, gmat: null, review: null },
    },
  };
}

/**
 * Installs a mock auth + per-user progress server. `store` is keyed by userId and
 * is mutated by POSTs, so a push under one identity can never surface under
 * another — mirroring real per-doc storage.
 */
async function mockMultiUser(page: Page, store: Record<string, Bundle | null>): Promise<void> {
  const users: Record<string, typeof ALICE | typeof BOB> = { alice: ALICE, bob: BOB };
  let sessionUser: typeof ALICE | typeof BOB | null = null;

  await page.route("/api/auth/me", (route) =>
    sessionUser
      ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sessionUser) })
      : route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Unauthorized" }) }),
  );

  await page.route("/api/auth/login", (route) => {
    const body = route.request().postDataJSON() as { username?: string; password?: string } | null;
    const u = body?.username ? users[body.username] : undefined;
    if (u && body?.password === TEST_PASSWORD) {
      sessionUser = u;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: u }) });
    }
    return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Invalid credentials" }) });
  });

  await page.route("/api/auth/logout", (route) => {
    sessionUser = null;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });

  await page.route("/api/user/progress", (route) => {
    if (route.request().method() === "GET") {
      const bundle = sessionUser ? store[sessionUser.userId] ?? null : null;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(bundle) });
    }
    // POST — store under the CURRENT identity only.
    if (sessionUser) {
      try {
        store[sessionUser.userId] = route.request().postDataJSON() as Bundle;
      } catch {
        /* ignore */
      }
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

async function login(page: Page, username: string): Promise<void> {
  await page.getByTestId(testIds.component.auth.loginButton()).click();
  await page.getByTestId(testIds.component.auth.usernameInput()).fill(username);
  await page.getByTestId(testIds.component.auth.passwordInput()).fill(TEST_PASSWORD);
  await page.getByTestId(testIds.component.auth.submitButton()).click();
  // Avatar appears only after reconcile completes (setUser is the last step).
  await expect(page.getByTestId(testIds.component.auth.avatar())).toBeVisible();
}

async function logout(page: Page): Promise<void> {
  await page.getByTestId(testIds.component.auth.avatarButton()).click();
  await page.getByTestId(testIds.component.auth.logoutButton()).click();
  await expect(page.getByTestId(testIds.component.auth.loginButton())).toBeVisible();
}

function readWorkbookA(page: Page): Promise<string | null> {
  return page.evaluate((key) => window.localStorage.getItem(key), WORKBOOK_A_KEY);
}

async function expectDay1Complete(page: Page): Promise<void> {
  const raw = await readWorkbookA(page);
  expect(raw).toBeTruthy();
  const parsed = JSON.parse(raw!) as { days: Record<string, { isComplete?: boolean }> };
  expect(parsed.days["day-1"]?.isComplete).toBe(true);
}

async function expectZeroProgress(page: Page): Promise<void> {
  const raw = await readWorkbookA(page);
  // Either the key is gone, or it holds no completed days.
  if (raw) {
    const parsed = JSON.parse(raw) as { days?: Record<string, unknown> };
    expect(Object.keys(parsed.days ?? {})).toHaveLength(0);
  } else {
    expect(raw).toBeNull();
  }
}

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test.describe("per-student progress isolation", () => {
  test("logging in loads the student's server progress (follow-me across devices)", async ({ page }) => {
    const store: Record<string, Bundle | null> = { [ALICE.userId]: bundleWithCompletedDay1() };
    await mockMultiUser(page, store);
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear()); // fresh device

    await login(page, "alice");
    // A brand-new device shows Alice's server progress — proves it followed her.
    await expectDay1Complete(page);
  });

  test("logout wipes the device to zero", async ({ page }) => {
    const store: Record<string, Bundle | null> = { [ALICE.userId]: bundleWithCompletedDay1() };
    await mockMultiUser(page, store);
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());

    await login(page, "alice");
    await expectDay1Complete(page);

    await logout(page);
    await expectZeroProgress(page);
  });

  test("a second student on the same computer sees only their own (empty) progress", async ({ page }) => {
    // Alice has progress on the server; Bob has none.
    const store: Record<string, Bundle | null> = {
      [ALICE.userId]: bundleWithCompletedDay1(),
      [BOB.userId]: null,
    };
    await mockMultiUser(page, store);
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());

    await login(page, "alice");
    await expectDay1Complete(page);
    await logout(page);
    await expectZeroProgress(page);

    // Bob logs in on the same machine — must NOT inherit Alice's completed day.
    await login(page, "bob");
    await expectZeroProgress(page);
  });

  test("Bob's session never contaminates Alice's server data", async ({ page }) => {
    const store: Record<string, Bundle | null> = {
      [ALICE.userId]: bundleWithCompletedDay1(),
      [BOB.userId]: null,
    };
    await mockMultiUser(page, store);
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());

    await login(page, "alice");
    await expectDay1Complete(page);
    await logout(page);

    await login(page, "bob"); // Bob's local is cleared; any push lands under Bob only
    await expectZeroProgress(page);
    await logout(page);

    // Alice logs back in — her server progress is intact, not overwritten by Bob.
    await login(page, "alice");
    await expectDay1Complete(page);
  });

  test("an anonymous (logged-out) learner's local progress is left untouched", async ({ page }) => {
    const store: Record<string, Bundle | null> = {};
    await mockMultiUser(page, store);
    await page.goto("/");
    // Seed anonymous local progress, then reload — no sync should wipe it.
    await page.evaluate((key) => {
      window.localStorage.clear();
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          updatedAt: new Date().toISOString(),
          days: {
            "day-2": {
              dayId: "day-2",
              answers: {},
              correctAnswers: {},
              wrongCount: 0,
              wrongBySection: {},
              attempts: [],
              percentDone: 100,
              isComplete: true,
            },
          },
        }),
      );
    }, WORKBOOK_A_KEY);
    await page.reload();
    await expect(page.getByTestId(testIds.component.auth.loginButton())).toBeVisible();

    const raw = await readWorkbookA(page);
    const parsed = JSON.parse(raw!) as { days: Record<string, { isComplete?: boolean }> };
    expect(parsed.days["day-2"]?.isComplete).toBe(true);
  });
});
