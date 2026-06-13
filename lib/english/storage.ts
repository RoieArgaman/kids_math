import { createInitialWorkbookProgressState } from "@/lib/progress/engine";
import { sanitizeState } from "@/lib/progress/storage";
import type { WorkbookProgressState } from "@/lib/types";
import { scheduleSync } from "@/lib/auth/serverSync";

/**
 * English-layer progress storage.
 *
 * Deliberately isolated from the math workbook store (`lib/progress/storage.ts`):
 * English has no grade axis (single Pre-A1 track), so it uses a subject-namespaced
 * key. The persisted *shape* reuses `WorkbookProgressState` (days/sections), so the
 * shared progress engine + screens work unchanged. Math storage is never touched.
 *
 * Backward-compat: additive-only. Increment the schema version below for any
 * breaking shape change and add a migration (mirrors the math store rules).
 */
export const ENGLISH_STORAGE_SCHEMA_VERSION = 1;

const ENGLISH_PROGRESS_STORAGE_KEY = "kids_math.english.workbook_progress.v1";

/** Exposed for cross-tab `storage` listeners (must match load/save). */
export function englishProgressStorageKey(): string {
  return ENGLISH_PROGRESS_STORAGE_KEY;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadEnglishProgressState(): WorkbookProgressState {
  if (!isBrowser()) {
    return createInitialWorkbookProgressState();
  }
  try {
    const raw = window.localStorage.getItem(ENGLISH_PROGRESS_STORAGE_KEY);
    if (!raw) {
      return createInitialWorkbookProgressState();
    }
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeState(parsed);
  } catch {
    return createInitialWorkbookProgressState();
  }
}

export function saveEnglishProgressState(state: WorkbookProgressState): void {
  if (!isBrowser()) {
    return;
  }
  try {
    const nextState: WorkbookProgressState = {
      ...state,
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(ENGLISH_PROGRESS_STORAGE_KEY, JSON.stringify(nextState));
    scheduleSync();
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      try {
        window.dispatchEvent(
          new CustomEvent("kids_math:storage_quota_exceeded", { detail: { subject: "english" } }),
        );
      } catch {
        // dispatchEvent failed — ignore
      }
    }
    // Keep UI responsive regardless.
  }
}

export function clearEnglishProgressState(): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.removeItem(ENGLISH_PROGRESS_STORAGE_KEY);
  } catch {
    // Intentionally no-op.
  }
}
