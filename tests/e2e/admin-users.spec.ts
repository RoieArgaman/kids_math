import { test, expect } from "@playwright/test";
import { mockAuthApi, TEST_ADMIN } from "./testUtils";
import { testIds } from "@/lib/testIds";

// No `status` field — these are shaped like pre-Phase-3 docs, which must render as active.
const MOCK_USERS: Array<Record<string, unknown>> = [
  { userId: "user-1", username: "alice", role: "user", createdAt: "2024-01-01T00:00:00.000Z" },
  { userId: "user-2", username: "bob", role: "admin", createdAt: "2024-01-02T00:00:00.000Z" },
];

async function mockAdminUsersApi(page: Parameters<typeof mockAuthApi>[0]) {
  let users = [...MOCK_USERS];

  await page.route("/api/admin/users", async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(users) });
    }

    if (method === "POST") {
      const body = route.request().postDataJSON() as { username: string; password: string; role: string };
      const newUser = { userId: `user-${Date.now()}`, username: body.username, role: body.role, createdAt: new Date().toISOString() };
      users = [...users, newUser];
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(newUser) });
    }

    if (method === "PATCH") {
      const body = route.request().postDataJSON() as { userId: string; action?: string };
      if (body.action === "deactivate" || body.action === "restore") {
        const status = body.action === "restore" ? "active" : "deactivated";
        users = users.map((u) => (u.userId === body.userId ? { ...u, status } : u));
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }

    // Soft delete: the row is RETAINED with status "deleted" so restore is reachable. Mirrors
    // the real handler — modelling a hard delete here would let the UI drift from the server.
    if (method === "DELETE") {
      const body = route.request().postDataJSON() as { userId: string };
      users = users.map((u) => (u.userId === body.userId ? { ...u, status: "deleted" } : u));
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }

    return route.fulfill({ status: 405 });
  });
}

test.describe("Admin Users screen", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthApi(page, { loggedIn: true, user: TEST_ADMIN });
    await mockAdminUsersApi(page);
    await page.goto("/admin/users");
  });

  test("renders user list and add-user form without PIN prompt", async ({ page }) => {
    // No redirect — stays on /admin/users
    await expect(page).toHaveURL("/admin/users");

    // Add-user form is visible
    await expect(page.getByTestId(testIds.component.adminUsers.addForm())).toBeVisible();
    await expect(page.getByTestId(testIds.component.adminUsers.usernameInput())).toBeVisible();
    await expect(page.getByTestId(testIds.component.adminUsers.passwordInput())).toBeVisible();
    await expect(page.getByTestId(testIds.component.adminUsers.submitButton())).toBeVisible();

    // User rows are rendered
    await expect(page.getByTestId(testIds.component.adminUsers.userRow("user-1"))).toBeVisible();
    await expect(page.getByTestId(testIds.component.adminUsers.userRow("user-2"))).toBeVisible();
  });

  test("add user — success shows new user in list", async ({ page }) => {
    await page.getByTestId(testIds.component.adminUsers.usernameInput()).fill("newuser");
    await page.getByTestId(testIds.component.adminUsers.passwordInput()).fill("pass123");
    await page.getByTestId(testIds.component.adminUsers.submitButton()).click();

    await expect(page.getByText("המשתמש נוסף בהצלחה ✓")).toBeVisible();
    // form fields cleared
    await expect(page.getByTestId(testIds.component.adminUsers.usernameInput())).toHaveValue("");
  });

  test("change password — button opens inline form, save shows success", async ({ page }) => {
    const changePwBtn = page.getByTestId(testIds.component.adminUsers.changePasswordButton("user-1"));
    await expect(changePwBtn).toBeVisible();
    await changePwBtn.click();

    // Inline input appears, action buttons appear
    const input = page.getByTestId(testIds.component.adminUsers.changePasswordInput("user-1"));
    const saveBtn = page.getByTestId(testIds.component.adminUsers.changePasswordSubmit("user-1"));
    const cancelBtn = page.getByTestId(testIds.component.adminUsers.changePasswordCancel("user-1"));
    await expect(input).toBeVisible();
    await expect(saveBtn).toBeVisible();
    await expect(cancelBtn).toBeVisible();

    // Save is disabled until something is typed
    await expect(saveBtn).toBeDisabled();

    await input.fill("newpass123");
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    await expect(page.getByText("הסיסמה עודכנה ✓")).toBeVisible();
    // Inline form is dismissed
    await expect(input).not.toBeVisible();
  });

  test("change password — cancel closes inline form", async ({ page }) => {
    await page.getByTestId(testIds.component.adminUsers.changePasswordButton("user-1")).click();
    const input = page.getByTestId(testIds.component.adminUsers.changePasswordInput("user-1"));
    await expect(input).toBeVisible();

    await page.getByTestId(testIds.component.adminUsers.changePasswordCancel("user-1")).click();
    await expect(input).not.toBeVisible();
    // Normal action buttons are back
    await expect(page.getByTestId(testIds.component.adminUsers.changePasswordButton("user-1"))).toBeVisible();
  });

  test("non-admin sees 'no permission' and stays on /admin/users — no redirect", async ({ page, context }) => {
    // Fresh page with non-admin user
    const noAuthPage = await context.newPage();
    await noAuthPage.route("/api/auth/me", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Unauthorized" }) }),
    );
    await noAuthPage.goto("/admin/users");
    await expect(noAuthPage).toHaveURL("/admin/users");
    await expect(noAuthPage.getByText("אין הרשאה לעמוד זה")).toBeVisible();
    await noAuthPage.close();
  });

  test("delete is soft: confirm dialog names the user, row becomes restorable", async ({ page }) => {
    const tid = testIds.component.adminUsers;

    await page.getByTestId(tid.deleteButton("user-1")).click();

    const dialog = page.getByTestId(tid.deleteDialog());
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("alice");

    // Cancel must not delete.
    await page.getByTestId(tid.deleteCancel("user-1")).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId(tid.userRow("user-1"))).toBeVisible();

    await page.getByTestId(tid.deleteButton("user-1")).click();
    await page.getByTestId(tid.deleteConfirm("user-1")).click();

    // Hidden from the default list, but retained — revealed by the toggle, and restorable.
    await expect(page.getByTestId(tid.userRow("user-1"))).toBeHidden();
    await page.getByTestId(tid.showDeletedToggle()).check();
    await expect(page.getByTestId(tid.userRow("user-1"))).toBeVisible();
    await expect(page.getByTestId(tid.statusBadge("user-1"))).toBeVisible();

    await page.getByTestId(tid.restoreButton("user-1")).click();
    await expect(page.getByTestId(tid.statusBadge("user-1"))).toBeHidden();
  });

  test("deactivate marks the row and offers reactivation", async ({ page }) => {
    const tid = testIds.component.adminUsers;

    await page.getByTestId(tid.deactivateButton("user-1")).click();
    await expect(page.getByTestId(tid.statusBadge("user-1"))).toBeVisible();

    await page.getByTestId(tid.restoreButton("user-1")).click();
    await expect(page.getByTestId(tid.statusBadge("user-1"))).toBeHidden();
  });
});
