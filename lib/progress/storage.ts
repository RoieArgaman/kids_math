import { createInitialWorkbookProgressState } from "@/lib/progress/engine";
import type { DayProgressState, WorkbookProgressState } from "@/lib/types";

const PROGRESS_STORAGE_KEY = "kids_math.workbook_progress.v1";

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
  return {
    ...value,
    wrongCount: typeof value.wrongCount === "number" ? value.wrongCount : 0,
  };
}

function sanitizeState(value: unknown): WorkbookProgressState {
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

export function loadProgressState(): WorkbookProgressState {
  if (!isBrowser()) {
    return createInitialWorkbookProgressState();
  }

  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) {
      return createInitialWorkbookProgressState();
    }
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeState(parsed);
  } catch {
    return createInitialWorkbookProgressState();
  }
}

export function saveProgressState(state: WorkbookProgressState): void {
  if (!isBrowser()) {
    return;
  }

  try {
    const nextState: WorkbookProgressState = {
      ...state,
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    // Intentionally no-op to keep UI responsive even if storage is unavailable.
  }
}

export function clearProgressState(): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    // Intentionally no-op.
  }
}
