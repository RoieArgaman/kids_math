"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ADMIN_PREFS_CHANGED_EVENT,
  ADMIN_PREFS_STORAGE_KEY,
  loadAdminPrefs,
  saveAdminPrefs,
} from "@/lib/admin/prefs";

type AdminTtsContextValue = {
  ttsEnabled: boolean;
  setTtsEnabled: (value: boolean) => void;
  hydrated: boolean;
};

const AdminTtsContext = createContext<AdminTtsContextValue | null>(null);

export function AdminTtsProvider({ children }: { children: ReactNode }) {
  const [ttsEnabled, setTtsEnabledState] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const syncFromStorage = useCallback(() => {
    setTtsEnabledState(loadAdminPrefs().ttsEnabled);
  }, []);

  useEffect(() => {
    syncFromStorage();
    setHydrated(true);

    const onCustom = () => {
      syncFromStorage();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_PREFS_STORAGE_KEY) {
        syncFromStorage();
      }
    };

    window.addEventListener(ADMIN_PREFS_CHANGED_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ADMIN_PREFS_CHANGED_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [syncFromStorage]);

  const setTtsEnabled = useCallback((value: boolean) => {
    saveAdminPrefs({ ttsEnabled: value });
    setTtsEnabledState(value);
  }, []);

  const value = useMemo(
    () => ({ ttsEnabled, setTtsEnabled, hydrated }),
    [ttsEnabled, setTtsEnabled, hydrated],
  );

  return <AdminTtsContext.Provider value={value}>{children}</AdminTtsContext.Provider>;
}

export function useAdminTtsEnabled(): AdminTtsContextValue {
  const ctx = useContext(AdminTtsContext);
  if (!ctx) {
    throw new Error("useAdminTtsEnabled must be used within AdminTtsProvider");
  }
  return ctx;
}
