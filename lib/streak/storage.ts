import type { StreakState } from "./types";
import { STREAK_MILESTONES } from "./types";

const STORAGE_KEY = "kids_math.streak.v1";

const KNOWN_BADGE_IDS = new Set(STREAK_MILESTONES.map(m => m.badgeId));

function sanitizeStreakState(raw: unknown): StreakState | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  if (r.version !== 1) return null;
  if (typeof r.lastActiveDate !== "string" || !r.lastActiveDate) return null;
  if (!Number.isFinite(r.currentStreak) || (r.currentStreak as number) < 0) return null;
  if (!Number.isFinite(r.longestStreak) || (r.longestStreak as number) < 0) return null;
  if (!Number.isInteger(r.currentStreak) || !Number.isInteger(r.longestStreak)) return null;

  const earnedBadges = Array.isArray(r.earnedBadges)
    ? (r.earnedBadges as unknown[]).filter((b): b is string => typeof b === "string" && KNOWN_BADGE_IDS.has(b as never))
    : [];

  return {
    version: 1,
    lastActiveDate: r.lastActiveDate,
    currentStreak: r.currentStreak as number,
    longestStreak: r.longestStreak as number,
    earnedBadges,
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : new Date().toISOString(),
  };
}

export function loadStreakState(): StreakState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return sanitizeStreakState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveStreakState(state: StreakState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Avoid crashes in private mode / quota errors.
  }
}

export function clearStreakState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
