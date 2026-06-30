"use client";

import { SubjectSectionScreen } from "@/components/screens/subject/SubjectSectionScreen";
import { scienceScreenConfig } from "@/lib/subjects/subjectScreenConfig";
import type { ScienceLevel } from "@/lib/content/science-workbook";
import type { DayId, SectionId } from "@/lib/types";

export function ScienceSectionScreen({
  level,
  dayId,
  sectionId,
}: {
  level: ScienceLevel;
  dayId: DayId;
  sectionId: SectionId;
}) {
  return (
    <SubjectSectionScreen
      config={scienceScreenConfig}
      level={level}
      dayId={dayId}
      sectionId={sectionId}
    />
  );
}
