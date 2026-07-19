"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { LoginModal } from "@/components/auth/LoginModal";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { StudentTtsToggle } from "@/components/ui/StudentTtsToggle";
import { testIds } from "@/lib/testIds";

export function TopBar() {
  const { isLoggedIn, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Don't render anything while checking session — avoids layout flash
  if (isLoading) {
    return (
      <div
        data-testid={testIds.component.auth.topBar()}
        className="h-12 w-full bg-[#fffefb] border-b border-[#efe9f7]"
      />
    );
  }

  return (
    <>
      <div
        data-testid={testIds.component.auth.topBar()}
        className="flex h-12 w-full items-center justify-between border-b border-[#efe9f7] bg-[#fffefb] px-4"
      >
        <StudentTtsToggle />
        {/* ms-auto pins the auth section to the inline-end (visual left in RTL) even when
            StudentTtsToggle renders null — without it, justify-between collapses the lone
            child to the start (visual right in RTL). */}
        <div data-testid={testIds.component.topBar.authSection()} className="ms-auto flex items-center">
          {isLoggedIn ? (
            <UserAvatar />
          ) : (
            <button
              data-testid={testIds.component.auth.loginButton()}
              onClick={() => setShowLogin(true)}
              className="inline-flex min-h-[44px] items-center rounded-xl px-3 py-1.5 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[#f3effb] focus:outline-hidden focus:ring-2 focus:ring-[#cdbff2]"
            >
              כניסה
            </button>
          )}
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
