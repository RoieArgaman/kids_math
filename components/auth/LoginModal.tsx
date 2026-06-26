"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { testIds } from "@/lib/testIds";

interface LoginModalProps {
  onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!username.trim() || !password) return;
      setError("");
      setIsLoading(true);
      const result = await login(username.trim(), password);
      setIsLoading(false);
      if (result.ok) {
        onClose();
      } else {
        setError(result.error);
      }
    },
    [login, onClose, username, password],
  );

  const canSubmit = username.trim().length > 0 && password.length > 0 && !isLoading;

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
        className="surface w-full max-w-sm rounded-3xl p-6 shadow-xl"
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
                setError("");
              }}
              className="w-full rounded-xl border border-[#e3e0ec] px-4 py-2.5 text-sm focus:border-[#a78bfa] focus:outline-none focus:ring-2 focus:ring-[#cdbff2]"
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
            <input
              id="km-login-password"
              data-testid={testIds.component.auth.passwordInput()}
              type="password"
              autoComplete="current-password"
              dir="ltr"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full rounded-xl border border-[#e3e0ec] px-4 py-2.5 text-sm focus:border-[#a78bfa] focus:outline-none focus:ring-2 focus:ring-[#cdbff2]"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p
              data-testid={testIds.component.auth.errorMessage()}
              className="mb-4 rounded-xl bg-[#fee2e2] px-4 py-2.5 text-center text-sm font-medium text-[#b91c1c]"
              role="alert"
            >
              {error}
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
