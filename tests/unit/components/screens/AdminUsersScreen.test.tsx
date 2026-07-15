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
