import type { WorkbookProgressState } from "@/lib/types";
import type { BadgeState } from "@/lib/badges/types";
import type { StreakState } from "@/lib/streak/types";
import type { FinalExamState } from "@/lib/final-exam/types";
import type { GmatChallengeStateV1 } from "@/lib/gmat-challenge/types";
import type { EnglishFinalExamState } from "@/lib/english/final-exam/types";

export interface GradeProgressData {
  workbook: WorkbookProgressState | null;
  badges: BadgeState | null;
  finalExam: FinalExamState | null;
  gmat: GmatChallengeStateV1 | null;
}

/** English subject data (added in bundleVersion 2). Single Pre-A1 track, no grade. */
export interface EnglishProgressData {
  workbook: WorkbookProgressState | null;
  finalExam: EnglishFinalExamState | null;
}

/**
 * Cross-device sync bundle.
 * - v1: math only (`grades`). Older clients/servers still produce/accept this.
 * - v2: adds `english`. Backward-compatible — `english` is optional so v1 payloads
 *   still hydrate, and v2 payloads degrade gracefully on older readers.
 */
export interface UserProgressBundle {
  bundleVersion: 1 | 2;
  updatedAt: string;
  streak: StreakState | null;
  grades: {
    a: GradeProgressData;
    b: GradeProgressData;
  };
  english?: EnglishProgressData;
}
