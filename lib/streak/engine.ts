import type { StreakState, StreakBadgeId } from "./types";
import { STREAK_MILESTONES } from "./types";

export function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function computeNextStreakState(
  current: StreakState | null,
  today: string,
): { nextState: StreakState; newlyEarnedBadges: StreakBadgeId[] } {
  const now = new Date().toISOString();

  // First-ever visit
  if (current === null) {
    const nextState: StreakState = {
      version: 1,
      lastActiveDate: today,
      currentStreak: 1,
      longestStreak: 1,
      earnedBadges: [],   // streak=1 never hits a milestone (min is 3)
      updatedAt: now,
    };
    return { nextState, newlyEarnedBadges: [] };
  }

  // Same day — return exact same object reference (important for !== check in HomeScreen)
  const diffDays = Math.round(
    (new Date(today + "T00:00:00").getTime() - new Date(current.lastActiveDate + "T00:00:00").getTime()) /
      86_400_000,
  );
  if (diffDays === 0) {
    return { nextState: current, newlyEarnedBadges: [] };
  }

  // Advance or reset streak
  const nextStreak = diffDays === 1 ? current.currentStreak + 1 : 1;
  const nextLongest = Math.max(current.longestStreak, nextStreak);

  // Determine newly earned badges (not already in earnedBadges)
  const newlyEarnedBadges: StreakBadgeId[] = STREAK_MILESTONES
    .filter(m => m.streak <= nextStreak && !current.earnedBadges.includes(m.badgeId))
    .map(m => m.badgeId);

  // Persist newly earned badges into nextState.earnedBadges
  const nextState: StreakState = {
    version: 1,
    lastActiveDate: today,
    currentStreak: nextStreak,
    longestStreak: nextLongest,
    earnedBadges: [...current.earnedBadges, ...newlyEarnedBadges],
    updatedAt: now,
  };

  return { nextState, newlyEarnedBadges };
}
