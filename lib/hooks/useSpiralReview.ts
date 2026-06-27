"use client";

import { useEffect, useState } from "react";

import type { GradeId } from "@/lib/grades";
import type { Subject } from "@/lib/subjects";
import { getTrackDaysById, loadTrackProgress } from "@/lib/track";
import type { DayId, ExerciseId } from "@/lib/types";
import { recordReview } from "@/lib/review/engine";
import { selectReviewItems } from "@/lib/review/select";
import { loadReviewState, saveReviewState } from "@/lib/review/storage";
import { REVIEW_WARMUP_MAX, type ReviewCandidate } from "@/lib/review/types";

interface UseSpiralReviewOptions {
  grade: GradeId;
  subject?: Subject;
  dayId: DayId;
}

interface UseSpiralReviewApi {
  candidates: ReviewCandidate[];
  record: (exerciseId: ExerciseId, isCorrect: boolean) => void;
  isHydrated: boolean;
}

/**
 * Ephemeral spiral-review surface for the warm-up block. Reads cross-day struggle
 * history + the Leitner overlay to pick a stable, session-fixed candidate list, and
 * routes answers ONLY through the review SR overlay — never the current day's
 * DayProgressState. Hydration is guarded like useProgress to avoid SSR/client mismatch.
 */
export function useSpiralReview({
  grade,
  subject,
  dayId,
}: UseSpiralReviewOptions): UseSpiralReviewApi {
  const [candidates, setCandidates] = useState<ReviewCandidate[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Compute the visible candidate list once per (track, day). Keep it stable for the
  // session — do not re-filter mid-session as items graduate.
  useEffect(() => {
    setCandidates(
      selectReviewItems({
        progress: loadTrackProgress({ subject, grade }),
        daysById: getTrackDaysById({ subject, grade }),
        reviewState: loadReviewState({ subject, grade }),
        now: new Date().toISOString(),
        excludeDayId: dayId,
        max: REVIEW_WARMUP_MAX,
      }),
    );
    setIsHydrated(true);
  }, [grade, subject, dayId]);

  function record(exerciseId: ExerciseId, isCorrect: boolean): void {
    const next = recordReview(
      loadReviewState({ subject, grade }),
      exerciseId,
      isCorrect,
      new Date().toISOString(),
    );
    saveReviewState(next, { subject, grade });
  }

  return { candidates, record, isHydrated };
}
