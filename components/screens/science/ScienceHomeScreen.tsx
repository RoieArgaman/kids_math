"use client";

import { SubjectHomeScreen } from "@/components/screens/subject/SubjectHomeScreen";
import { scienceScreenConfig } from "@/lib/subjects/subjectScreenConfig";
import type { ScienceLevel } from "@/lib/content/science-workbook";

export function ScienceHomeScreen({ level }: { level: ScienceLevel }) {
  return <SubjectHomeScreen config={scienceScreenConfig} level={level} />;
}
