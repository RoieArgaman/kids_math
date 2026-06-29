"use client";

import { SubjectLevelPickerScreen } from "@/components/screens/subject/SubjectLevelPickerScreen";
import { englishScreenConfig } from "@/lib/subjects/subjectScreenConfig";

export function EnglishLevelPickerScreen() {
  return <SubjectLevelPickerScreen config={englishScreenConfig} />;
}
