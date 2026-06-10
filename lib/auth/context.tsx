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
import { registerSyncCallback, unregisterSyncCallback } from "./serverSync";
import {
  buildBundleFromLocalStorage,
  fetchUserProgress,
  hydrateLocalStorageFromBundle,
  pushUserProgress,
  restoreSnapshotFromSession,
  saveSnapshotToSession,
  snapshotLocalStorage,
} from "@/lib/user-data/api";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session if cookie exists
  useEffect(() => {
    apiMe().then((me) => {
      if (me) {
        // Session exists — fetch server progress and hydrate localStorage
        fetchUserProgress().then((bundle) => {
          if (bundle) hydrateLocalStorageFromBundle(bundle);
        });
        registerSyncCallback(makeSyncFn());
        setUser(me);
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await apiLogin(username, password);
      if (!result.ok) return result;

      // Snapshot pre-login localStorage before overwriting
      const snapshot = snapshotLocalStorage();
      saveSnapshotToSession(snapshot);

      // Fetch server progress
      const serverBundle = await fetchUserProgress();

      if (serverBundle) {
        // Returning user — hydrate localStorage from server
        hydrateLocalStorageFromBundle(serverBundle);
      } else {
        // First login — push current localStorage to server
        const localBundle = buildBundleFromLocalStorage();
        await pushUserProgress(localBundle);
      }

      registerSyncCallback(makeSyncFn());
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
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
