export type DayId = `day-${number}`;
export type SectionId = `${DayId}-section-${number}`;
export type ExerciseId = `${SectionId}-exercise-${number}`;

export type SectionType =
  | "warmup"
  | "arithmetic"
  | "geometry"
  | "verbal"
  | "challenge"
  | "review";

export type RepresentationType = "concrete" | "pictorial" | "abstract";
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type SkillTag =
  | "counting"
  | "number-recognition"
  | "number-line"
  | "addition"
  | "subtraction"
  | "comparing"
  | "word-problems"
  | "geometry-shapes"
  | "patterns"
  | "place-value"
  | "measurement-length"
  | "measurement-time"
  | "symmetry-transform"
  | "gematria-letters"
  | "multiplication-intro"
  | "multiplication-tables"
  | "number-bonds"
  | "division-equal-groups"
  | "fractions-parts"
  | "measurement-area"
  | "measurement-weight"
  | "geometry-solids"
  | "money-shekel";

export interface CurriculumMeta {
  skillTags: SkillTag[];
  difficulty: DifficultyLevel;
  representation: RepresentationType;
  misconceptionTarget?: string;
}

export type ExerciseKind =
  | "number_input"
  | "multiple_choice"
  | "true_false"
  | "number_line_jump"
  | "verbal_input"
  | "shape_choice";

interface BaseExercise {
  id: ExerciseId;
  kind: ExerciseKind;
  prompt: string;
  explanation?: string;
  hint?: string;
  meta: CurriculumMeta;
}

export interface NumberInputExercise extends BaseExercise {
  kind: "number_input";
  answer: number;
  min?: number;
  max?: number;
}

export interface MultipleChoiceExercise extends BaseExercise {
  kind: "multiple_choice";
  options: string[];
  answer: string;
}

export interface TrueFalseExercise extends BaseExercise {
  kind: "true_false";
  answer: boolean;
}

export interface NumberLineJumpExercise extends BaseExercise {
  kind: "number_line_jump";
  start: number;
  end: number;
  step: 1 | 2 | 3 | 5;
  answer: number;
}

export interface VerbalInputExercise extends BaseExercise {
  kind: "verbal_input";
  answer: string;
}

export interface ShapeChoiceExercise extends BaseExercise {
  kind: "shape_choice";
  options: Array<"circle" | "square" | "triangle" | "rectangle">;
  answer: "circle" | "square" | "triangle" | "rectangle";
}

export type Exercise =
  | NumberInputExercise
  | MultipleChoiceExercise
  | TrueFalseExercise
  | NumberLineJumpExercise
  | VerbalInputExercise
  | ShapeChoiceExercise;

export interface WorkedExample {
  title: string;
  prompt: string;
  steps: string[];
  takeaway?: string;
}

export interface Section {
  id: SectionId;
  title: string;
  type: SectionType;
  learningGoal: string;
  prerequisiteSkillTags: SkillTag[];
  example?: WorkedExample;
  exercises: Exercise[];
}

export interface WorkbookDay {
  id: DayId;
  dayNumber: number;
  title: string;
  week: number;
  objective: string;
  spiralReviewTags: SkillTag[];
  unlockThresholdPercent: number;
  sections: Section[];
}

export type AnswerValue = string | number | boolean;

export interface ExerciseAttempt {
  exerciseId: ExerciseId;
  answer: AnswerValue;
  isCorrect: boolean;
  attemptedAt: string;
}

export interface DayProgressState {
  dayId: DayId;
  answers: Record<ExerciseId, AnswerValue>;
  correctAnswers: Record<ExerciseId, boolean>;
  wrongCount: number;
  attempts: ExerciseAttempt[];
  completedAt?: string;
  percentDone: number;
  isComplete: boolean;
}

export interface WorkbookProgressState {
  version: 1;
  days: Record<DayId, DayProgressState>;
  updatedAt: string;
}

export type AnalyticsEventName =
  | "home_viewed"
  | "grade_selected"
  | "plan_viewed"
  | "day_card_clicked"
  | "day_viewed"
  | "answer_submitted"
  | "completion_gate_blocked"
  | "completion_gate_passed"
  | "day_completed"
  | "state_loaded"
  | "state_saved"
  | "state_load_failed"
  | "gmat_challenge_rules_viewed"
  | "gmat_challenge_started"
  | "gmat_challenge_section_completed"
  | "gmat_challenge_completed";

export interface AnalyticsEvent {
  id: string;
  schemaVersion: 1;
  name: AnalyticsEventName;
  dayId?: DayId;
  sectionId?: SectionId;
  exerciseId?: ExerciseId;
  payload?: Record<string, string | number | boolean | null>;
  timestamp: string;
}

