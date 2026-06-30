"use client";

import { SubjectDayScreen } from "@/components/screens/subject/SubjectDayScreen";
import { scienceScreenConfig } from "@/lib/subjects/subjectScreenConfig";
import type { ScienceLevel } from "@/lib/content/science-workbook";
import type { DayId } from "@/lib/types";

export function ScienceDayScreen({ level, dayId }: { level: ScienceLevel; dayId: DayId }) {
  return <SubjectDayScreen config={scienceScreenConfig} level={level} dayId={dayId} />;
}
