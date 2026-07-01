import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopBar } from "@/components/layout/TopBar";
import { useAuth } from "@/lib/auth/context";
import { testIds } from "@/lib/testIds";

vi.mock("@/lib/auth/context", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/hooks/useAdminTtsEnabled", () => ({
  useAdminTtsEnabled: () => ({ ttsEnabled: false, hydrated: true }),
}));
vi.mock("@/components/providers/StudentTtsProvider", () => ({
  useStudentTts: () => ({ autoPlay: false, setAutoPlay: vi.fn(), hydrated: true }),
}));

function setAuth(value: Record<string, unknown>) {
  vi.mocked(useAuth).mockReturnValue({ login: vi.fn(), logout: vi.fn(), ...value } as ReturnType<typeof useAuth>);
}

beforeEach(() => vi.clearAllMocks());

describe("TopBar", () => {
  it("renders a bare skeleton bar while the session is loading", () => {
    setAuth({ isLoading: true, isLoggedIn: false });
    render(<TopBar />);
    expect(screen.getByTestId(testIds.component.auth.topBar())).toBeInTheDocument();
    expect(screen.queryByTestId(testIds.component.auth.loginButton())).toBeNull();
  });

  it("shows a login button when logged out and opens the modal on click", async () => {
    setAuth({ isLoading: false, isLoggedIn: false });
    render(<TopBar />);
    await userEvent.click(screen.getByTestId(testIds.component.auth.loginButton()));
    expect(screen.getByTestId(testIds.component.auth.loginModal())).toBeInTheDocument();
  });

  it("shows the user avatar when logged in", () => {
    setAuth({ isLoading: false, isLoggedIn: true, user: { username: "kid", role: "user" } });
    render(<TopBar />);
    expect(screen.getByTestId(testIds.component.auth.avatar())).toBeInTheDocument();
    expect(screen.queryByTestId(testIds.component.auth.loginButton())).toBeNull();
  });
});
