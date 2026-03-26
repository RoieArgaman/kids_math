import type { GradeId } from "@/lib/grades";
import type { ExerciseId } from "@/lib/types";

export type FinalExamVersion = 1;

export interface FinalExamStateV1 {
  version: FinalExamVersion;
  grade: GradeId;
  createdAt: string;
  pickerVersion: 1;
  selectedExerciseIds: ExerciseId[];
  answers: Record<ExerciseId, string>;
  correctMap: Record<ExerciseId, boolean>;
  attempts: Record<ExerciseId, number>;
  submittedAt?: string;
  scorePercent?: number;
  passed?: boolean;
}

export type FinalExamState = FinalExamStateV1;

