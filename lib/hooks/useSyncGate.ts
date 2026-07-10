"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth/context";
import { flushSync, getAuthEpoch, isSyncActive, isSyncPrimed, setSyncPrimed } from "@/lib/auth/serverSync";
import {
  beaconUserProgress,
  buildBundleFromLocalStorage,
  fetchUserProgress,
  fetchUserProgressResult,
  hydrateLocalStorageFromBundle,
  pushUserProgress,
} from "@/lib/user-data/api";

/**
 * Bring this device fresh from the server.
 *
 * - **Primed** (local already reconciled for this identity): push local up first
 *   (server merges per-domain/per-day), then pull the merged truth and hydrate.
 *   The push is AWAITED before pulling so a just-submitted answer isn't dropped by
 *   the overwrite hydrate.
 * - **Not primed** (e.g. a login that hit a fetch error left local cleared): do a
 *   PULL-ONLY to prime. Never push while unprimed — an empty-`now` default domain
 *   would win whole-domain LWW and clobber the user's real server data.
 *
 * An auth-epoch guard drops the hydrate if a logout / user-switch raced in, so one
 * student's in-flight pull can never repaint the next student's screen.
 */
async function flushThenPull(): Promise<void> {
  // Bail if sync is no longer live (e.g. logout unregistered the callback while a
  // visibility/pageshow event was firing this pull) — otherwise the pull below
  // could re-hydrate the just-cleared device with the prior student's data.
  if (!isSyncActive()) return;
  const epoch = getAuthEpoch();
  if (isSyncPrimed()) {
    flushSync();
    await pushUserProgress(buildBundleFromLocalStorage());
    const merged = await fetchUserProgress();
    if (getAuthEpoch() !== epoch) return;
    if (merged) hydrateLocalStorageFromBundle(merged);
  } else {
    const result = await fetchUserProgressResult();
    if (getAuthEpoch() !== epoch) return;
    if (result.status === "ok") {
      hydrateLocalStorageFromBundle(result.bundle);
      setSyncPrimed(true);
    } else if (result.status === "empty") {
      setSyncPrimed(true);
    }
    // error: stay unprimed and retry on the next focus/navigation.
  }
}

/** Fire-and-forget push that survives page teardown / device switch. No-op when sync is inactive or unprimed. */
function beaconLocal(): void {
  if (!isSyncActive() || !isSyncPrimed()) return;
  beaconUserProgress(buildBundleFromLocalStorage());
}

/**
 * Drives cross-device freshness while logged in:
 * - pull on route navigation (flush-before-pull), tab focus, and BFCache restore
 * - beacon local state on tab hide / pagehide (so last answers survive a device switch)
 * - re-sync on reconnect (`online`)
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

    // On reconnect, re-sync: flushThenPull pushes local up (when primed) or
    // pull-only-primes (when not), so offline work reaches the server and a
    // still-unprimed session heals.
    const onOnline = () => {
      void flushThenPull();
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
