"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth/context";
import { flushSync } from "@/lib/auth/serverSync";
import {
  beaconUserProgress,
  buildBundleFromLocalStorage,
  fetchUserProgress,
  hydrateLocalStorageFromBundle,
  pushUserProgress,
} from "@/lib/user-data/api";

/**
 * Push local state up, then pull the merged server truth and hydrate. The push is
 * AWAITED before pulling: otherwise the pull can land before a just-submitted answer
 * reaches the server, and the full-overwrite hydrate would transiently drop it. The
 * server merges per-domain/per-day, so pushing before pulling never clobbers remote work.
 */
async function flushThenPull(): Promise<void> {
  flushSync();
  await pushUserProgress(buildBundleFromLocalStorage());
  const merged = await fetchUserProgress();
  if (merged) hydrateLocalStorageFromBundle(merged);
}

/** Fire-and-forget push that survives page teardown / device switch. */
function beaconLocal(): void {
  beaconUserProgress(buildBundleFromLocalStorage());
}

/**
 * Drives cross-device freshness while logged in:
 * - pull on route navigation (flush-before-pull), tab focus, and BFCache restore
 * - beacon local state on tab hide / pagehide (so last answers survive a device switch)
 * - re-push on reconnect (`online`)
 *
 * No-op entirely when logged out. The AuthProvider mount effect already performs
 * the initial pull, so the first pathname value is skipped to avoid a double-pull.
 */
export function useSyncGate(): void {
  const { isLoggedIn } = useAuth();
  const pathname = usePathname();
  const didInitialPathnameRef = useRef(false);

  // Pull on route navigation (skip the initial pathname — mount effect covered it).
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!didInitialPathnameRef.current) {
      didInitialPathnameRef.current = true;
      return;
    }
    void flushThenPull();
  }, [isLoggedIn, pathname]);

  // Focus / visibility / connectivity listeners.
  useEffect(() => {
    if (!isLoggedIn) return;
    if (typeof window === "undefined") return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void flushThenPull();
      } else {
        beaconLocal();
      }
    };

    const onPageShow = () => {
      void flushThenPull();
    };

    const onPageHide = () => {
      beaconLocal();
    };

    // On reconnect, re-push local unconditionally: the debounce may have already
    // fired-and-failed while offline (clearing the timer), so flushSync alone is a
    // no-op. A direct push ensures offline work reaches the server on reconnect.
    const onOnline = () => {
      void pushUserProgress(buildBundleFromLocalStorage());
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("online", onOnline);
    };
  }, [isLoggedIn]);
}

/** Headless component that runs `useSyncGate` — must be rendered inside `AuthProvider`. */
export function SyncGate(): null {
  useSyncGate();
  return null;
}
