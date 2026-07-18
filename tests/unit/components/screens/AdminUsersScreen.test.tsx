import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUsersScreen } from "@/components/screens/AdminUsersScreen";
import { useAuth } from "@/lib/auth/context";
import { testIds } from "@/lib/testIds";

vi.mock("@/lib/auth/context", () => ({ useAuth: vi.fn() }));

function asAdmin() {
  vi.mocked(useAuth).mockReturnValue({
    user: { userId: "admin1", username: "admin", role: "admin" },
    isLoading: false,
  } as unknown as ReturnType<typeof useAuth>);
}

/** Mock the users list GET; capture PATCH/POST calls for assertions. */
function mockFetch(users: Array<Record<string, unknown>>) {
  const fetchMock = vi.fn(async (_url: string, opts?: { method?: string }) => {
    if (opts?.method && opts.method !== "GET") {
      return { ok: true, status: 200, json: async () => ({ ok: true }) } as Response;
    }
    return { ok: true, status: 200, json: async () => users } as Response;
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("AdminUsersScreen", () => {
  it("denies access to a non-admin user", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { username: "kid", role: "user" }, isLoading: false } as unknown as ReturnType<typeof useAuth>);
    render(<AdminUsersScreen />);
    expect(screen.getByTestId(testIds.component.adminUsers.root())).toHaveTextContent("אין הרשאה");
  });

  describe("account lifecycle", () => {
    const ACTIVE = { userId: "u2", username: "dana", role: "user", createdAt: "2026-01-01" };
    const DELETED = { ...ACTIVE, userId: "u3", username: "noa", status: "deleted" };

    it("hides deleted users until the toggle is checked", async () => {
      asAdmin();
      mockFetch([ACTIVE, DELETED]);
      render(<AdminUsersScreen />);

      await waitFor(() => expect(screen.getByTestId(testIds.component.adminUsers.userRow("u2"))).toBeInTheDocument());
      expect(screen.queryByTestId(testIds.component.adminUsers.userRow("u3"))).not.toBeInTheDocument();

      await userEvent.click(screen.getByTestId(testIds.component.adminUsers.showDeletedToggle()));
      expect(screen.getByTestId(testIds.component.adminUsers.userRow("u3"))).toBeInTheDocument();
    });

    it("treats a legacy user with no status field as active", async () => {
      asAdmin();
      mockFetch([ACTIVE]);
      render(<AdminUsersScreen />);
      await waitFor(() => expect(screen.getByTestId(testIds.component.adminUsers.userRow("u2"))).toBeInTheDocument());
      expect(screen.queryByTestId(testIds.component.adminUsers.statusBadge("u2"))).not.toBeInTheDocument();
      // No deleted accounts ⇒ no toggle to clutter the list.
      expect(screen.queryByTestId(testIds.component.adminUsers.showDeletedToggle())).not.toBeInTheDocument();
    });

    it("names the user in the delete dialog and only deletes on confirm", async () => {
      asAdmin();
      const fetchMock = mockFetch([ACTIVE]);
      render(<AdminUsersScreen />);
      await waitFor(() => expect(screen.getByTestId(testIds.component.adminUsers.userRow("u2"))).toBeInTheDocument());

      await userEvent.click(screen.getByTestId(testIds.component.adminUsers.deleteButton("u2")));
      expect(screen.getByTestId(testIds.component.adminUsers.deleteDialog())).toHaveTextContent("dana");

      await userEvent.click(screen.getByTestId(testIds.component.adminUsers.deleteCancel("u2")));
      expect(fetchMock.mock.calls.some(([, o]) => (o as { method?: string })?.method === "DELETE")).toBe(false);

      await userEvent.click(screen.getByTestId(testIds.component.adminUsers.deleteButton("u2")));
      await userEvent.click(screen.getByTestId(testIds.component.adminUsers.deleteConfirm("u2")));
      await waitFor(() =>
        expect(fetchMock.mock.calls.some(([, o]) => (o as { method?: string })?.method === "DELETE")).toBe(true),
      );
    });

    it("offers restore on a deleted user and sends the restore action", async () => {
      asAdmin();
      const fetchMock = mockFetch([DELETED]);
      render(<AdminUsersScreen />);
      await userEvent.click(await screen.findByTestId(testIds.component.adminUsers.showDeletedToggle()));

      await userEvent.click(screen.getByTestId(testIds.component.adminUsers.restoreButton("u3")));
      await waitFor(() => {
        const patch = fetchMock.mock.calls.find(([, o]) => (o as { method?: string })?.method === "PATCH");
        expect(JSON.parse((patch?.[1] as { body: string }).body)).toMatchObject({
          userId: "u3",
          action: "restore",
        });
      });
    });

    // The common guardian request is about a child who has already been deleted, so export has
    // to be reachable from a deleted row too — not just an active one.
    it("offers export on both active and deleted rows", async () => {
      asAdmin();
      mockFetch([ACTIVE, DELETED]);
      render(<AdminUsersScreen />);

      expect(await screen.findByTestId(testIds.component.adminUsers.exportButton("u2"))).toHaveAttribute(
        "href",
        "/api/admin/users/export?userId=u2",
      );

      await userEvent.click(screen.getByTestId(testIds.component.adminUsers.showDeletedToggle()));
      expect(screen.getByTestId(testIds.component.adminUsers.exportButton("u3"))).toBeInTheDocument();
    });

    it("sends deactivate for an active user", async () => {
      asAdmin();
      const fetchMock = mockFetch([ACTIVE]);
      render(<AdminUsersScreen />);
      await userEvent.click(await screen.findByTestId(testIds.component.adminUsers.deactivateButton("u2")));
      await waitFor(() => {
        const patch = fetchMock.mock.calls.find(([, o]) => (o as { method?: string })?.method === "PATCH");
        expect(JSON.parse((patch?.[1] as { body: string }).body)).toMatchObject({
          userId: "u2",
          action: "deactivate",
        });
      });
    });
  });

  it("shows the management form + 'allow simple password' override for an admin", () => {
    asAdmin();
    mockFetch([]);
    render(<AdminUsersScreen />);
    expect(screen.getByTestId(testIds.component.adminUsers.addForm())).toBeInTheDocument();
    expect(screen.getByTestId(testIds.component.adminUsers.overridePolicyToggle())).toBeInTheDocument();
  });

  it("shows a locked badge + unlock button, and unlock PATCHes action:unlock", async () => {
    asAdmin();
    const fetchMock = mockFetch([
      { userId: "u2", username: "Kid", role: "user", createdAt: "2024-01-01", isLocked: true },
    ]);
    render(<AdminUsersScreen />);

    expect(await screen.findByTestId(testIds.component.adminUsers.lockedBadge("u2"))).toBeInTheDocument();
    const unlockBtn = screen.getByTestId(testIds.component.adminUsers.unlockButton("u2"));
    await userEvent.click(unlockBtn);

    await waitFor(() => {
      const patch = fetchMock.mock.calls.find(([, opts]) => (opts as { method?: string })?.method === "PATCH");
      expect(patch).toBeTruthy();
      expect(JSON.parse((patch![1] as { body: string }).body)).toEqual({ userId: "u2", action: "unlock" });
    });
  });

  it("does not show a lock badge/unlock for an unlocked user", async () => {
    asAdmin();
    mockFetch([{ userId: "u3", username: "Ari", role: "user", createdAt: "2024-01-01", isLocked: false }]);
    render(<AdminUsersScreen />);
    await screen.findByTestId(testIds.component.adminUsers.userRow("u3"));
    expect(screen.queryByTestId(testIds.component.adminUsers.lockedBadge("u3"))).toBeNull();
    expect(screen.queryByTestId(testIds.component.adminUsers.unlockButton("u3"))).toBeNull();
  });
});
