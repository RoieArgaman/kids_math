import type { WorkbookProgressState } from "@/lib/types";
import type { BadgeState } from "@/lib/badges/types";
import type { StreakState } from "@/lib/streak/types";
import type { FinalExamState } from "@/lib/final-exam/types";
import type { GmatChallengeStateV1 } from "@/lib/gmat-challenge/types";
import type { EnglishFinalExamState } from "@/lib/english/final-exam/types";
import type { ScienceFinalExamState } from "@/lib/science/final-exam/types";
import type { ReviewState } from "@/lib/review/types";

export interface GradeProgressData {
  workbook: WorkbookProgressState | null;
  badges: BadgeState | null;
  finalExam: FinalExamState | null;
  gmat: GmatChallengeStateV1 | null;
  review: ReviewState | null;
}

/** English subject data (added in bundleVersion 2). Single Pre-A1 track, no grade. */
export interface EnglishProgressData {
  workbook: WorkbookProgressState | null;
  finalExam: EnglishFinalExamState | null;
  review: ReviewState | null;
}

/**
 * Science subject data (added in bundleVersion 4). Single store across both
 * Israeli grade levels (כיתה א׳/ב׳); `finalExam` carries Level א׳'s exam, mirroring
 * how the English bundle currently syncs only Level A's exam.
 */
export interface ScienceProgressData {
  workbook: WorkbookProgressState | null;
  finalExam: ScienceFinalExamState | null;
  review: ReviewState | null;
}

/**
 * Cross-device sync bundle.
 * - v1: math only (`grades`). Older clients/servers still produce/accept this.
 * - v2: adds `english`. Backward-compatible — `english` is optional so v1 payloads
 *   still hydrate, and v2 payloads degrade gracefully on older readers.
 * - v3: adds per-track `review` (nested under each grade + english). Additive and
 *   backward-compatible — `review` is absent on v1/v2 payloads, and v3 payloads
 *   degrade gracefully on older readers that ignore the extra field.
 * - v4: adds `science`. Backward-compatible — `science` is optional, so older
 *   payloads still hydrate and v4 payloads degrade gracefully on older readers.
 */
export interface UserProgressBundle {
  bundleVersion: 1 | 2 | 3 | 4;
  updatedAt: string;
  streak: StreakState | null;
  grades: {
    a: GradeProgressData;
    b: GradeProgressData;
  };
  english?: EnglishProgressData;
  science?: ScienceProgressData;
}
