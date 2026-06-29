import { createInitialWorkbookProgressState } from "@/lib/progress/engine";
import { sanitizeState } from "@/lib/progress/storage";
import type { WorkbookProgressState } from "@/lib/types";
import { scheduleSync } from "@/lib/auth/serverSync";
import { isBrowser } from "@/lib/utils/guards";

/**
 * Science-layer progress storage.
 *
 * Deliberately isolated from the math workbook store (`lib/progress/storage.ts`)
 * and the English store (`lib/english/storage.ts`). Science is taught as two
 * Israeli grade levels (כיתה א׳/ב׳) but, like English, persists into a single
 * subject-namespaced store keyed across both levels (day IDs are disjoint across
 * levels). The persisted *shape* reuses `WorkbookProgressState` (days/sections),
 * so the shared progress engine + screens work unchanged. Math/English storage
 * is never touched.
 *
 * Backward-compat: additive-only. Increment the schema version below for any
 * breaking shape change and add a migration (mirrors the math store rules).
 */
export const SCIENCE_STORAGE_SCHEMA_VERSION = 1;

const SCIENCE_PROGRESS_STORAGE_KEY = "kids_math.science.workbook_progress.v1";

/** Exposed for cross-tab `storage` listeners (must match load/save). */
export function scienceProgressStorageKey(): string {
  return SCIENCE_PROGRESS_STORAGE_KEY;
}

export function loadScienceProgressState(): WorkbookProgressState {
  if (!isBrowser()) {
    return createInitialWorkbookProgressState();
  }
  try {
    const raw = window.localStorage.getItem(SCIENCE_PROGRESS_STORAGE_KEY);
    if (!raw) {
      return createInitialWorkbookProgressState();
    }
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeState(parsed);
  } catch {
    return createInitialWorkbookProgressState();
  }
}

export function saveScienceProgressState(state: WorkbookProgressState): void {
  if (!isBrowser()) {
    return;
  }
  try {
    const nextState: WorkbookProgressState = {
      ...state,
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(SCIENCE_PROGRESS_STORAGE_KEY, JSON.stringify(nextState));
    scheduleSync();
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      try {
        window.dispatchEvent(
          new CustomEvent("kids_math:storage_quota_exceeded", { detail: { subject: "science" } }),
        );
      } catch {
        // dispatchEvent failed — ignore
      }
    }
    // Keep UI responsive regardless.
  }
}

export function clearScienceProgressState(): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.removeItem(SCIENCE_PROGRESS_STORAGE_KEY);
  } catch {
    // Intentionally no-op.
  }
}
