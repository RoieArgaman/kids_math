import type { GradeId } from "@/lib/grades";
import type { BadgeId, BadgeState } from "./types";

function badgeStorageKey(grade: GradeId): string {
  return `kids_math.badges.v1.grade.${grade}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function createInitialBadgeState(grade: GradeId): BadgeState {
  return {
    version: 1,
    grade,
    unlocked: [],
    seenIds: [],
    updatedAt: new Date().toISOString(),
  };
}

export function sanitizeBadgeState(value: unknown, grade: GradeId): BadgeState {
  const fallback = createInitialBadgeState(grade);

  if (!isObject(value)) return fallback;
  if (value.version !== 1) return fallback;
  if (value.grade !== grade) return fallback;

  const unlocked = Array.isArray(value.unlocked)
    ? value.unlocked.filter(
        (item): item is { id: BadgeId; unlockedAt: string } =>
          isObject(item) && typeof item.id === "string" && typeof item.unlockedAt === "string",
      )
    : null;
  if (!unlocked) return fallback;

  const seenIds = Array.isArray(value.seenIds)
    ? value.seenIds.filter((id): id is BadgeId => typeof id === "string")
    : null;
  if (!seenIds) return fallback;

  return {
    version: 1,
    grade,
    unlocked,
    seenIds,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
  };
}

export function loadBadgeState(grade: GradeId): BadgeState {
  if (!isBrowser()) {
    return createInitialBadgeState(grade);
  }
  try {
    const raw = window.localStorage.getItem(badgeStorageKey(grade));
    if (!raw) return createInitialBadgeState(grade);
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeBadgeState(parsed, grade);
  } catch {
    return createInitialBadgeState(grade);
  }
}

export function saveBadgeState(state: BadgeState): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(badgeStorageKey(state.grade), JSON.stringify(state));
  } catch {
    // Intentionally no-op.
  }
}

export function clearBadgeState(grade: GradeId): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(badgeStorageKey(grade));
  } catch {
    // Intentionally no-op.
  }
}
