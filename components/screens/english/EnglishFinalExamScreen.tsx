"use client";

import { SubjectFinalExamScreen } from "@/components/screens/subject/SubjectFinalExamScreen";
import { englishScreenConfig } from "@/lib/subjects/subjectScreenConfig";
import type { EnglishLevel } from "@/lib/content/english-workbook";

export function EnglishFinalExamScreen({ level }: { level: EnglishLevel }) {
  return <SubjectFinalExamScreen config={englishScreenConfig} level={level} />;
}
