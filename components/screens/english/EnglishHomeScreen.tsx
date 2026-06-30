"use client";

import { SubjectHomeScreen } from "@/components/screens/subject/SubjectHomeScreen";
import { englishScreenConfig } from "@/lib/subjects/subjectScreenConfig";
import type { EnglishLevel } from "@/lib/content/english-workbook";

export function EnglishHomeScreen({ level }: { level: EnglishLevel }) {
  return <SubjectHomeScreen config={englishScreenConfig} level={level} />;
}
