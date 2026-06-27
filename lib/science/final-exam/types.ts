import type { ExerciseId } from "@/lib/types";

export type ScienceFinalExamVersion = 1;

export interface ScienceFinalExamStateV1 {
  version: ScienceFinalExamVersion;
  createdAt: string;
  pickerVersion: 1;
  selectedExerciseIds: ExerciseId[];
  answers: Record<ExerciseId, string>;
  correctMap: Record<ExerciseId, boolean>;
  submittedAt?: string;
  scorePercent?: number;
  passed?: boolean;
}

export type ScienceFinalExamState = ScienceFinalExamStateV1;
