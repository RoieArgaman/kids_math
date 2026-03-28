export interface StreakState {
  version: 1;
  lastActiveDate: string;     // "YYYY-MM-DD" local time
  currentStreak: number;
  longestStreak: number;
  earnedBadges: string[];     // e.g. ["streak_3", "streak_7"]
  updatedAt: string;          // full ISO timestamp
}

export type StreakBadgeId = "streak_3" | "streak_7" | "streak_30";

export const STREAK_MILESTONES: ReadonlyArray<{ streak: number; badgeId: StreakBadgeId }> = [
  { streak: 3,  badgeId: "streak_3"  },
  { streak: 7,  badgeId: "streak_7"  },
  { streak: 30, badgeId: "streak_30" },
];

export const STREAK_BADGE_LABELS: Record<StreakBadgeId, string> = {
  streak_3:  "3 ימים ברצף! 🔥",
  streak_7:  "שבוע שלם! 🏅",
  streak_30: "חודש אלוף! 🏆",
};
