import type {
  DifficultyLevel,
  Exercise,
  ExerciseId,
  RepresentationType,
  SectionId,
  SkillTag,
  WorkbookDay,
} from "@/lib/types";

export type DayConcept = {
  dayNumber: number;
  title: string;
  objective: string;
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
): ExerciseByKind<"number_input"> => ({
  id: toExerciseId(dayNumber, sectionNumber, exerciseNumber),
  kind: "number_input",
  prompt,
  answer,
  min,
  max,
  hint,
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
): ExerciseByKind<"multiple_choice"> => ({
  id: toExerciseId(dayNumber, sectionNumber, exerciseNumber),
  kind: "multiple_choice",
  prompt,
  options,
  answer,
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
