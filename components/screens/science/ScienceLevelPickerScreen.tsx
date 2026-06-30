"use client";

import { SubjectLevelPickerScreen } from "@/components/screens/subject/SubjectLevelPickerScreen";
import { scienceScreenConfig } from "@/lib/subjects/subjectScreenConfig";

export function ScienceLevelPickerScreen() {
  return <SubjectLevelPickerScreen config={scienceScreenConfig} />;
}
