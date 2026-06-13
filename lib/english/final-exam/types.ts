import type { ExerciseId } from "@/lib/types";

export type EnglishFinalExamVersion = 1;

export interface EnglishFinalExamStateV1 {
  version: EnglishFinalExamVersion;
  createdAt: string;
  pickerVersion: 1;
  selectedExerciseIds: ExerciseId[];
  answers: Record<ExerciseId, string>;
  correctMap: Record<ExerciseId, boolean>;
  submittedAt?: string;
  scorePercent?: number;
  passed?: boolean;
}

export type EnglishFinalExamState = EnglishFinalExamStateV1;
