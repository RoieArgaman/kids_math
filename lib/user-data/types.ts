import type { WorkbookProgressState } from "@/lib/types";
import type { BadgeState } from "@/lib/badges/types";
import type { StreakState } from "@/lib/streak/types";
import type { FinalExamState } from "@/lib/final-exam/types";
import type { GmatChallengeStateV1 } from "@/lib/gmat-challenge/types";

export interface GradeProgressData {
  workbook: WorkbookProgressState | null;
  badges: BadgeState | null;
  finalExam: FinalExamState | null;
  gmat: GmatChallengeStateV1 | null;
}

export interface UserProgressBundle {
  bundleVersion: 1;
  updatedAt: string;
  streak: StreakState | null;
  grades: {
    a: GradeProgressData;
    b: GradeProgressData;
  };
}
