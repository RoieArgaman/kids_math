import type { GradeId } from "@/lib/grades";

export type BadgeId =
  | "first-day-done"
  | "week-1-complete"
  | "zero-mistakes"
  | "speed-runner"
  | "grade-a-graduate"
  | "perfect-week"
  | "comeback-kid"
  | "streak-3-days";

export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
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
