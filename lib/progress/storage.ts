import { createInitialWorkbookProgressState } from "@/lib/progress/engine";
import type { GradeId } from "@/lib/grades";
import { DEFAULT_GRADE } from "@/lib/grades";
import type { DayProgressState, WorkbookProgressState } from "@/lib/types";

/** Current v2 storage schema version. Increment when the persisted shape changes. */
export const STORAGE_SCHEMA_VERSION = 2;

const LEGACY_PROGRESS_STORAGE_KEY = "kids_math.workbook_progress.v1";
const GRADE_A_PROGRESS_STORAGE_KEY_V1 = "kids_math.workbook_progress.v1.grade.a";
const GRADE_B_PROGRESS_STORAGE_KEY_V1 = "kids_math.workbook_progress.v1.grade.b";

/** Exposed for cross-tab `storage` listeners (must match `loadProgressState` / `saveProgressState`). */
export function workbookProgressStorageKey(grade: GradeId): string {
  return `kids_math.workbook_progress.v2.grade.${grade}`;
}

function progressStorageKeyForGrade(grade: GradeId): string {
  return workbookProgressStorageKey(grade);
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDayProgressState(value: unknown): value is DayProgressState {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.dayId === "string" &&
    isObject(value.answers) &&
    isObject(value.correctAnswers) &&
    Array.isArray(value.attempts) &&
    typeof value.percentDone === "number" &&
    typeof value.isComplete === "boolean"
  );
}

function withDefaultsForDayState(value: DayProgressState): DayProgressState {
  const wrongBySection =
    isObject(value.wrongBySection) && value.wrongBySection !== null
      ? (value.wrongBySection as Record<string, number>)
      : {};
  return {
    ...value,
    wrongCount: typeof value.wrongCount === "number" ? value.wrongCount : 0,
    wrongBySection,
  };
}

export function sanitizeState(value: unknown): WorkbookProgressState {
  const fallback = createInitialWorkbookProgressState();

  if (!isObject(value) || value.version !== 1 || !isObject(value.days)) {
    return fallback;
  }

  const sanitizedDays = Object.entries(value.days).reduce<
    Record<string, DayProgressState>
  >((acc, [dayId, dayState]) => {
    if (isDayProgressState(dayState) && dayState.dayId === dayId) {
      acc[dayId] = withDefaultsForDayState(dayState);
    }
    return acc;
  }, {});

  return {
    version: 1,
    days: sanitizedDays,
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : new Date().toISOString(),
  };
}

type ProgressStorageOptions = { grade?: GradeId };

function isValidLegacyWorkbookProgress(value: unknown): boolean {
  return isObject(value) && value.version === 1 && isObject(value.days);
}

function migrateLegacyProgressToGradeA(nextKey: string): WorkbookProgressState | null {
  try {
    const rawLegacy = window.localStorage.getItem(LEGACY_PROGRESS_STORAGE_KEY);
    if (!rawLegacy) {
      return null;
    }
    const parsedLegacy = JSON.parse(rawLegacy) as unknown;
    if (!isValidLegacyWorkbookProgress(parsedLegacy)) {
      return null;
    }
    const sanitizedLegacy = sanitizeState(parsedLegacy);
    if (Object.keys(sanitizedLegacy.days).length === 0) {
      return null;
    }

    // If new key appeared in the meantime, do not overwrite it.
    const rawNew = window.localStorage.getItem(nextKey);
    if (rawNew) {
      const parsedNew = JSON.parse(rawNew) as unknown;
      return sanitizeState(parsedNew);
    }

    try {
      window.localStorage.setItem(nextKey, JSON.stringify(sanitizedLegacy));
    } catch {
      // If we can't write, keep legacy intact and still return the loaded state.
    }
    return sanitizedLegacy;
  } catch {
    return null;
  }
}

function migrateGradeBProgressV1ToV2(nextKey: string): WorkbookProgressState | null {
  try {
    const rawV1 = window.localStorage.getItem(GRADE_B_PROGRESS_STORAGE_KEY_V1);
    if (!rawV1) {
      return null;
    }
    const parsed = JSON.parse(rawV1) as unknown;
    const sanitized = sanitizeState(parsed);
    if (Object.keys(sanitized.days).length === 0) {
      return null;
    }
    if (window.localStorage.getItem(nextKey)) {
      const parsedNew = JSON.parse(window.localStorage.getItem(nextKey) as string) as unknown;
      return sanitizeState(parsedNew);
    }
    try {
      window.localStorage.setItem(nextKey, JSON.stringify(sanitized));
      window.localStorage.removeItem(GRADE_B_PROGRESS_STORAGE_KEY_V1);
    } catch {
      // quota / private mode — still return migrated state for this session
    }
    return sanitized;
  } catch {
    return null;
  }
}

export function loadProgressState(options: ProgressStorageOptions = {}): WorkbookProgressState {
  if (!isBrowser()) {
    return createInitialWorkbookProgressState();
  }

  const grade = options.grade ?? DEFAULT_GRADE;
  const key = progressStorageKeyForGrade(grade);

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      if (grade === "a") {
        try {
          const staleV1 = window.localStorage.getItem(GRADE_A_PROGRESS_STORAGE_KEY_V1);
          if (staleV1) {
            window.localStorage.removeItem(GRADE_A_PROGRESS_STORAGE_KEY_V1);
            return createInitialWorkbookProgressState();
          }
        } catch {
          /* no-op */
        }
        const migrated = migrateLegacyProgressToGradeA(key);
        if (migrated) {
          return migrated;
        }
      }
      if (grade === "b") {
        const migratedB = migrateGradeBProgressV1ToV2(key);
        if (migratedB) {
          return migratedB;
        }
      }
      return createInitialWorkbookProgressState();
    }
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeState(parsed);
  } catch {
    return createInitialWorkbookProgressState();
  }
}

export function saveProgressState(state: WorkbookProgressState, options: ProgressStorageOptions = {}): void {
  if (!isBrowser()) {
    return;
  }

  const grade = options.grade ?? DEFAULT_GRADE;
  const key = progressStorageKeyForGrade(grade);

  try {
    const nextState: WorkbookProgressState = {
      ...state,
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(key, JSON.stringify(nextState));
  } catch (err) {
    // QuotaExceededError — storage is full. Dispatch a DOM event so the
    // StorageErrorBoundary (or any listener) can surface this to the user.
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      try {
        window.dispatchEvent(new CustomEvent("kids_math:storage_quota_exceeded", { detail: { grade } }));
      } catch {
        // dispatchEvent failed — ignore
      }
    }
    // Keep UI responsive regardless.
  }
}

export function clearProgressState(options: ProgressStorageOptions = {}): void {
  if (!isBrowser()) {
    return;
  }
  const grade = options.grade ?? DEFAULT_GRADE;
  const key = progressStorageKeyForGrade(grade);
  try {
    window.localStorage.removeItem(key);
    if (grade === "a") {
      window.localStorage.removeItem(GRADE_A_PROGRESS_STORAGE_KEY_V1);
    }
    if (grade === "b") {
      window.localStorage.removeItem(GRADE_B_PROGRESS_STORAGE_KEY_V1);
    }
  } catch {
    // Intentionally no-op.
  }
}
