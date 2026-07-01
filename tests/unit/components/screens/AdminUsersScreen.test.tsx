import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminUsersScreen } from "@/components/screens/AdminUsersScreen";
import { useAuth } from "@/lib/auth/context";
import { testIds } from "@/lib/testIds";

vi.mock("@/lib/auth/context", () => ({ useAuth: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

describe("AdminUsersScreen", () => {
  it("denies access to a non-admin user", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { username: "kid", role: "user" }, isLoading: false } as unknown as ReturnType<typeof useAuth>);
    render(<AdminUsersScreen />);
    expect(screen.getByTestId(testIds.component.adminUsers.root())).toHaveTextContent("אין הרשאה");
  });

  it("shows the management form for an admin", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { username: "admin", role: "admin" }, isLoading: false } as unknown as ReturnType<typeof useAuth>);
    render(<AdminUsersScreen />);
    expect(screen.getByTestId(testIds.component.adminUsers.addForm())).toBeInTheDocument();
  });
});
