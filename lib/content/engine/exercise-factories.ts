import type { GradeId } from "@/lib/grades";
import type {
  DifficultyLevel,
  Exercise,
  ExerciseId,
  MisconceptionRule,
  RepresentationType,
  SectionId,
  SkillTag,
  WorkbookDay,
} from "@/lib/types";

import { buildNumberLineJumpParams, knownNumberCeiling, numberLineJumpTail } from "./number-range";

export type DayConcept = {
  dayNumber: number;
  title: string;
  objective: string;
  /** Optional day-hub teaching primer (Hebrew); surfaced on DayOverviewScreen. */
  teachingSummary?: string;
  teachingSteps?: string[];
  mainTags: SkillTag[];
  spiralReviewTags: SkillTag[];
  arithmeticPrompt: string;
  arithmeticAnswer: number;
  arithmeticMcOptions: string[];
  arithmeticMcAnswer: string;
  languagePrompt: string;
  languageOptions: [string, string, string];
  languageAnswer: string;
  reviewPrompt: string;
  reviewAnswer: boolean;
  challengePrompt: string;
  challengeAnswer: number;
  geometryPrompt?: string;
  geometryAnswer?: "circle" | "square" | "triangle" | "rectangle";
};

type ExerciseByKind<K extends Exercise["kind"]> = Extract<Exercise, { kind: K }>;

export const toDayId = (dayNumber: number): WorkbookDay["id"] => `day-${dayNumber}`;
export const toSectionId = (dayNumber: number, sectionNumber: number): SectionId =>
  `${toDayId(dayNumber)}-section-${sectionNumber}`;
export const toExerciseId = (
  dayNumber: number,
  sectionNumber: number,
  exerciseNumber: number,
): ExerciseId => `${toSectionId(dayNumber, sectionNumber)}-exercise-${exerciseNumber}`;

export const meta = (
  skillTags: SkillTag[],
  difficulty: DifficultyLevel,
  representation: RepresentationType,
  misconceptionTarget?: string,
) => ({
  skillTags,
  difficulty,
  representation,
  misconceptionTarget,
});

export const numberInput = (
  dayNumber: number,
  sectionNumber: number,
  exerciseNumber: number,
  prompt: string,
  answer: number,
  skillTags: SkillTag[],
  difficulty: DifficultyLevel,
  representation: RepresentationType,
  min?: number,
  max?: number,
  hint?: string,
  misconceptions?: MisconceptionRule[],
): ExerciseByKind<"number_input"> => ({
  id: toExerciseId(dayNumber, sectionNumber, exerciseNumber),
  kind: "number_input",
  prompt,
  answer,
  min,
  max,
  hint,
  misconceptions,
  meta: meta(skillTags, difficulty, representation),
});

export const multipleChoice = (
  dayNumber: number,
  sectionNumber: number,
  exerciseNumber: number,
  prompt: string,
  options: string[],
  answer: string,
  skillTags: SkillTag[],
  difficulty: DifficultyLevel,
  representation: RepresentationType,
  misconceptions?: MisconceptionRule[],
): ExerciseByKind<"multiple_choice"> => ({
  id: toExerciseId(dayNumber, sectionNumber, exerciseNumber),
  kind: "multiple_choice",
  prompt,
  options,
  answer,
  misconceptions,
  meta: meta(skillTags, difficulty, representation),
});

export const trueFalse = (
  dayNumber: number,
  sectionNumber: number,
  exerciseNumber: number,
  prompt: string,
  answer: boolean,
  skillTags: SkillTag[],
  difficulty: DifficultyLevel,
  representation: RepresentationType,
): ExerciseByKind<"true_false"> => ({
  id: toExerciseId(dayNumber, sectionNumber, exerciseNumber),
  kind: "true_false",
  prompt,
  answer,
  meta: meta(skillTags, difficulty, representation),
});

export const numberLineJump = (
  dayNumber: number,
  sectionNumber: number,
  exerciseNumber: number,
  prompt: string,
  start: number,
  end: number,
  step: 1 | 2 | 3 | 5,
  answer: number,
  skillTags: SkillTag[],
  difficulty: DifficultyLevel,
  representation: RepresentationType,
): ExerciseByKind<"number_line_jump"> => ({
  id: toExerciseId(dayNumber, sectionNumber, exerciseNumber),
  kind: "number_line_jump",
  prompt,
  start,
  end,
  step,
  answer,
  meta: meta(skillTags, difficulty, representation),
});

