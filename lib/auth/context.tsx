"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "./types";
import { apiLogin, apiLogout, apiLogoutAll, apiMeResult, type LoginResult } from "./api";
import {
  bumpAuthEpoch,
  getAuthEpoch,
  isSyncPrimed,
  registerSyncCallback,
  resumeSync,
  setSyncPrimed,
  suspendSync,
  unregisterSyncCallback,
} from "./serverSync";
import {
  buildBundleFromLocalStorage,
  clearLocalOwner,
  clearLocalProgress,
  fetchUserProgress,
  fetchUserProgressResult,
  getLocalOwner,
  hydrateLocalStorageFromBundle,
  pushUserProgress,
  replaceLocalStorageFromBundle,
  setLocalOwner,
} from "@/lib/user-data/api";
import { clearReconcileGuards } from "@/lib/completion/reconcile";
import { clearEvents as clearAnalyticsEvents } from "@/lib/analytics/events";
import { SyncGate } from "@/lib/hooks/useSyncGate";

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  /** "Log out everywhere" — revokes every session for this user, then signs out locally. */
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * A single 401 from `/api/auth/me` at boot is NOT trusted as a revocation on a device that was
 * signed in. On some devices (notably Android tablets), pressing Back evicts the bfcache and does
 * a full document reload during which the session cookie can be momentarily omitted — a transient
 * 401 that has nothing to do with the session being revoked. Tearing down here wipes real learner
 * data, so we re-check once after this delay and only tear the session down if the retry is ALSO
 * unauthorized. Kept short so a genuine revocation still logs out within ~1s; the server-side
 * version check (`verifySession`) remains the real security boundary regardless.
 */
const REVOCATION_CONFIRM_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeSyncFn() {
  return () => {
    // Never push before local is reconciled with the server for this identity:
    // an empty-`now` default domain would win whole-domain LWW and clobber the
    // user's real server data.
    if (!isSyncPrimed()) return;
    const bundle = buildBundleFromLocalStorage();
    pushUserProgress(bundle).catch(() => {/* fire-and-forget */});
  };
}

/**
 * Reconcile local storage with the server for `userId`. The server is
 * authoritative at this boundary. Returns `false` if a logout/user-switch raced
 * in (epoch changed) and the caller must NOT set this user.
 *
 * - Same-user device (owner marker matches): merge local (possibly offline) work
 *   up, then pull the merged truth. Never clears — preserves unsynced work.
 * - Foreign / anonymous device: clear local first (that data is a different
 *   student's or nobody's), then hydrate the incoming user's server truth. Never
 *   pushes local up. On a fetch error, clear for confidentiality but stay
 *   UNPRIMED so no empty push clobbers real data; the sync gate heals later.
 */
async function reconcileForUser(userId: string): Promise<boolean> {
  const epoch = getAuthEpoch();
  const sameUser = getLocalOwner() === userId;

  suspendSync();
  setSyncPrimed(false);

  if (sameUser) {
    await pushUserProgress(buildBundleFromLocalStorage());
    const merged = await fetchUserProgress();
    if (getAuthEpoch() !== epoch) return false;
    if (merged) hydrateLocalStorageFromBundle(merged);
    setSyncPrimed(true);
  } else {
    // Different user taking over this device: wipe the prior child's per-device
    // behavioral analytics so their events never bleed into the incoming session
    // (finding F4). Progress keys are cleared below by replace/clear; analytics is
    // a device-scoped key that clearLocalProgress deliberately preserves, so it
    // must be cleared explicitly here at the user-switch boundary.
    clearAnalyticsEvents();
    const result = await fetchUserProgressResult();
    if (getAuthEpoch() !== epoch) return false;
    if (result.status === "ok") {
      replaceLocalStorageFromBundle(result.bundle);
      setSyncPrimed(true);
    } else if (result.status === "empty") {
      clearLocalProgress();
      setSyncPrimed(true);
    } else {
      // error — cannot confirm the account; clear for isolation, stay unprimed.
      clearLocalProgress();
      setSyncPrimed(false);
    }
  }

  setLocalOwner(userId);
  registerSyncCallback(makeSyncFn());
  resumeSync();
  return true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Shared local teardown for both logout and logout-everywhere: identity boundary first
  // (bump epoch so any in-flight reconcile/sync aborts its hydrate), disarm pushes, then wipe
  // this device to zero SYNCHRONOUSLY so no async pull interleaves a hydrate before the clear.
  const teardownLocalSession = useCallback(() => {
    bumpAuthEpoch();
    setSyncPrimed(false);
    unregisterSyncCallback();
    clearLocalProgress();
    // Clear per-device behavioral analytics on logout so the next child on a shared
    // device starts clean (finding F4) — analytics is a device-scoped key outside
    // clearLocalProgress's progress allow-list.
    clearAnalyticsEvents();
    clearReconcileGuards();
    clearLocalOwner();
    setUser(null);
  }, []);

  // On mount: restore session if cookie exists, then reconcile against the server.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let me = await apiMeResult();
        if (cancelled) return;

        // Confirm an ambiguous boot 401 before destroying anything. Only a device that WAS
        // signed in (owner marker present) takes this path; an anonymous visitor's 401 is the
        // normal logged-out state and must not delay boot. A transient blip clears on the retry
        // and the session is preserved; a genuine revocation stays 401 and tears down below.
        if (me.status === "unauthorized" && getLocalOwner()) {
          await delay(REVOCATION_CONFIRM_DELAY_MS);
          if (cancelled) return;
          me = await apiMeResult();
          if (cancelled) return;
        }

        if (me.status !== "ok") {
          // Only a confirmed 401 on a device that WAS signed in means revocation. An anonymous
          // visitor has no owner marker, and a network error is indistinguishable from one at
          // the status level — clearing on either would destroy real learner data.
          if (me.status === "unauthorized" && getLocalOwner()) teardownLocalSession();
          return;
        }
        const proceed = await reconcileForUser(me.user.userId);
        // setUser is the LAST step: useSyncGate is gated on `isLoggedIn`, so it
        // stays disarmed until reconciliation is complete (no mid-flight push race).
        if (!cancelled && proceed) setUser(me.user);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teardownLocalSession]);

  const login = useCallback(
    async (username: string, password: string): Promise<LoginResult> => {
      const result = await apiLogin(username, password);
      if (!result.ok) return result;

      // Identity boundary — invalidate any in-flight reconcile from a prior session.
      bumpAuthEpoch();
      const proceed = await reconcileForUser(result.user.userId);
      if (proceed) setUser(result.user);

      return result;
    },
    [],
  );

  const logout = useCallback(async () => {
    teardownLocalSession();
    // Server clears the session + all Grade-B unlock cookies (network last).
    await apiLogout();
  }, [teardownLocalSession]);

  const logoutAll = useCallback(async () => {
    teardownLocalSession();
    // Server bumps tokenVersion (revoking every other device) + clears cookies here.
    await apiLogoutAll();
  }, [teardownLocalSession]);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: user !== null, isLoading, login, logout, logoutAll }}
    >
      <SyncGate />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
