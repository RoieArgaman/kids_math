"use client";

import { SubjectFinalExamScreen } from "@/components/screens/subject/SubjectFinalExamScreen";
import { scienceScreenConfig } from "@/lib/subjects/subjectScreenConfig";
import type { ScienceLevel } from "@/lib/content/science-workbook";

export function ScienceFinalExamScreen({ level }: { level: ScienceLevel }) {
  return <SubjectFinalExamScreen config={scienceScreenConfig} level={level} />;
}
