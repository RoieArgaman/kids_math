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
  | "shape_choice"
  | "listen_choose"
  | "letter_tiles"
  | "match_pairs";

interface BaseExercise {
  id: ExerciseId;
  kind: ExerciseKind;
  prompt: string;
  /**
   * Optional explicit math expression for rendering (e.g. "7 + 5 = ?").
   * When present, the boxed-token renderer uses it directly instead of
   * reverse-engineering the formula from `prompt` via regex. Strictly additive:
   * absent or malformed → falls back to `splitMathExpression(prompt)` (today's behavior).
   */
  mathExpression?: string;
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

export interface ShapeChoiceExercise extends BaseExercise {
  kind: "shape_choice";
  options: Array<"circle" | "square" | "triangle" | "rectangle">;
  answer: "circle" | "square" | "triangle" | "rectangle";
}

/**
 * Audio-first listening exercise (English layer): TTS speaks `audioText` (English),
 * the learner taps the matching option. Options are typically Hebrew meanings or
 * English words. Reuses the multiple-choice answer model (single string value).
 */
export interface ListenChooseExercise extends BaseExercise {
  kind: "listen_choose";
  /** English text spoken by TTS (the 🔊 prompt). */
  audioText: string;
  options: string[];
  answer: string;
  /** Text direction of the options (English answers need LTR). Defaults to "he". */
  optionsLang?: "he" | "en";
}

/**
 * Tap-to-build spelling exercise (English layer): the learner assembles `word`
 * from letter tiles by tapping — no keyboard / free-text (respects the
 * numbers-only / no-text-input product rule).
 */
export interface LetterTilesExercise extends BaseExercise {
  kind: "letter_tiles";
  /** Target English word to assemble (lowercase letters). */
  word: string;
  /** Optional explicit tile set (scrambled). Defaults to the letters of `word`. */
  tiles?: string[];
  /** Optional English text spoken as an audio hint. */
  audioText?: string;
}

/**
 * Tap-to-match exercise (English layer): the learner connects each left item to its
 * matching right item (e.g. English word ↔ Hebrew meaning). No typing — taps only.
 * The assembled matches are serialized to the single-string answer model as JSON.
 */
export interface MatchPairsExercise extends BaseExercise {
  kind: "match_pairs";
  /** The correct pairs; left/right are shuffled independently for display. */
  pairs: Array<{ left: string; right: string }>;
  /** Text direction of the left column (defaults "en"). */
  leftLang?: "he" | "en";
  /** Text direction of the right column (defaults "he"). */
  rightLang?: "he" | "en";
  /** Optional English audio for each left item (keyed by left text). */
  audioByLeft?: Record<string, string>;
}

export type Exercise =
  | NumberInputExercise
  | MultipleChoiceExercise
  | TrueFalseExercise
  | NumberLineJumpExercise
  | ShapeChoiceExercise
  | ListenChooseExercise
  | LetterTilesExercise
  | MatchPairsExercise;

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
  /** Optional hub primer: child-friendly explanation before sections (align with section WorkedExample). */
  teachingSummary?: string;
  /** Optional short steps (CPA-friendly); shown with teachingSummary on day overview. */
  teachingSteps?: string[];
  spiralReviewTags: SkillTag[];
  unlockThresholdPercent: number;
  sections: Section[];
}
