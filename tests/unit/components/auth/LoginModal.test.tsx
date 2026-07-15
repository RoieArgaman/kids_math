import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/lib/auth/context";
import { testIds } from "@/lib/testIds";

vi.mock("@/lib/auth/context", () => ({ useAuth: vi.fn() }));
// TTS is a no-op in jsdom; keep it out of the way (locked path calls speakHebrew).
vi.mock("@/lib/tts/engine", () => ({ isTtsSupported: () => false, speakHebrew: vi.fn() }));

function setLogin(login: ReturnType<typeof vi.fn>) {
  vi.mocked(useAuth).mockReturnValue({ login } as unknown as ReturnType<typeof useAuth>);
}

async function fillAndSubmit(user = "roie", pw = "pw") {
  await userEvent.type(screen.getByTestId(testIds.component.auth.usernameInput()), user);
  await userEvent.type(screen.getByTestId(testIds.component.auth.passwordInput()), pw);
  await userEvent.click(screen.getByTestId(testIds.component.auth.submitButton()));
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
    const login = vi.fn().mockResolvedValue({ ok: true, user: { userId: "u1" } });
    const onClose = vi.fn();
    setLogin(login);
    render(<LoginModal onClose={onClose} />);
    await fillAndSubmit();
    expect(login).toHaveBeenCalledWith("roie", "pw");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("toggles password visibility with the show-password button", async () => {
    setLogin(vi.fn());
    render(<LoginModal onClose={vi.fn()} />);
    const pw = screen.getByTestId(testIds.component.auth.passwordInput());
    expect(pw).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByTestId(testIds.component.auth.showPasswordToggle()));
    expect(pw).toHaveAttribute("type", "text");
    await userEvent.click(screen.getByTestId(testIds.component.auth.showPasswordToggle()));
    expect(pw).toHaveAttribute("type", "password");
  });

  it("shows warm, blame-free copy on invalid credentials", async () => {
    setLogin(vi.fn().mockResolvedValue({ ok: false, kind: "invalid" }));
    render(<LoginModal onClose={vi.fn()} />);
    await fillAndSubmit("roie", "bad");
    expect(await screen.findByTestId(testIds.component.auth.errorMessage())).toHaveTextContent("ננסה שוב");
  });

  it("nudges 'one more try' when a single attempt remains", async () => {
    setLogin(vi.fn().mockResolvedValue({ ok: false, kind: "invalid", attemptsRemaining: 1 }));
    render(<LoginModal onClose={vi.fn()} />);
    await fillAndSubmit("roie", "bad");
    expect(await screen.findByTestId(testIds.component.auth.errorMessage())).toHaveTextContent("ניסיון אחד");
  });

  it("shows a calm countdown (not a red alert) and disables submit when locked", async () => {
    setLogin(vi.fn().mockResolvedValue({ ok: false, kind: "locked", retryAfterSeconds: 42 }));
    render(<LoginModal onClose={vi.fn()} />);
    await fillAndSubmit("roie", "bad");
    const countdown = await screen.findByTestId(testIds.component.auth.lockoutCountdown());
    expect(countdown).toHaveTextContent("42");
    expect(screen.queryByTestId(testIds.component.auth.errorMessage())).toBeNull();
    expect(screen.getByTestId(testIds.component.auth.submitButton())).toBeDisabled();
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    setLogin(vi.fn());
    render(<LoginModal onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
