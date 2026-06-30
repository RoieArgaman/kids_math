"use client";

import { SubjectSectionScreen } from "@/components/screens/subject/SubjectSectionScreen";
import { englishScreenConfig } from "@/lib/subjects/subjectScreenConfig";
import type { EnglishLevel } from "@/lib/content/english-workbook";
import type { DayId, SectionId } from "@/lib/types";

export function EnglishSectionScreen({
  level,
  dayId,
  sectionId,
}: {
  level: EnglishLevel;
  dayId: DayId;
  sectionId: SectionId;
}) {
  return (
    <SubjectSectionScreen
      config={englishScreenConfig}
      level={level}
      dayId={dayId}
      sectionId={sectionId}
    />
  );
}
