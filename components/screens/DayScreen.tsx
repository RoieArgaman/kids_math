"use client";

import { DayOverviewScreen } from "@/components/screens/DayOverviewScreen";
import { FinalExamScreen } from "@/components/screens/FinalExamScreen";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";
import { DEFAULT_GRADE, type GradeId } from "@/lib/grades";
import type { DayId } from "@/lib/types";

export function DayScreen({ grade, dayId }: { grade: GradeId; dayId: DayId }) {
  const effectiveGrade = grade ?? DEFAULT_GRADE;
  if (dayId === FINAL_EXAM_DAY_ID) {
    return <FinalExamScreen grade={effectiveGrade} />;
  }
  return <DayOverviewScreen grade={effectiveGrade} dayId={dayId} />;
}
