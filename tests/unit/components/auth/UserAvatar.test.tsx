import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { useAuth } from "@/lib/auth/context";
import { testIds } from "@/lib/testIds";

vi.mock("@/lib/auth/context", () => ({ useAuth: vi.fn() }));

function setUser(user: unknown, logout = vi.fn(), logoutAll = vi.fn()) {
  vi.mocked(useAuth).mockReturnValue({ user, logout, logoutAll } as ReturnType<typeof useAuth>);
  return { logout, logoutAll };
}

beforeEach(() => vi.clearAllMocks());

describe("UserAvatar", () => {
  it("renders nothing when logged out", () => {
    setUser(null);
    render(<UserAvatar />);
    expect(screen.queryByTestId(testIds.component.auth.avatar())).toBeNull();
  });

  it("shows uppercased initials for the logged-in user", () => {
    setUser({ username: "roie", role: "user" });
    render(<UserAvatar />);
    expect(screen.getByTestId(testIds.component.auth.avatarButton())).toHaveTextContent("RO");
  });

  it("toggles the dropdown and shows the admin link only for admins", async () => {
    setUser({ username: "admin1", role: "admin" });
    render(<UserAvatar />);
    expect(screen.queryByTestId(testIds.component.auth.avatarDropdown())).toBeNull();
    await userEvent.click(screen.getByTestId(testIds.component.auth.avatarButton()));
    expect(screen.getByTestId(testIds.component.auth.avatarDropdown())).toBeInTheDocument();
    expect(screen.getByTestId(testIds.component.auth.adminUsersLink())).toHaveAttribute("href", "/admin/users");
  });

  it("hides the admin link for a non-admin and logs out on click", async () => {
    const { logout } = setUser({ username: "kid", role: "user" });
    render(<UserAvatar />);
    await userEvent.click(screen.getByTestId(testIds.component.auth.avatarButton()));
    expect(screen.queryByTestId(testIds.component.auth.adminUsersLink())).toBeNull();
    await userEvent.click(screen.getByTestId(testIds.component.auth.logoutButton()));
    expect(logout).toHaveBeenCalledOnce();
  });

  it("shows 'log out everywhere' only for admins and calls logoutAll on click", async () => {
    const { logoutAll } = setUser({ username: "admin1", role: "admin" });
    render(<UserAvatar />);
    await userEvent.click(screen.getByTestId(testIds.component.auth.avatarButton()));
    await userEvent.click(screen.getByTestId(testIds.component.auth.logoutEverywhereButton()));
    expect(logoutAll).toHaveBeenCalledOnce();
  });

  it("hides 'log out everywhere' from a non-admin (kid) menu", async () => {
    setUser({ username: "kid", role: "user" });
    render(<UserAvatar />);
    await userEvent.click(screen.getByTestId(testIds.component.auth.avatarButton()));
    expect(screen.queryByTestId(testIds.component.auth.logoutEverywhereButton())).toBeNull();
  });
});
