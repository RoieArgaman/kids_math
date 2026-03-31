import type { ExamPhase } from "@/lib/exam-session/types";
import type { GradeId } from "@/lib/grades";
import type { ExerciseId } from "@/lib/types";

export const GMAT_SECTION_ORDER_DEFAULT = ["quant", "verbal", "data"] as const;
export type GmatSectionKey = (typeof GMAT_SECTION_ORDER_DEFAULT)[number];

export type GmatChallengeVersion = 1;

export interface GmatChallengeStateV1 {
  version: GmatChallengeVersion;
  grade: GradeId;
  createdAt: string;
  pickerVersion: 1 | 2 | 3 | 4 | 5 | 6;
  phase: ExamPhase;
  sectionOrder: GmatSectionKey[];
  /** Index into sectionOrder for the current (or next-after-break) section. */
  orderIndex: number;
  itemsBySection: Record<GmatSectionKey, ExerciseId[]>;
  answers: Record<ExerciseId, string>;
  correctMap: Record<ExerciseId, boolean>;
  attempts: Record<ExerciseId, number>;
  bookmarks: Record<GmatSectionKey, ExerciseId[]>;
  reviewSnapshot: Record<ExerciseId, string> | null;
  sectionEndsAt: number | null;
  breakEndsAt: number | null;
  scorePercent?: number;
  scoreBySection?: Record<GmatSectionKey, number>;
  correctBySection?: Record<GmatSectionKey, number>;
  totalQuestions?: number;
  poolBySection?: Record<GmatSectionKey, ExerciseId[]>;
  sectionQuestionIndex?: number;
  adaptiveDifficulty?: number;
}
