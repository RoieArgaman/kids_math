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
  registerSyncCallback,
  resumeSync,
  suspendSync,
  unregisterSyncCallback,
} from "./serverSync";
import {
  buildBundleFromLocalStorage,
  fetchUserProgress,
  hydrateLocalStorageFromBundle,
  pushUserProgress,
  restoreSnapshotFromSession,
  saveSnapshotToSession,
  snapshotLocalStorage,
} from "@/lib/user-data/api";
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
    const bundle = buildBundleFromLocalStorage();
    pushUserProgress(bundle).catch(() => {/* fire-and-forget */});
  };
}

/**
 * Push local state up (server merges per-domain/per-day), then pull the merged
 * truth back down and hydrate. Safe to push before pulling because the server
 * merges rather than overwrites.
 */
async function pushThenPull(): Promise<void> {
  const bundle = buildBundleFromLocalStorage();
  await pushUserProgress(bundle);
  const merged = await fetchUserProgress();
  if (merged) hydrateLocalStorageFromBundle(merged);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session if cookie exists
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await apiMe();
        if (!me || cancelled) return;
        // Session exists — push local (server merges), pull merged truth, hydrate,
        // then arm the push callback. Suspend sync throughout so hydrate doesn't
        // trigger a stale re-push mid-flight.
        suspendSync();
        await pushThenPull();
        registerSyncCallback(makeSyncFn());
        resumeSync();
        if (!cancelled) setUser(me);
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

      // Snapshot pre-login localStorage before overwriting
      const snapshot = snapshotLocalStorage();
      saveSnapshotToSession(snapshot);

      // Suspend sync while we reconcile local <-> server so a hydrate can't
      // trigger a stale re-push mid-flight.
      suspendSync();

      // Fetch server progress
      const serverBundle = await fetchUserProgress();

      if (serverBundle) {
        // Returning user — push local pre-snapshot work up (server merges it),
        // then pull the merged truth and hydrate.
        await pushThenPull();
      } else {
        // First login — push current localStorage to server
        const localBundle = buildBundleFromLocalStorage();
        await pushUserProgress(localBundle);
      }

      registerSyncCallback(makeSyncFn());
      resumeSync();
      setUser(result.user);

      return { ok: true as const };
    },
    [],
  );

  const logout = useCallback(async () => {
    unregisterSyncCallback();
    await apiLogout();

    // Restore snapshot BEFORE setUser(null) so any triggered re-renders
    // read pre-login localStorage, not logged-in state.
    restoreSnapshotFromSession();
    setUser(null);

    // Dispatch storage events so screens re-read from localStorage
    try {
      const grades = ["a", "b"] as const;
      for (const grade of grades) {
        const key = `kids_math.workbook_progress.v2.grade.${grade}`;
        window.dispatchEvent(
          new StorageEvent("storage", {
            key,
            newValue: window.localStorage.getItem(key),
            storageArea: window.localStorage,
          }),
        );
      }
    } catch {
      // ignore
    }
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