/**
 * Grade-aware `number_line_jump` built from the seeded generator: picks a varied,
 * modest, invariant-safe {start,end,step,jumps} bounded by the day's known-number
 * ceiling, and formats the spoken prompt so its numbers always match the rendered
 * line. `leadIn` is the Hebrew prefix incl. its trailing separator (e.g.
 * "עַל קַו הַמִּסְפָּרִים: "); `seedSuffix` distinguishes call sites that share a
 * (day, section, exercise) coordinate so their random streams differ.
 */
export const generatedNumberLineJump = (args: {
  grade: GradeId;
  dayNumber: number;
  sectionNumber: number;
  exerciseNumber: number;
  seedSuffix: string;
  leadIn: string;
  tags: SkillTag[];
  difficulty: DifficultyLevel;
  representation: RepresentationType;
}): ExerciseByKind<"number_line_jump"> => {
  const ceiling = knownNumberCeiling(args.grade, args.dayNumber);
  const p = buildNumberLineJumpParams(
    `${args.grade}|${args.dayNumber}|${args.sectionNumber}|${args.exerciseNumber}|${args.seedSuffix}`,
    ceiling,
  );
  return numberLineJump(
    args.dayNumber,
    args.sectionNumber,
    args.exerciseNumber,
    `${args.leadIn}${numberLineJumpTail(p.start, p.end, p.step)}`,
    p.start,
    p.end,
    p.step,
    p.jumps,
    args.tags,
    args.difficulty,
    args.representation,
  );
};

export const listenChoose = (
  dayNumber: number,
  sectionNumber: number,
  exerciseNumber: number,
  prompt: string,
  audioText: string,
  options: string[],
  answer: string,
  skillTags: SkillTag[],
  difficulty: DifficultyLevel,
  representation: RepresentationType,
  optionsLang: "he" | "en" = "he",
): ExerciseByKind<"listen_choose"> => ({
  id: toExerciseId(dayNumber, sectionNumber, exerciseNumber),
  kind: "listen_choose",
  prompt,
  audioText,
  options,
  answer,
  optionsLang,
  meta: meta(skillTags, difficulty, representation),
});

export const letterTiles = (
  dayNumber: number,
  sectionNumber: number,
  exerciseNumber: number,
  prompt: string,
  word: string,
  skillTags: SkillTag[],
  difficulty: DifficultyLevel,
  representation: RepresentationType,
  audioText?: string,
  tiles?: string[],
): ExerciseByKind<"letter_tiles"> => ({
  id: toExerciseId(dayNumber, sectionNumber, exerciseNumber),
  kind: "letter_tiles",
  prompt,
  word,
  tiles,
  audioText,
  meta: meta(skillTags, difficulty, representation),
});

export const matchPairs = (
  dayNumber: number,
  sectionNumber: number,
  exerciseNumber: number,
  prompt: string,
  pairs: Array<{ left: string; right: string }>,
  skillTags: SkillTag[],
  difficulty: DifficultyLevel,
  representation: RepresentationType,
  options?: {
    leftLang?: "he" | "en";
    rightLang?: "he" | "en";
    audioByLeft?: Record<string, string>;
  },
): ExerciseByKind<"match_pairs"> => ({
  id: toExerciseId(dayNumber, sectionNumber, exerciseNumber),
  kind: "match_pairs",
  prompt,
  pairs,
  leftLang: options?.leftLang ?? "en",
  rightLang: options?.rightLang ?? "he",
  audioByLeft: options?.audioByLeft,
  meta: meta(skillTags, difficulty, representation),
});

export const shapeChoice = (
  dayNumber: number,
  sectionNumber: number,
  exerciseNumber: number,
  prompt: string,
  answer: "circle" | "square" | "triangle" | "rectangle",
  skillTags: SkillTag[],
  difficulty: DifficultyLevel,
  representation: RepresentationType,
): ExerciseByKind<"shape_choice"> => ({
  id: toExerciseId(dayNumber, sectionNumber, exerciseNumber),
  kind: "shape_choice",
  prompt,
  options: ["circle", "square", "triangle", "rectangle"],
  answer,
  meta: meta(skillTags, difficulty, representation),
});
