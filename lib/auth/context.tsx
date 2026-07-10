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
import { apiLogin, apiLogout, apiMe } from "./api";
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
import { SyncGate } from "@/lib/hooks/useSyncGate";

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

  // On mount: restore session if cookie exists, then reconcile against the server.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await apiMe();
        if (!me || cancelled) return;
        const proceed = await reconcileForUser(me.userId);
        // setUser is the LAST step: useSyncGate is gated on `isLoggedIn`, so it
        // stays disarmed until reconciliation is complete (no mid-flight push race).
        if (!cancelled && proceed) setUser(me);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await apiLogin(username, password);
      if (!result.ok) return result;

      // Identity boundary — invalidate any in-flight reconcile from a prior session.
      bumpAuthEpoch();
      const proceed = await reconcileForUser(result.user.userId);
      if (proceed) setUser(result.user);

      return { ok: true as const };
    },
    [],
  );

  const logout = useCallback(async () => {
    // Identity boundary first: bump the epoch so any in-flight reconcile/sync
    // aborts its hydrate, and disarm pushes immediately. unregisterSyncCallback
    // flips isSyncActive() false so a stray focus/pageshow pull can't re-hydrate.
    bumpAuthEpoch();
    setSyncPrimed(false);
    unregisterSyncCallback();

    // Wipe this device to zero SYNCHRONOUSLY (before any await) so the next
    // (anonymous or different) student sees nothing of the prior student and no
    // async pull can interleave a hydrate before the clear. clearLocalProgress
    // dispatches storage events so mirrored screens refresh to empty.
    clearLocalProgress();
    clearReconcileGuards();
    clearLocalOwner();
    setUser(null);

    // Server clears the session + all Grade-B unlock cookies (network last).
    await apiLogout();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: user !== null, isLoading, login, logout }}
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
