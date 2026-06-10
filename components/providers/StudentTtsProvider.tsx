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
  STUDENT_TTS_PREFS_CHANGED_EVENT,
  STUDENT_TTS_PREFS_KEY,
  loadStudentTtsPrefs,
  saveStudentTtsPrefs,
} from "@/lib/tts/prefs";

type StudentTtsContextValue = {
  autoPlay: boolean;
  setAutoPlay: (value: boolean) => void;
  hydrated: boolean;
};

const StudentTtsContext = createContext<StudentTtsContextValue | null>(null);

export function StudentTtsProvider({ children }: { children: ReactNode }) {
  const [autoPlay, setAutoPlayState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const syncFromStorage = useCallback(() => {
    setAutoPlayState(loadStudentTtsPrefs().autoPlay);
  }, []);

  useEffect(() => {
    syncFromStorage();
    setHydrated(true);

    const onCustom = () => {
      syncFromStorage();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STUDENT_TTS_PREFS_KEY) {
        syncFromStorage();
      }
    };

    window.addEventListener(STUDENT_TTS_PREFS_CHANGED_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(STUDENT_TTS_PREFS_CHANGED_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [syncFromStorage]);

  const setAutoPlay = useCallback((value: boolean) => {
    saveStudentTtsPrefs({ autoPlay: value });
    setAutoPlayState(value);
  }, []);

  const value = useMemo(
    () => ({ autoPlay, setAutoPlay, hydrated }),
    [autoPlay, setAutoPlay, hydrated],
  );

  return <StudentTtsContext.Provider value={value}>{children}</StudentTtsContext.Provider>;
}

export function useStudentTts(): StudentTtsContextValue {
  const ctx = useContext(StudentTtsContext);
  if (!ctx) throw new Error("useStudentTts must be used within StudentTtsProvider");
  return ctx;
}
