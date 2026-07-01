import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/lib/auth/context";
import { testIds } from "@/lib/testIds";

vi.mock("@/lib/auth/context", () => ({ useAuth: vi.fn() }));

function setLogin(login: ReturnType<typeof vi.fn>) {
  vi.mocked(useAuth).mockReturnValue({ login } as unknown as ReturnType<typeof useAuth>);
}

beforeEach(() => vi.clearAllMocks());

describe("LoginModal", () => {
  it("keeps submit disabled until both fields are filled", async () => {
    setLogin(vi.fn());
    render(<LoginModal onClose={vi.fn()} />);
    expect(screen.getByTestId(testIds.component.auth.submitButton())).toBeDisabled();
    await userEvent.type(screen.getByTestId(testIds.component.auth.usernameInput()), "roie");
    await userEvent.type(screen.getByTestId(testIds.component.auth.passwordInput()), "pw");
    expect(screen.getByTestId(testIds.component.auth.submitButton())).toBeEnabled();
  });

  it("closes on a successful login", async () => {
    const login = vi.fn().mockResolvedValue({ ok: true });
    const onClose = vi.fn();
    setLogin(login);
    render(<LoginModal onClose={onClose} />);
    await userEvent.type(screen.getByTestId(testIds.component.auth.usernameInput()), "roie");
    await userEvent.type(screen.getByTestId(testIds.component.auth.passwordInput()), "pw");
    await userEvent.click(screen.getByTestId(testIds.component.auth.submitButton()));
    expect(login).toHaveBeenCalledWith("roie", "pw");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("surfaces the error message on a failed login", async () => {
    setLogin(vi.fn().mockResolvedValue({ ok: false, error: "שם משתמש או סיסמה שגויים" }));
    render(<LoginModal onClose={vi.fn()} />);
    await userEvent.type(screen.getByTestId(testIds.component.auth.usernameInput()), "roie");
    await userEvent.type(screen.getByTestId(testIds.component.auth.passwordInput()), "bad");
    await userEvent.click(screen.getByTestId(testIds.component.auth.submitButton()));
    expect(await screen.findByTestId(testIds.component.auth.errorMessage())).toHaveTextContent("שגויים");
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    setLogin(vi.fn());
    render(<LoginModal onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
