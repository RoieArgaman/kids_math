"use client";

import { useEffect, useRef, useState } from "react";

import { MAX_SECTION_WRONG_ANSWERS } from "@/lib/progress/engine";
import type { ExerciseId, SectionId } from "@/lib/types";

interface UseSectionResetOptions {
  sectionWrongCount: number;
  resetSection: (sectionId: SectionId, exerciseIds: ExerciseId[], totalExercises: number) => void;
  sectionId: SectionId;
  exerciseIds: ExerciseId[];
  totalExercises: number;
  /** Called when the section is auto-reset due to too many wrong answers. */
  onReset: () => void;
}

export function useSectionReset({
  sectionWrongCount,
  resetSection,
  sectionId,
  exerciseIds,
  totalExercises,
  onReset,
}: UseSectionResetOptions): {
  resetNotice: string;
} {
  const [resetNotice, setResetNotice] = useState("");
  const resetNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (exerciseIds.length === 0) {
      return;
    }
    if (sectionWrongCount < MAX_SECTION_WRONG_ANSWERS) {
      return;
    }
    if (resetNotice) {
      return;
    }
    resetSection(sectionId, exerciseIds, totalExercises);
    onReset();
    setResetNotice(
      `הִגַּעַתְּ לְ-${MAX_SECTION_WRONG_ANSWERS} טָעוּיוֹת בַּחֵלֶק. מַתְחִילִים אֶת הַחֵלֶק מֵחָדָשׁ.`,
    );

    if (resetNoticeTimeoutRef.current) {
      clearTimeout(resetNoticeTimeoutRef.current);
    }
    resetNoticeTimeoutRef.current = setTimeout(() => {
      setResetNotice("");
    }, 5000);
  }, [
    sectionWrongCount,
    resetSection,
    onReset,
    resetNotice,
    sectionId,
    exerciseIds,
    totalExercises,
  ]);

  useEffect(() => {
    return () => {
      if (resetNoticeTimeoutRef.current) {
        clearTimeout(resetNoticeTimeoutRef.current);
      }
    };
  }, []);

  return { resetNotice };
}
