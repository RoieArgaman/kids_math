"use client";

import { useEffect, useState } from "react";

import { clearAdminSession, isAdminUnlocked, unlockAdminSession } from "@/lib/admin/session";

/**
 * Admin unlock lifecycle shared by AdminHubScreen and AdminProgressScreen.
 *
 * Reads `isAdminUnlocked()` post-hydration to set the initial state, and registers
 * the `pagehide` → `clearAdminSession()` effect. The unlock deliberately survives
 * in-app (client-side) navigation between admin screens — `pagehide` still clears it
 * on tab close / reload / hard exit, and the session carries a TTL. We do NOT clear
 * on unmount; the unlock is cleared explicitly via `exit()` (e.g. "חזרה למסך הראשי").
 */
export function useAdminSession(): {
  isUnlocked: boolean;
  unlock: (pin: string) => boolean;
  exit: () => void;
} {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    setIsUnlocked(isAdminUnlocked());
  }, []);

  useEffect(() => {
    const onPageHide = () => {
      clearAdminSession();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  function unlock(pin: string): boolean {
    const ok = unlockAdminSession(pin);
    if (ok) {
      setIsUnlocked(true);
    }
    return ok;
  }

  function exit(): void {
    clearAdminSession();
    setIsUnlocked(false);
  }

  return { isUnlocked, unlock, exit };
}
