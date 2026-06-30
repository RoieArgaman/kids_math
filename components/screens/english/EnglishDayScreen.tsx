"use client";

import { SubjectDayScreen } from "@/components/screens/subject/SubjectDayScreen";
import { englishScreenConfig } from "@/lib/subjects/subjectScreenConfig";
import type { EnglishLevel } from "@/lib/content/english-workbook";
import type { DayId } from "@/lib/types";

export function EnglishDayScreen({ level, dayId }: { level: EnglishLevel; dayId: DayId }) {
  return <SubjectDayScreen config={englishScreenConfig} level={level} dayId={dayId} />;
}
