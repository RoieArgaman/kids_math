"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { testIds } from "@/lib/testIds";
import { isTtsSupported, speakHebrew } from "@/lib/tts/engine";

interface LoginModalProps {
  onClose: () => void;
}

type ErrorKind = "invalid" | "network" | "error";

// Warm, blame-free copy (Phase 1 PM review). No red-alert tone: a pre-literate child should
// not read a login failure as "you did something wrong".
function invalidMessage(attemptsRemaining?: number): string {
  return attemptsRemaining === 1
    ? "אופס! נשאר עוד ניסיון אחד 🙂"
    : "אופס! בואו ננסה שוב 😊";
}

const ERROR_COPY: Record<ErrorKind, (n?: number) => string> = {
  invalid: invalidMessage,
  network: () => "אין חיבור לאינטרנט, נסו שוב",
  error: () => "שגיאה בהתחברות, נסו שוב",
};

export function LoginModal({ onClose }: LoginModalProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | undefined>(undefined);
  const [lockSecondsLeft, setLockSecondsLeft] = useState<number | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  const isLocked = lockSecondsLeft !== null && lockSecondsLeft > 0;

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Live countdown while locked; when it reaches zero, show a positive "try again" cue so a
  // young child sees the wait is over rather than the message silently disappearing.
  useEffect(() => {
    if (lockSecondsLeft === null) return;
    if (lockSecondsLeft <= 0) {
      setLockSecondsLeft(null);
      setJustUnlocked(true);
      return;
    }
    const t = setTimeout(() => setLockSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [lockSecondsLeft]);

  const clearErrors = useCallback(() => {
    setErrorKind(null);
    setAttemptsRemaining(undefined);
    setJustUnlocked(false);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!username.trim() || !password || isLocked) return;
      clearErrors();
      setIsLoading(true);
      const result = await login(username.trim(), password);
      setIsLoading(false);
      if (result.ok) {
        onClose();
        return;
      }
      if (result.kind === "locked") {
        setLockSecondsLeft(result.retryAfterSeconds);
        // Voice the calm message for children who can't yet read the countdown.
        if (isTtsSupported()) speakHebrew("רגע קטן, אפשר לנסות שוב עוד מעט");
        return;
      }
      if (result.kind === "invalid") {
        setAttemptsRemaining(result.attemptsRemaining);
        setErrorKind("invalid");
        return;
      }
      setErrorKind(result.kind);
    },
    [login, onClose, username, password, isLocked, clearErrors],
  );

  const canSubmit = username.trim().length > 0 && password.length > 0 && !isLoading && !isLocked;

  return (
    <div
      data-testid={testIds.component.auth.loginModalOverlay()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        data-testid={testIds.component.auth.loginModal()}
        className="surface w-full max-w-sm rounded-panel p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <h2 data-testid="km.autogen.loginmodal.node.idx.0"
          id="login-modal-title"
          className="mb-5 text-center text-xl font-bold text-[#2c2348]"
        >
          כניסה לחשבון
        </h2>

        <form data-testid="km.autogen.loginmodal.node.idx.1" onSubmit={handleSubmit} noValidate>
          <div data-testid="km.autogen.loginmodal.node.idx.2" className="mb-4">
            <label data-testid="km.autogen.loginmodal.node.idx.3"
              htmlFor="km-login-username"
              className="mb-1 block text-sm font-semibold text-[#4f4860]"
            >
              שם משתמש
            </label>
            <input
              ref={usernameRef}
              id="km-login-username"
              data-testid={testIds.component.auth.usernameInput()}
              type="text"
              autoComplete="username"
              dir="ltr"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearErrors();
              }}
              className="min-h-[44px] w-full rounded-xl border border-[#e3e0ec] px-4 py-2.5 text-sm focus:border-[var(--accent-soft)] focus:outline-hidden focus:ring-2 focus:ring-[#cdbff2]"
              disabled={isLoading}
            />
          </div>

          <div data-testid="km.autogen.loginmodal.node.idx.4" className="mb-5">
            <label data-testid="km.autogen.loginmodal.node.idx.5"
              htmlFor="km-login-password"
              className="mb-1 block text-sm font-semibold text-[#4f4860]"
            >
              סיסמה
            </label>
            <div data-testid="km.autogen.loginmodal.node.pwwrap" className="relative">
              <input
                id="km-login-password"
                data-testid={testIds.component.auth.passwordInput()}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                dir="ltr"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearErrors();
                }}
                className="min-h-[44px] w-full rounded-xl border border-[#e3e0ec] px-4 py-2.5 pl-12 text-sm focus:border-[var(--accent-soft)] focus:outline-hidden focus:ring-2 focus:ring-[#cdbff2]"
                disabled={isLoading}
              />
              {/* Show-password toggle — cuts mistyped passwords (and so, lockouts) for kids. */}
              <button
                data-testid={testIds.component.auth.showPasswordToggle()}
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "הסתרת הסיסמה" : "הצגת הסיסמה"}
                aria-pressed={showPassword}
                // ≥44px touch target (kids a11y rule): full input height + a 44px-min hit area.
                className="absolute inset-y-0 left-0 flex min-w-[44px] items-center justify-center rounded-l-xl text-lg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#cdbff2]"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {isLocked && (
            <p
              data-testid={testIds.component.auth.lockoutCountdown()}
              className="mb-4 rounded-xl bg-[#eef2ff] px-4 py-2.5 text-center text-sm font-medium text-[#3730a3]"
              role="status"
              aria-live="polite"
            >
              רגע קטן! אפשר לנסות שוב בעוד {lockSecondsLeft} שניות 😊
            </p>
          )}

          {justUnlocked && !isLocked && !errorKind && (
            <p
              data-testid="km.autogen.loginmodal.node.unlocked"
              className="mb-4 rounded-xl bg-[#ecfdf5] px-4 py-2.5 text-center text-sm font-medium text-[#047857]"
              role="status"
              aria-live="polite"
            >
              אפשר לנסות שוב! 😊
            </p>
          )}

          {!isLocked && errorKind && (
            <p
              data-testid={testIds.component.auth.errorMessage()}
              className="mb-4 rounded-xl bg-[#fff7ed] px-4 py-2.5 text-center text-sm font-medium text-[#9a3412]"
              role="alert"
            >
              {ERROR_COPY[errorKind](attemptsRemaining)}
            </p>
          )}

          <button
            data-testid={testIds.component.auth.submitButton()}
            type="submit"
            disabled={!canSubmit}
            className="touch-button btn-accent w-full disabled:opacity-50"
          >
            {isLoading ? "מתחבר..." : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
