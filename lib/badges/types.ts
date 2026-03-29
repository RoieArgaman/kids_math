import type { GradeId } from "@/lib/grades";

export type BadgeId =
  | "first-day-done"
  | "week-1-complete"
  | "week-2-complete"
  | "week-3-complete"
  | "week-4-complete"
  | "zero-mistakes"
  | "speed-runner"
  | "grade-a-graduate"
  | "perfect-week"
  | "comeback-kid"
  | "streak-3-days"
  | "streak-5-days"
  | "streak-10-days"
  | "halfway-there"
  | "sharp-mind"
  | "flawless-five"
  | "zero-hero"
  | "perfect-two-weeks"
  | "lightning-fast"
  | "speed-trio"
  | "iron-will"
  | "ten-and-done"
  | "early-bird"
  | "weekend-warrior"
  | "calendar-streak-3"
  | "calendar-streak-7"
  | "strand-numbers"
  | "strand-operations"
  | "strand-geometry"
  | "strand-advanced"
  | "exam-high-score"
  | "exam-ace"
  | "grade-b-graduate"
  | "grand-master"
  | "hundred-answers"
  | "five-hundred-answers";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
}

export interface UnlockedBadge {
  id: BadgeId;
  unlockedAt: string; // ISO
}

export interface BadgeState {
  version: 1;
  grade: GradeId;
  unlocked: UnlockedBadge[];
  seenIds: BadgeId[]; // IDs whose TrophyUnlock modal has been dismissed
  updatedAt: string;
}
