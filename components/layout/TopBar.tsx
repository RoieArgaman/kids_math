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
        className="h-10 w-full bg-slate-50/80 border-b border-slate-100"
      />
    );
  }

  return (
    <>
      <div
        data-testid={testIds.component.auth.topBar()}
        className="flex h-10 w-full items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4"
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
              className="rounded-xl px-3 py-1.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-300"
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
