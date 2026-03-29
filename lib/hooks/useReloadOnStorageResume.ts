import { useEffect } from "react";

import type { GradeId } from "@/lib/grades";
import { workbookProgressStorageKey } from "@/lib/progress/storage";

const VISIBILITY_DEBOUNCE_MS = 100;

/**
 * Re-runs `onResume` when persisted progress may have changed but React state is stale:
 * - BFCache restore (`pageshow` + `persisted`)
 * - Another tab wrote the grade workbook key (`storage`)
 * - Tab becomes visible again (debounced), e.g. after backgrounding
 */
export function useReloadOnStorageResume(grade: GradeId, onResume: () => void): void {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storageKey = workbookProgressStorageKey(grade);
    let visibilityTimer: ReturnType<typeof setTimeout> | null = null;

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        onResume();
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue != null) {
        onResume();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      if (visibilityTimer != null) {
        clearTimeout(visibilityTimer);
      }
      visibilityTimer = setTimeout(() => {
        visibilityTimer = null;
        onResume();
      }, VISIBILITY_DEBOUNCE_MS);
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (visibilityTimer != null) {
        clearTimeout(visibilityTimer);
      }
    };
  }, [grade, onResume]);
}
