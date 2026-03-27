import type {
  DifficultyLevel,
  Exercise,
  ExerciseId,
  RepresentationType,
  Section,
  SectionId,
  SkillTag,
  WorkbookDay,
} from "../types";
import { countRangePrompt } from "./promptTemplates";

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
  verbalPrompt: string;
  verbalAnswer: string;
  reviewPrompt: string;
  reviewAnswer: boolean;
  challengePrompt: string;
  challengeAnswer: number;
  geometryPrompt?: string;
  geometryAnswer?: "circle" | "square" | "triangle" | "rectangle";
};

type ExerciseByKind<K extends Exercise["kind"]> = Extract<Exercise, { kind: K }>;

const toDayId = (dayNumber: number): WorkbookDay["id"] => `day-${dayNumber}`;
const toSectionId = (dayNumber: number, sectionNumber: number): SectionId =>
  `${toDayId(dayNumber)}-section-${sectionNumber}`;
const toExerciseId = (
  dayNumber: number,
  sectionNumber: number,
  exerciseNumber: number,
): ExerciseId => `${toSectionId(dayNumber, sectionNumber)}-exercise-${exerciseNumber}`;

const meta = (
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

const numberInput = (
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

const multipleChoice = (
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

const trueFalse = (
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

const verbalInput = (
  dayNumber: number,
  sectionNumber: number,
  exerciseNumber: number,
  prompt: string,
  answer: string,
  skillTags: SkillTag[],
  difficulty: DifficultyLevel,
  representation: RepresentationType,
): ExerciseByKind<"verbal_input"> => ({
  id: toExerciseId(dayNumber, sectionNumber, exerciseNumber),
  kind: "verbal_input",
  prompt,
  answer,
  meta: meta(skillTags, difficulty, representation),
});

const numberLineJump = (
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

const shapeChoice = (
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

const pickWarmupSkillTags = (concept: DayConcept, priorConcepts: DayConcept[]): SkillTag[] => {
  const ordered: SkillTag[] = [];
  const seen = new Set<SkillTag>();
  const push = (t: SkillTag) => {
    if (ordered.length >= 4) {
      return;
    }
    if (!seen.has(t)) {
      seen.add(t);
      ordered.push(t);
    }
  };
  for (const t of concept.spiralReviewTags) {
    push(t);
  }
  for (const c of [...priorConcepts].sort((a, b) => a.dayNumber - b.dayNumber)) {
    for (const t of c.mainTags) {
      push(t);
    }
  }
  const fallback: SkillTag[] = [
    "counting",
    "addition",
    "subtraction",
    "number-line",
    "number-recognition",
    "division-equal-groups",
    "fractions-parts",
    "multiplication-tables",
  ];
  for (const t of fallback) {
    push(t);
  }
  return ordered.slice(0, 4);
};

const warmupExerciseForTag = (
  dayNumber: number,
  exerciseIndex: number,
  tag: SkillTag,
  difficulty: DifficultyLevel,
): Exercise => {
  const seed = dayNumber * 17 + exerciseIndex * 3;
  switch (tag) {
    case "counting":
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        `חִימּוּם מִיָּמִים קוֹדְמִים: סִפְרוּ מִ-1 עַד ${4 + (seed % 4)}. כַּמָּה מִסְפָּרִים?`,
        4 + (seed % 4),
        ["counting"],
        difficulty,
        "concrete",
        0,
        15,
      );
    case "number-recognition":
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: חַשְּׁבוּ 5 + 4",
        9,
        ["number-recognition", "addition"],
        difficulty,
        "abstract",
        0,
        20,
      );
    case "number-line":
      return (() => {
        const step = ((): 1 | 2 | 3 | 5 => {
          const s = (seed % 4) as 0 | 1 | 2 | 3;
          return s === 0 ? 1 : s === 1 ? 2 : s === 2 ? 3 : 5;
        })();
        const start = step === 5 ? 0 : seed % 2 === 0 ? 0 : step;
        const jumps = 4 + (seed % 3); // 4–6 jumps
        const end = start + step * jumps;
        return numberLineJump(
          dayNumber,
          1,
          exerciseIndex,
          `חִימּוּם: עַל קַו מִסְפָּרִים מִ-${start} עַד ${end} בִּקְפִיצוֹת שֶׁל ${step}. כַּמָּה קְפִיצוֹת?`,
          start,
          end,
          step,
          jumps,
          ["number-line"],
          difficulty,
          exerciseIndex === 1 ? "concrete" : exerciseIndex === 2 ? "pictorial" : "abstract",
        );
      })();
    case "addition": {
      const a = 3 + (seed % 7);
      const b = 2 + ((seed >> 2) % 7);
      const sum = a + b;
      const prompt = `חִימּוּם: חַשְּׁבוּ ${a} + ${b}`;
      const answer = sum;
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        prompt,
        answer,
        ["addition"],
        difficulty,
        exerciseIndex === 1 ? "concrete" : exerciseIndex === 2 ? "pictorial" : "abstract",
        0,
        30,
      );
    }
    case "subtraction": {
      const x = 12 + (seed % 18);
      const y = 2 + (seed % 9);
      const diff = x - y;
      const prompt = `חִימּוּם: חַשְּׁבוּ ${x} - ${y}`;
      const answer = diff;
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        prompt,
        answer,
        ["subtraction"],
        difficulty,
        exerciseIndex === 1 ? "concrete" : exerciseIndex === 2 ? "pictorial" : "abstract",
        0,
        30,
      );
    }
    case "comparing": {
      const p = 10 + (seed % 8);
      const q = p + 3 + (seed % 2);
      return multipleChoice(
        dayNumber,
        1,
        exerciseIndex,
        `חִימּוּם: אֵיזֶה גָּדוֹל יוֹתֵר: ${p} אוֹ ${q}?`,
        [`${p}`, `${q}`, "שְׁווִים"],
        `${q}`,
        ["comparing"],
        difficulty,
        "abstract",
      );
    }
    case "word-problems":
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: לְנֹעַם הָיוּ 6 מַדְבֵּקוֹת. קִבְּלָה עוֹד 3. כַּמָּה יֵשׁ לָהּ?",
        9,
        ["word-problems", "addition"],
        difficulty,
        "pictorial",
        0,
        20,
      );
    case "geometry-shapes":
      return shapeChoice(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: אֵיזוֹ צוּרָה הִיא עִגּוּל?",
        "circle",
        ["geometry-shapes"],
        difficulty,
        "concrete",
      );
    case "patterns":
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: הַשְׁלִימוּ: 2, 4, 6, __",
        8,
        ["patterns", "number-line"],
        difficulty,
        "abstract",
        0,
        20,
      );
    case "place-value":
      return multipleChoice(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: בַּמִּסְפָּר 56, כַּמָּה עֲשָׂרוֹת?",
        ["5", "6", "56"],
        "5",
        ["place-value"],
        difficulty,
        "abstract",
      );
    case "measurement-length":
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: 5 ס״מ וְעוֹד 5 ס״מ — כַּמָּה ס״מ בַּסַּךְ?",
        10,
        ["measurement-length", "addition"],
        difficulty,
        "concrete",
        0,
        30,
      );
    case "measurement-time":
      return trueFalse(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: שָׁעָה אַחַת הִיא 60 דַּקּוֹת.",
        true,
        ["measurement-time"],
        difficulty,
        "abstract",
      );
    case "symmetry-transform":
      return trueFalse(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: אַחֲרֵי שִׁיקּוּף אוֹפְקִי רִיבּוּעַ נִשְׁאָר רִיבּוּעַ.",
        true,
        ["symmetry-transform", "geometry-shapes"],
        difficulty,
        "abstract",
      );
    case "gematria-letters":
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם בְּגִימַטְרְיָה: חַשְּׁבוּ א (1) + ב (2)",
        3,
        ["gematria-letters", "addition"],
        difficulty,
        "abstract",
        0,
        30,
      );
    case "multiplication-intro":
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: חַשְּׁבוּ 3 + 3 + 3 (שָׁלוֹשׁ פְּעָמִים שָׁלוֹשׁ)",
        9,
        ["multiplication-intro", "addition"],
        difficulty,
        "abstract",
        0,
        30,
      );
    case "number-bonds":
      return (() => {
        const target = seed % 2 === 0 ? 10 : 20;
        const left = 3 + (seed % (target === 10 ? 7 : 17));
        const right = target - left;
        return numberInput(
          dayNumber,
          1,
          exerciseIndex,
          `חִימּוּם: כַּמָּה צָרִיךְ לְהוֹסִיף לְ-${left} כְּדֵי לְהַגִּיעַ לְ-${target}?`,
          right,
          ["number-bonds", "addition"],
          difficulty,
          exerciseIndex === 1 ? "concrete" : exerciseIndex === 2 ? "pictorial" : "abstract",
          0,
          target,
        );
      })();
    case "multiplication-tables": {
      const f = 2 + (seed % 4);
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        `חִימּוּם: חַשְּׁבוּ ${f} + ${f} + ${f} (שָׁלוֹשׁ פְּעָמִים ${f})`,
        f * 3,
        ["multiplication-tables", "multiplication-intro"],
        difficulty,
        "abstract",
        0,
        40,
      );
    }
    case "division-equal-groups": {
      const perGroup = 3 + (seed % 5);
      const total = perGroup * 2;
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        `חִימּוּם: חִלְּקוּ ${total} לִשְׁתֵּי קְבוּצוֹת שָׁווֹת. כַּמָּה בְּכָל קְבוּצָה?`,
        perGroup,
        ["division-equal-groups"],
        difficulty,
        "pictorial",
        0,
        20,
      );
    }
    case "fractions-parts":
      return multipleChoice(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: כַּמָּה רְבָעִים יֵשׁ בְּשָׁלֵם אֶחָד?",
        ["2", "3", "4"],
        "4",
        ["fractions-parts"],
        difficulty,
        "concrete",
      );
    case "measurement-area":
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: רִשְׁתּוֹת 3 עַל 2 רִיבּוּעִים קְטַנִּים — כַּמָּה רִיבּוּעִים בַּסַּךְ?",
        6,
        ["measurement-area", "multiplication-intro"],
        difficulty,
        "pictorial",
        0,
        30,
      );
    case "measurement-weight":
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: 2 ק״ג וְעוֹד 3 ק״ג — כַּמָּה ק״ג בַּסַּךְ?",
        5,
        ["measurement-weight", "addition"],
        difficulty,
        "concrete",
        0,
        20,
      );
    case "geometry-solids":
      return multipleChoice(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: לְאֵיזֶה גּוּף יֵשׁ תָּמִיד 6 פָּנִים שֶׁכֻּלָּם רִיבּוּעִים?",
        ["קוּבִּיָּה", "כַּד", "חֲרוּט"],
        "קוּבִּיָּה",
        ["geometry-solids"],
        difficulty,
        "concrete",
      );
    case "money-shekel":
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: מַטְבֵּעַ 5 שְׁקָלִים וְעוֹד מַטְבֵּעַ 2 שְׁקָלִים — כַּמָּה בַּסַּךְ?",
        7,
        ["money-shekel", "addition"],
        difficulty,
        "concrete",
        0,
        20,
      );
    default:
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: חַשְּׁבוּ 4 + 5",
        9,
        ["addition"],
        difficulty,
        "abstract",
        0,
        20,
      );
  }
};

const buildSpiralWarmupExercises = (
  concept: DayConcept,
  priorConcepts: DayConcept[],
  dayDifficulty: DifficultyLevel,
): Exercise[] => {
  const tags = pickWarmupSkillTags(concept, priorConcepts);
  return tags.map((tag, i) => warmupExerciseForTag(concept.dayNumber, i + 1, tag, dayDifficulty));
};

const concepts: DayConcept[] = [
  {
    dayNumber: 1,
    title: "מוֹנִים עַד 5",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִסְפֹּר אוֹבְיֶקְטִים עַד 5 וּלְזַהוֹת אֶת הַכַּמּוּת הַנְּכוֹנָה בְּ-5 מִתּוֹךְ 6 מְשִׂימוֹת.",
    mainTags: ["counting", "number-recognition"],
    spiralReviewTags: ["counting"],
    arithmeticPrompt: "בְּסַל יֵשׁ 2 תַּפּוּחִים. אִמָּא הוֹסִיפָה עוֹד תַּפּוּחַ. כַּמָּה תַּפּוּחִים יֵשׁ עַכְשָׁיו?",
    arithmeticAnswer: 3,
    arithmeticMcOptions: ["2", "3", "4"],
    arithmeticMcAnswer: "3",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 4",
    verbalAnswer: "אַרְבַּע",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 5 גָּדוֹל מִ-2",
    reviewAnswer: true,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-1 עַד 5, כָּל פַּעַם צַעַד אֶחָד קָדִימָה. כַּמָּה צְעָדִים עָשִׂינוּ?",
    challengeAnswer: 4,
    geometryPrompt: "אֵיזוֹ צוּרָה הִיא עִיגּוּל?",
    geometryAnswer: "circle",
  },
  {
    dayNumber: 2,
    title: "מוֹנִים עַד 10",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִסְפֹּר, לִקְרֹא וְלִכְתּוֹב מִסְפָּרִים 0–10 בְּ-80% הַצְלָחָה.",
    mainTags: ["counting", "number-recognition", "addition"],
    spiralReviewTags: ["counting", "number-recognition"],
    arithmeticPrompt: "בְּקֻפְסָּה הָיוּ 4 כַּדּוּרִים. הוֹסַפְנוּ עוֹד 2 כַּדּוּרִים. כַּמָּה כַּדּוּרִים יֵשׁ עַכְשָׁיו בַּקֻּפְסָּה?",
    arithmeticAnswer: 6,
    arithmeticMcOptions: ["5", "6", "7"],
    arithmeticMcAnswer: "6",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 7",
    verbalAnswer: "שֶׁבַע",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 3 קָטָן מִ-9",
    reviewAnswer: true,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-0 עַד 10, קוֹפְצִים בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת עוֹשִׂים?",
    challengeAnswer: 5,
    geometryPrompt: "אֵיזוֹ צוּרָה הִיא רִיבּוּעַ?",
    geometryAnswer: "square",
  },
  {
    dayNumber: 3,
    title: "חִיבּוּר עַד 10",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִפְתּוֹר תַּרְגִּילֵי חִיבּוּר עַד 10 בְּ-4 מִתּוֹךְ 5 מְשִׂימוֹת.",
    mainTags: ["addition", "number-line"],
    spiralReviewTags: ["counting", "number-recognition"],
    arithmeticPrompt: "בְּמִגְרָשׁ שִׂיחֲקוּ 5 יְלָדִים. הִצְטָרְפוּ עוֹד 3. כַּמָּה יְלָדִים שִׂיחֲקוּ בַּסַּךְ הַכֹּל?",
    arithmeticAnswer: 8,
    arithmeticMcOptions: ["7", "8", "9"],
    arithmeticMcAnswer: "8",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 8",
    verbalAnswer: "שְׁמוֹנֶה",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 6 + 1 = 7",
    reviewAnswer: true,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מַתְחִילִים בְּ-2 וּמְדַלְּגִים בְּ-2 עַד 10. כַּמָּה דִּלּוּגִים עָשִׂינוּ?",
    challengeAnswer: 4,
  },
  {
    dayNumber: 4,
    title: "חִיסּוּר עַד 10",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִפְתּוֹר תַּרְגִּילֵי חִיסּוּר עַד 10 בְּ-4 מִתּוֹךְ 5 מְשִׂימוֹת.",
    mainTags: ["subtraction", "addition"],
    spiralReviewTags: ["addition", "number-line"],
    arithmeticPrompt: "הָיוּ 9 בָּלוֹנִים בַּמְּסִיבָּה. פָּרְחוּ 4. כַּמָּה בָּלוֹנִים נִשְׁאֲרוּ?",
    arithmeticAnswer: 5,
    arithmeticMcOptions: ["4", "5", "6"],
    arithmeticMcAnswer: "5",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 5",
    verbalAnswer: "חָמֵשׁ",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 10 - 3 = 8",
    reviewAnswer: false,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מַתְחִילִים בְּ-10 וְיוֹרְדִים בְּ-2 עַד 2. כַּמָּה דִּלּוּגִים לְאָחוֹר עָשִׂינוּ?",
    challengeAnswer: 4,
  },
  {
    dayNumber: 5,
    title: "הַשְׁוָאַת מִסְפָּרִים",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְהַשְׁווֹת זוּגוֹת מִסְפָּרִים עַד 20 וּלְזַהוֹת מִי גָּדוֹל, מִי קָטָן וּמִי שָׁוֶה בְּ-80% הַצְלָחָה.",
    mainTags: ["comparing", "number-recognition"],
    spiralReviewTags: ["addition", "subtraction"],
    arithmeticPrompt: "אֵיזֶה מִסְפָּר גָּדוֹל יוֹתֵר: 14 אוֹ 11? כִּתְבוּ אֶת הַמִּסְפָּר הַגָּדוֹל.",
    arithmeticAnswer: 14,
    arithmeticMcOptions: ["14", "11", "שָׁוִים"],
    arithmeticMcAnswer: "14",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 10",
    verbalAnswer: "עֶשֶׂר",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 9 גָּדוֹל מִ-13",
    reviewAnswer: false,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-6 עַד 16 בִּקְפִיצוֹת שֶׁל 2. שִׂימוּ לֵב — הַמִּסְפָּרִים שֶׁנּוֹגְעִים הֵם זוּגִיִּים! כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 5,
  },
  {
    dayNumber: 6,
    title: "חִיבּוּר וְחִיסּוּר עַד 20",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִפְתּוֹר תַּרְגִּילֵי חִיבּוּר וְחִיסּוּר מְעוֹרָבִים עַד 20 בְּ-4 מִתּוֹךְ 5 מְשִׂימוֹת.",
    mainTags: ["addition", "subtraction", "number-line"],
    spiralReviewTags: ["comparing", "addition"],
    arithmeticPrompt: "בְּכִיתָּה יֵשׁ 12 בָּנִים וְ-5 בָּנוֹת. כַּמָּה יְלָדִים יֵשׁ בַּסַּךְ הַכֹּל?",
    arithmeticAnswer: 17,
    arithmeticMcOptions: ["16", "17", "18"],
    arithmeticMcAnswer: "17",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 12",
    verbalAnswer: "שְׁתֵּים עֶשְׂרֵה",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 18 - 7 = 11",
    reviewAnswer: true,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-1 עַד 11 בִּקְפִיצוֹת שֶׁל 2. שִׂימוּ לֵב — אֵלּוּ מִסְפָּרִים אי-זוּגִיִּים! כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 5,
  },
  {
    dayNumber: 7,
    title: "בְּעָיוֹת מִילּוּלִיּוֹת פְּשׁוּטוֹת",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִקְרֹא בְּעִיָּה מִילּוּלִית, לְזַהוֹת אֶת הַפְּעוּלָה וְלִפְתּוֹר 3 מִתּוֹךְ 4 בְּעָיוֹת חַד-שְׁלָבִיּוֹת.",
    mainTags: ["word-problems", "addition", "subtraction"],
    spiralReviewTags: ["number-line", "comparing"],
    arithmeticPrompt: "לְדָנָה הָיוּ 7 מַדְבֵּקוֹת. בְּיוֹם הַהוּלֶּדֶת קִבְּלָה עוֹד 6 מַדְבֵּקוֹת. כַּמָּה מַדְבֵּקוֹת יֵשׁ לָהּ עַכְשָׁיו?",
    arithmeticAnswer: 13,
    arithmeticMcOptions: ["12", "13", "14"],
    arithmeticMcAnswer: "13",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 13",
    verbalAnswer: "שְׁלוֹשׁ עֶשְׂרֵה",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: אִם יֵשׁ 15 עוּגִיּוֹת וְאָכְלוּ 5, נִשְׁאָרוֹת 10 עוּגִיּוֹת",
    reviewAnswer: true,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-3 עַד 13 בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת עָשִׂינוּ?",
    challengeAnswer: 5,
  },
  {
    dayNumber: 8,
    title: "צוּרוֹת וְגוּפִים בְּסִיסִיִּים",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְזַהוֹת עִיגּוּל, רִיבּוּעַ, מְשֻׁלָּשׁ וּמַלְבֵּן וּלְתָאֵר תְּכוּנָה אַחַת שֶׁל כָּל צוּרָה בְּ-80% הַצְלָחָה.",
    mainTags: ["geometry-shapes", "comparing"],
    spiralReviewTags: ["word-problems", "addition"],
    arithmeticPrompt: "לְכָל מְשֻׁלָּשׁ יֵשׁ 3 צְלָעוֹת. אִם יֵשׁ לָנוּ שְׁנֵי מְשֻׁלָּשִׁים, כַּמָּה צְלָעוֹת יֵשׁ בַּסַּךְ הַכֹּל?",
    arithmeticAnswer: 6,
    arithmeticMcOptions: ["5", "6", "7"],
    arithmeticMcAnswer: "6",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 6",
    verbalAnswer: "שֵׁשׁ",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: לְכָל מַלְבֵּן יֵשׁ תָּמִיד בְּדִיּוּק 4 צְלָעוֹת",
    reviewAnswer: true,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-4 עַד 14 בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת עָשִׂינוּ?",
    challengeAnswer: 5,
    geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ בְּדִיּוּק 3 צְלָעוֹת?",
    geometryAnswer: "triangle",
  },
  {
    dayNumber: 9,
    title: "דְּפוּסִים, זוּגִי וְאִי-זוּגִי",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְהַשְׁלִים סִדְרוֹת מִסְפָּרִיּוֹת וּלְזַהוֹת מִסְפָּרִים זוּגִיִּים וְאִי-זוּגִיִּים עַד 20 בְּ-4 מִתּוֹךְ 5 מְשִׂימוֹת.",
    mainTags: ["patterns", "number-line"],
    spiralReviewTags: ["geometry-shapes", "word-problems"],
    arithmeticPrompt: "הַשְׁלִימוּ אֶת הַסִּדְרָה הַזּוּגִית: 2, 4, 6, __",
    arithmeticAnswer: 8,
    arithmeticMcOptions: ["7", "8", "10"],
    arithmeticMcAnswer: "8",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 14",
    verbalAnswer: "אַרְבַּע עֶשְׂרֵה",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: הַמִּסְפָּר 6 הוּא זוּגִי (אֶפְשָׁר לְחַלְּקוֹ לִשְׁתֵּי קְבוּצוֹת שָׁווֹת)",
    reviewAnswer: true,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-5 עַד 15 בִּקְפִיצוֹת שֶׁל 5. שִׂימוּ לֵב — אֵלּוּ מִסְפָּרִים אִי-זוּגִיִּים! כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 2,
  },
  {
    dayNumber: 10,
    title: "עֵרֶךְ הַמָּקוֹם בַּעֲשָׂרוֹת",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְזַהוֹת אֶת מִסְפַּר הָעֲשָׂרוֹת וְהָאֲחָדוֹת בְּכָל מִסְפָּר עַד 99 בְּ-80% הַצְלָחָה.",
    mainTags: ["place-value", "number-recognition"],
    spiralReviewTags: ["patterns", "subtraction"],
    arithmeticPrompt: "בְּכִיתָּה יֵשׁ 34 יְלָדִים. הַמּוֹרָה אוֹמֶרֶת: 34 = 3 עֲשָׂרוֹת + 4 אֲחָדוֹת. כַּמָּה עֲשָׂרוֹת יֵשׁ בַּמִּסְפָּר 34?",
    arithmeticAnswer: 3,
    arithmeticMcOptions: ["3", "4", "7"],
    arithmeticMcAnswer: "3",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 20",
    verbalAnswer: "עֶשְׂרִים",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: בַּמִּסְפָּר 52 יֵשׁ 5 עֲשָׂרוֹת וּ-2 אֲחָדוֹת",
    reviewAnswer: true,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-10 עַד 30 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת עָשִׂינוּ?",
    challengeAnswer: 4,
  },
  {
    dayNumber: 11,
    title: "חִיבּוּר בַּעֲשָׂרוֹת",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְחַבֵּר עֲשָׂרוֹת שְׁלֵמוֹת (לְמָשָׁל 30 + 20) בְּ-4 מִתּוֹךְ 5 מְשִׂימוֹת.",
    mainTags: ["addition", "place-value"],
    spiralReviewTags: ["place-value", "patterns"],
    arithmeticPrompt: "לְרוֹנִי יֵשׁ 30 מַדְבֵּקוֹת, לְמֵיַי יֵשׁ 20. כַּמָּה מַדְבֵּקוֹת יֵשׁ לָהֶם יַחַד?",
    arithmeticAnswer: 50,
    arithmeticMcOptions: ["40", "50", "60"],
    arithmeticMcAnswer: "50",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 50",
    verbalAnswer: "חֲמִישִּׁים",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 40 + 10 = 60",
    reviewAnswer: false,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-0 עַד 20 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת עָשִׂינוּ?",
    challengeAnswer: 4,
  },
  {
    dayNumber: 12,
    title: "חִיסּוּר בַּעֲשָׂרוֹת",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְהַחְסִיר עֲשָׂרוֹת שְׁלֵמוֹת (לְמָשָׁל 70 - 30) בְּ-80% הַצְלָחָה.",
    mainTags: ["subtraction", "place-value"],
    spiralReviewTags: ["addition", "place-value"],
    arithmeticPrompt: "בְּסַל הָיוּ 70 תַּפּוּזִים. מָכְרוּ 30. כַּמָּה תַּפּוּזִים נִשְׁאֲרוּ בַּסַּל?",
    arithmeticAnswer: 40,
    arithmeticMcOptions: ["30", "40", "50"],
    arithmeticMcAnswer: "40",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 40",
    verbalAnswer: "אַרְבָּעִים",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 90 - 40 = 50",
    reviewAnswer: true,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-50 יוֹרְדִים לְ-20 בִּקְפִיצוֹת שֶׁל 5 לְאָחוֹר. כַּמָּה קְפִיצוֹת עָשִׂינוּ?",
    challengeAnswer: 6,
  },
  {
    dayNumber: 13,
    title: "בְּעָיוֹת מִילּוּלִיּוֹת מִתְקַדְּמוֹת",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִזַהוֹת שְׁנֵי שְׁלָבִים בְּעִיָּה מִילּוּלִית וְלִפְתּוֹר 3 מִתּוֹךְ 4 בְּעָיוֹת כָּאֵלּוּ.",
    mainTags: ["word-problems", "addition", "subtraction"],
    spiralReviewTags: ["subtraction", "place-value"],
    arithmeticPrompt: "בַּכִּיתָּה הָיוּ 18 תַּלְמִידִים. 4 יָצְאוּ לַהַפְסָקָה, וְאַחַר כָּךְ 3 יְלָדִים חָזְרוּ. כַּמָּה יְלָדִים יֵשׁ בַּכִּיתָּה עַכְשָׁיו?",
    arithmeticAnswer: 17,
    arithmeticMcOptions: ["16", "17", "18"],
    arithmeticMcAnswer: "17",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 17",
    verbalAnswer: "שְׁבַע עֶשְׂרֵה",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: אִם הָיוּ 12 פֵּרוֹת וְנוֹסְפוּ עוֹד 8, יֵשׁ עַכְשָׁיו 20 פֵּרוֹת",
    reviewAnswer: true,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-7 עַד 27 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת שְׁלֵמוֹת עָשִׂינוּ?",
    challengeAnswer: 4,
  },
  {
    dayNumber: 14,
    title: "יוֹם סִיכּוּם וְהַטְמָעָה",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְהַפְגִּין מִגְוָן מִיּוֹמוּיוֹת מֵהַשָּׁבוּעַיִם וּלִפְתּוֹר מְשִׂימוֹת מְשֻׁלָּבוֹת בְּ-80% הַצְלָחָה.",
    mainTags: ["addition", "subtraction", "word-problems", "geometry-shapes", "place-value"],
    spiralReviewTags: ["addition", "subtraction", "word-problems", "geometry-shapes", "place-value"],
    arithmeticPrompt: "בַּחֲנוּת יֵשׁ 46 תַּפּוּחִים אֲדֻמִּים וְ-12 יְרֻקִּים. כַּמָּה תַּפּוּחִים יֵשׁ בַּחֲנוּת בַּסַּךְ הַכֹּל?",
    arithmeticAnswer: 58,
    arithmeticMcOptions: ["56", "58", "60"],
    arithmeticMcAnswer: "58",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 58",
    verbalAnswer: "חֲמִישִּׁים וּשְׁמוֹנֶה",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 64 - 20 = 44",
    reviewAnswer: true,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-8 עַד 28 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת שְׁלֵמוֹת עָשִׂינוּ?",
    challengeAnswer: 4,
    geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ בְּדִיּוּק 4 צְלָעוֹת שָׁווֹת?",
    geometryAnswer: "square",
  },
  {
    dayNumber: 15,
    title: "חִזּוּק: חִיבּוּר וְחִיסּוּר עַד 20",
    objective:
      "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְתַרְגֵּל חִיבּוּר וְחִיסּוּר בִּטְוַח עַד 20 בְּבִטָּחוֹן.",
    mainTags: ["addition", "subtraction"],
    spiralReviewTags: ["place-value", "word-problems", "number-line"],
    arithmeticPrompt: "בַּגַּן הָיוּ 14 יְלָדִים. עוֹד 5 הִצְטָרְפוּ. כַּמָּה יֵשׁ עַכְשָׁיו?",
    arithmeticAnswer: 19,
    arithmeticMcOptions: ["18", "19", "20"],
    arithmeticMcAnswer: "19",
    verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 17",
    verbalAnswer: "שְׁבַע עֶשְׂרֵה",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 12 + 8 = 20",
    reviewAnswer: true,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-3 עַד 13 בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 5,
    geometryPrompt: "אֵיזוֹ צוּרָה אֵין לָהּ פִּנּוֹת?",
    geometryAnswer: "circle",
  },
  {
    dayNumber: 16,
    title: "מְדִידַת אֹרֶךְ בְּסִיסִית",
    objective:
      "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְקַשֵּׁר סְפִירָה וַחֲלוּקָה פְּשׁוּטָה לְמִדַּת אֹרֶךְ (ס״מ) וּלְפָתוֹר מְשִׂימוֹת מְחוֹבֵרוֹת לָאֹרֶךְ.",
    mainTags: ["measurement-length", "counting"],
    spiralReviewTags: ["addition", "subtraction", "number-recognition"],
    arithmeticPrompt:
      "סַרְגֵּל בָּאֹרֶךְ 10 ס״מ. שָׂמִים אוֹתוֹ 3 פְּעָמִים זֶה אַחַר זֶה בְּקַו יָשָׁר. כַּמָּה ס״מ בַּסַּךְ הַכֹּל?",
    arithmeticAnswer: 30,
    arithmeticMcOptions: ["20", "30", "40"],
    arithmeticMcAnswer: "30",
    verbalPrompt: "כִּתְבוּ בִּמִילִים אֶת הַמִּסְפָּר: כַּמָּה ס״מ בִּשְׁלוֹשָׁה סַרְגְּלִים שֶׁל 10 ס״מ כָּל אֶחָד?",
    verbalAnswer: "שְׁלוֹשִׁים",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 15 ס״מ + 15 ס״מ = 30 ס״מ",
    reviewAnswer: true,
    challengePrompt:
      "עַל קַו מִסְפָּרִים לְהַמְחָשָׁה: מִ-0 עַד 30, כָּל קְפִיצָה הִיא 10 יְחִידוֹת. כַּמָּה קְפִיצוֹת עָשִׂינוּ?",
    challengeAnswer: 3,
    geometryPrompt: "אֵיזוֹ צוּרָה נִרְאֵית כְּמוֹ מִסְגֶּרֶת לָרִבּוּעַ?",
    geometryAnswer: "square",
  },
  {
    dayNumber: 17,
    title: "תִרְגּוּל: אֹרֶךְ וְחִיבּוּר ס״מ",
    objective:
      "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִתְרַגֵּל בְּחִיבּוּר אֹרְכִים בְּס״מ וְיִקְשֹׁר לִסְפִירָה.",
    mainTags: ["measurement-length", "addition"],
    spiralReviewTags: ["measurement-length", "counting"],
    arithmeticPrompt: "קִטְעַי ס״מ: אֶחָד בְּאֹרֶךְ 4 ס״מ וְעוֹד אֶחָד 5 ס״מ. כַּמָּה ס״מ בַּסַּךְ?",
    arithmeticAnswer: 9,
    arithmeticMcOptions: ["8", "9", "10"],
    arithmeticMcAnswer: "9",
    verbalPrompt: "כִּתְבוּ בִּמִילִים: כַּמָּה ס״מ בִּשְׁנֵי סַרְגְּלִים שֶׁל 6 ס״מ כָּל אֶחָד?",
    verbalAnswer: "שְׁתֵּים עֶשְׂרֵה",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 10 ס״מ + 10 ס״מ = 20 ס״מ",
    reviewAnswer: true,
    challengePrompt: "שְׁלוֹשָׁה קְטַעִים שֶׁל 3 ס״מ זֶה אַחַר זֶה — כַּמָּה ס״מ בַּסַּךְ?",
    challengeAnswer: 9,
    geometryPrompt: "אֵיזוֹ צוּרָה נִרְאֵית עֲגֻלָּה וְאֵין לָהּ פִּנּוֹת?",
    geometryAnswer: "circle",
  },
  {
    dayNumber: 18,
    title: "זְמַן וְשָׁעוֹן פָּשׁוּט",
    objective:
      "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִקְרֹא שָׁעָה שְׁלֵמָה בַּשָּׁעוֹן, לְהוֹסִיף שָׁעָה אַחַת בְּמוֹדֵל פָּשׁוּט, וּלְקַשֵּׁר לִמְסַפֵּר שָׁעוֹת.",
    mainTags: ["measurement-time", "number-recognition"],
    spiralReviewTags: ["measurement-length", "counting"],
    arithmeticPrompt:
      "הַשָּׁעוֹן מַרְאֶה אֶת הַשָּׁעָה אַרְבַּע. עוֹבֵר זְמַן שֶׁל שָׁעָה אַחַת. כַּמָּה הַשָּׁעָה עַכְשָׁיו?",
    arithmeticAnswer: 5,
    arithmeticMcOptions: ["4", "5", "6"],
    arithmeticMcAnswer: "5",
    verbalPrompt: "כִּתְבוּ בִּמִילִים: אֵיזוֹ שָׁעָה הִיא כְּשֶׁהַמַּחְצֵבֶת מַצִּיגָה 7 (בְּשָׁעוֹת שְׁלֵמוֹת בִּלְבַד)?",
    verbalAnswer: "שֶׁבַע",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: לְ-60 דַּקּוֹת קוֹרְאִים שָׁעָה אַחַת",
    reviewAnswer: true,
    challengePrompt:
      "עַל קַו מִסְפָּרִים: מִ-3 עַד 9, כָּל צַעַד הוּא שָׁעָה אַחַת קָדִימָה. כַּמָּה צְעָדִים עָשִׂינוּ?",
    challengeAnswer: 6,
  },
  {
    dayNumber: 19,
    title: "הַזָּזָה וְשִׁיקּוּף",
    objective:
      "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְהַבְדִּיל בֵּין הַזָּזָה (בְּלִי סִיבּוּב) לְבֵין שִׁיקּוּף, וְלִזְהוֹת צוּרָה סִימֶטְרִית שֶׁנִּשְׁאֶרֶת דּוֹמָה אַחֲרֵי שִׁיקּוּף אוֹפְקִי.",
    mainTags: ["symmetry-transform", "geometry-shapes"],
    spiralReviewTags: ["measurement-time", "number-recognition"],
    arithmeticPrompt:
      "עַל קַו מִסְפָּרִים מִסְפָּרִים נְקֻדּוֹת: מִ-5 עוֹבְרִים שְׁנֵי מָקוֹמוֹת יָמִינָה. בְּאֵיזֶה מִסְפָּר נֶעֱצְרִים?",
    arithmeticAnswer: 7,
    arithmeticMcOptions: ["6", "7", "8"],
    arithmeticMcAnswer: "7",
    verbalPrompt:
      "לְרִיבּוּעַ יֵשׁ אַרְבַּע צְלָעוֹת שָׁווֹת. אַחֲרֵי שִׁיקּוּף אוֹפְקִי — עוֹדֶנּוּ רִיבּוּעַ? כִּתְבוּ רַק: כֵּן אוֹ לֹא.",
    verbalAnswer: "כן",
    reviewPrompt:
      "אֱמֶת אוֹ שֶׁקֶר: הַזָּזָה לְצַד הִיא תָּמִיד מְשַׁנָּה אֶת גֹּדֶל הַצוּרָה",
    reviewAnswer: false,
    challengePrompt:
      "בְּרֶצֶף הַמִּסְפָּרִים: 4, 5, 6, 7 — מַזִּיזִים אֶת הָרִיבּוּעַ שֶׁעַל 6 שְׁנֵי מָקוֹמוֹת יָמִינָה. עַל אֵיזֶה מִסְפָּר הוּא עַכְשָׁיו?",
    challengeAnswer: 8,
    geometryPrompt:
      "אֵיזוֹ צוּרָה נִשְׁאֶרֶת 'אוֹתָהּ צוּרָה' (דּוֹמָה לְעַצְמָהּ) אַחֲרֵי שִׁיקּוּף אוֹפְקִי?",
    geometryAnswer: "square",
  },
  {
    dayNumber: 20,
    title: "צוּרוֹת וּמְצוּלָעִים — חֲזָרָה",
    objective:
      "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְזַהֶה צוּרוֹת וִיסְפּוֹר צְלָעוֹת בִּפְעִילוּיוֹת קְצָרוֹת.",
    mainTags: ["geometry-shapes", "comparing"],
    spiralReviewTags: ["symmetry-transform", "number-recognition"],
    arithmeticPrompt: "לִשְׁנֵי רִיבּוּעִים יֵשׁ בִּיחַד כַּמָּה צְלָעוֹת?",
    arithmeticAnswer: 8,
    arithmeticMcOptions: ["6", "8", "10"],
    arithmeticMcAnswer: "8",
    verbalPrompt: "כִּתְבוּ בְּמִילָה אַחַת: כַּמָּה צְלָעוֹת לִמְשֻׁלָּשׁ?",
    verbalAnswer: "שָׁלוֹשׁ",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: לְמַלְבֵּן יֵשׁ תָּמִיד 4 צְלָעוֹת",
    reviewAnswer: true,
    challengePrompt: "סִדְרָה: 10, 20, 30, __ — כִּתְבוּ אֶת הַמִּסְפָּר הַבָּא.",
    challengeAnswer: 40,
    geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ בְּדִיּוּק 3 צְלָעוֹת?",
    geometryAnswer: "triangle",
  },
  {
    dayNumber: 21,
    title: "גִּימַטְרְיָה — אוֹתִיּוֹת א'–י'",
    objective:
      "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְהַקְצוֹת עֶרֶךְ מִסְפָּרִי לְאוֹתִיּוֹת א'–י', לְחַבֵּר עֶרְכֵי אוֹתִיּוֹת קְטַנִּים, וּלְכַתּוֹב שֵׁמוֹת מִסְפָּרִים בַּעֲבֵרִית.",
    mainTags: ["gematria-letters", "number-recognition"],
    spiralReviewTags: ["geometry-shapes", "addition"],
    arithmeticPrompt:
      "בְּגִימַטְרְיָה פָּשׁוּטָה: חַשְּׁבוּ א (1) + ג (3)",
    arithmeticAnswer: 4,
    arithmeticMcOptions: ["3", "4", "5"],
    arithmeticMcAnswer: "4",
    verbalPrompt: "כִּתְבוּ בִּמִילִים אֶת הַמִּסְפָּר שֶׁל הָאוֹת ח (8):",
    verbalAnswer: "שְׁמוֹנֶה",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: בְּגִימַטְרְיָה, הָאוֹת י (10) גְּדוֹלָה מִן הָאוֹת ח (8)",
    reviewAnswer: true,
    challengePrompt:
      "חַשְּׁבוּ ב' (2) + ה' (5) + ג' (3)",
    challengeAnswer: 10,
    geometryPrompt: "אֵיזוֹ צוּרָה מוּזְכֶּרֶת לְעִתִּים בְּמוֹפַע שְׁלוֹשָׁה קְצָווֹת?",
    geometryAnswer: "triangle",
  },
  {
    dayNumber: 22,
    title: "כֶּפֶל כַּחֲזָרַת חִיבּוּר",
    objective:
      "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְהַבִּיעַ כֶּפֶל קָטָן (לְמָשָׁל 3×4) כְּחִיבּוּר חוֹזֵר וּלִפְתּוֹר בְּמִסְפָּרִים קְטַנִּים.",
    mainTags: ["multiplication-intro", "addition"],
    spiralReviewTags: ["patterns", "gematria-letters"],
    arithmeticPrompt:
      'חַשְּׁבוּ 4 + 4 + 4 (כְּלוֹמַר "שָׁלוֹשׁ פְּעָמִים אַרְבַּע")',
    arithmeticAnswer: 12,
    arithmeticMcOptions: ["10", "11", "12"],
    arithmeticMcAnswer: "12",
    verbalPrompt:
      "כִּתְבוּ בִּמִילִים אֶת הַתּוֹצָאָה: 5 + 5 + 5 + 5 (אַרְבַּע פְּעָמִים חָמֵשׁ):",
    verbalAnswer: "עֶשְׂרִים",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 2 × 6 שָׁוֶה לְ 6 + 6",
    reviewAnswer: true,
    challengePrompt:
      "עַל קַו מִסְפָּרִים: מִתְחִילִים בְּ-0 וְקוֹפְצִים בְּ-4 חָמֵשׁ פְּעָמִים. עַל אֵיזֶה מִסְפָּר נֶעֱצְרִים?",
    challengeAnswer: 20,
    geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ אַרְבַּע צְלָעוֹת שָׁווֹת וְאַרְבַּע פִּנּוֹת יְשָׁרוֹת?",
    geometryAnswer: "square",
  },
  {
    dayNumber: 23,
    title: "קִשְׁרֵי מִסְפָּר לְ-10",
    objective:
      "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְמָצֵא זוּגוֹת שֶׁמִּשְׁלִימִים לַ-10, לִפְתּוֹר חִסֵּר קָטָן בְּחִבּוּר עַד 10, וּלְשַׁנֵּן צִירוּפִים נִפְרָצִים.",
    mainTags: ["number-bonds", "addition"],
    spiralReviewTags: ["multiplication-intro", "subtraction"],
    arithmeticPrompt: "כַּמָּה צָרִיךְ לְהוֹסִיף לְ-7 כְּדֵי לְהַגִּיעַ לְ-10?",
    arithmeticAnswer: 3,
    arithmeticMcOptions: ["2", "3", "4"],
    arithmeticMcAnswer: "3",
    verbalPrompt: "כִּתְבוּ בִּמִילִים אֶת הַמִּסְפָּר שֶׁמִּשְׁלִים אֶת 4 לְ-10:",
    verbalAnswer: "שִׁשָּׁה",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 9 + 1 = 10",
    reviewAnswer: true,
    challengePrompt:
      "עַל קַו מִסְפָּרִים: מִ-10 חוֹזְרִים לְ-0 בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת עָשִׂינוּ?",
    challengeAnswer: 5,
    geometryPrompt: "אֵיזוֹ צוּרָה מַזְכִּירָה עִגּוּל חָלָק שֶׁאֵין לוֹ פִּנּוֹת?",
    geometryAnswer: "circle",
  },
  {
    dayNumber: 24,
    title: "מִסְפָּרִים עַד 50",
    objective:
      "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַשְׁוֶה וִיקַרְאָה מִסְפָּרִים בִּטְוַח עַד 50.",
    mainTags: ["number-recognition", "comparing"],
    spiralReviewTags: ["place-value", "patterns"],
    arithmeticPrompt: "אֵיזֶה גָּדוֹל יוֹתֵר: 47 אוֹ 39? כִּתְבוּ אֶת הַגָּדוֹל.",
    arithmeticAnswer: 47,
    arithmeticMcOptions: ["39", "47", "שָׁווִים"],
    arithmeticMcAnswer: "47",
    verbalPrompt: "כִּתְבוּ בִּמִילִים אֶת הַמִּסְפָּר: 44",
    verbalAnswer: "אַרְבָּעִים וְאַרְבַּע",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 50 גָּדוֹל מִ-49",
    reviewAnswer: true,
    challengePrompt: "הַשְׁלִימוּ: 40, 42, 44, __",
    challengeAnswer: 46,
    geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ 4 פִּנּוֹת יְשָׁרוֹת וְכָל הַצְלָעוֹת שָׁווֹת?",
    geometryAnswer: "square",
  },
  {
    dayNumber: 25,
    title: "מִסְפָּרִים עַד 100",
    objective:
      "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִזְהֶה עֲשָׂרוֹת וַאֲחָדוֹת בִּמִסְפָּרִים עַד 100.",
    mainTags: ["place-value", "number-recognition"],
    spiralReviewTags: ["comparing", "patterns"],
    arithmeticPrompt: "בַּמִּסְפָּר 73 כַּמָּה עֲשָׂרוֹת יֵשׁ?",
    arithmeticAnswer: 7,
    arithmeticMcOptions: ["3", "7", "73"],
    arithmeticMcAnswer: "7",
    verbalPrompt: "כִּתְבוּ בִּמִילִים: 90",
    verbalAnswer: "תִּשְׁעִים",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: בַּמִּסְפָּר 88 יֵשׁ 8 אֲחָדוֹת",
    reviewAnswer: true,
    challengePrompt: "עַל קַו מִסְפָּרִים: מִ-60 עַד 80 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 4,
    geometryPrompt: "אֵיזוֹ צוּרָה אֲרוּכָּה (כְּמוֹ דֶּלֶת) וְיֵשׁ לָהּ 4 צְלָעוֹת?",
    geometryAnswer: "rectangle",
  },
  {
    dayNumber: 26,
    title: "סִיכּוּם הַשְׁלָמָה",
    objective:
      "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִשַׁזֵּר רַעֲיוֹנוֹת מֵהַחֹמֶר שֶׁנִּלְמַד — מִדִּידָה, זְמַן, סִימֶטְרְיָה, גִּימַטְרְיָה, כֶּפֶל כַּחִיבּוּר חוֹזֵר וּקְשָׁרִים לַ-10.",
    mainTags: [
      "measurement-length",
      "measurement-time",
      "symmetry-transform",
      "gematria-letters",
      "multiplication-intro",
      "number-bonds",
    ],
    spiralReviewTags: ["place-value", "word-problems", "geometry-shapes", "patterns"],
    arithmeticPrompt:
      "שְׁנֵי קֻפְסָאוֹת שְׁקֵנִים: אָרְכָּן שֶׁל כָּל אַחַת 8 ס״מ וְהֵן מְסוּדָּרוֹת זוֹ אָחֲרֵי זוֹ בְּקַו. כַּמָּה ס״מ בַּסַּךְ הַכֹּל?",
    arithmeticAnswer: 16,
    arithmeticMcOptions: ["14", "16", "18"],
    arithmeticMcAnswer: "16",
    verbalPrompt:
      "כִּתְבוּ בִּמִילִים: כַּמָּה צָרִיךְ לְהַחְסִיר מִ-18 כְּדֵי לְהַגִּיעַ לְ-10?",
    verbalAnswer: "שְׁמוֹנֶה",
    reviewPrompt:
      "אֱמֶת אוֹ שֶׁקֶר: רִיבּוּעַ נִשְׁאָר דּוֹמֶה לְעַצְמוֹ אַחֲרֵי שִׁיקּוּף אוֹפְקִי",
    reviewAnswer: true,
    challengePrompt:
      "גִּימַטְרְיָה: חַשְּׁבוּ ד (4) + ו (6), וְאָז הַחְסִירוּ 3. מָה הַמִּסְפָּר הַסּוֹפִי?",
    challengeAnswer: 7,
    geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ שָׁלוֹשׁ צְלָעוֹת?",
    geometryAnswer: "triangle",
  },
  {
    dayNumber: 27,
    title: "בְּעָיוֹת מִילּוּלִיּוֹת מְשֻׁלָּבוֹת",
    objective:
      "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִקְרַא בְּעָיָה בִּשְׁנֵי שְׁלָבִים פְּשׁוּטִים וְיִפְתֹּר.",
    mainTags: ["word-problems", "addition", "subtraction"],
    spiralReviewTags: ["place-value", "number-line"],
    arithmeticPrompt: "בַּגַּן הָיוּ 16 כַּדּוּרִים. 7 נִלְקְחוּ, וְאַחַר כָּךְ הוּבְאוּ עוֹד 5. כַּמָּה כַּדּוּרִים יֵשׁ עַכְשָׁיו?",
    arithmeticAnswer: 14,
    arithmeticMcOptions: ["13", "14", "15"],
    arithmeticMcAnswer: "14",
    verbalPrompt:
      "כְּשֶׁכָּתוּב 'נִשְׁאֲרוּ' אַחֲרֵי שֶׁיֹּדְעִים כַּמָּה הָיוּ בַּהַתְחָלָה — כִּתְבוּ: חִיבּוּר אוֹ חִיסּוּר.",
    verbalAnswer: "חִיסּוּר",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 20 + 10 - 5 = 25",
    reviewAnswer: true,
    challengePrompt: "נַעַר קִבֵּל 9 מַדְבֵּקוֹת, הִפְסִיד 4, וְקִבֵּל עוֹד 6. כַּמָּה יֵשׁ לוֹ עַכְשָׁיו?",
    challengeAnswer: 11,
    geometryPrompt: "אֵיזוֹ צוּרָה לְרֹב יֵשׁ לָהּ 4 צְלָעוֹת?",
    geometryAnswer: "rectangle",
  },
  {
    dayNumber: 28,
    title: "סִיכּוּם לִפְנֵי הַמִּבְחָן",
    objective:
      "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַרְגִּישׁ בִּטָּחוֹן בְּחִיבּוּר, חִיסּוּר, מִסְפָּרִים עַד 100 וּבְעָיוֹת קְצָרוֹת.",
    mainTags: ["addition", "subtraction", "word-problems", "place-value"],
    spiralReviewTags: ["geometry-shapes", "measurement-length", "patterns", "number-line"],
    arithmeticPrompt: "חֲנוּת מָכְרָה 35 עוּגִיּוֹת בַּבֹּקֶר וְ-40 נוֹסָפוֹת בַּמָּשֵׁךְ הַיּוֹם. כַּמָּה בַּסַּךְ?",
    arithmeticAnswer: 75,
    arithmeticMcOptions: ["65", "75", "85"],
    arithmeticMcAnswer: "75",
    verbalPrompt: "כִּתְבוּ בִּמִילִים: 65",
    verbalAnswer: "שִׁשִּׁים וְחָמֵשׁ",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 10 עֲשָׂרוֹת הֵן 100",
    reviewAnswer: true,
    challengePrompt: "מִ-100 יוֹרְדִים 25 וְאַחַר כָּךְ עוֹד 15. כַּמָּה נִשְׁאַר?",
    challengeAnswer: 60,
    geometryPrompt: "אֵיזוֹ צוּרָה מַזְכִּירָה טְבַעַת?",
    geometryAnswer: "circle",
  },
  {
    dayNumber: 29,
    title: "מִבְחָן מְסַכֵּם — כִּיתָּה א׳",
    objective:
      "בְּסוֹף הַמִּבְחָן הַתַּלְמִיד/ה יַרְאֶה שְׁלִיטָה בְּחוֹמֶר שֶׁנִּלְמַד בְּכִיתָּה א׳ — בִּשְׁאֵלוֹת מִבַּנְק שֶׁמִּתְחַלֵּף.",
    mainTags: [
      "counting",
      "number-recognition",
      "number-line",
      "addition",
      "subtraction",
      "comparing",
      "word-problems",
      "geometry-shapes",
      "patterns",
      "place-value",
      "measurement-length",
      "measurement-time",
      "symmetry-transform",
      "gematria-letters",
      "multiplication-intro",
      "number-bonds",
    ],
    spiralReviewTags: ["addition", "subtraction", "counting", "number-recognition", "number-line"],
    arithmeticPrompt: "מִבְחָן מְסַכֵּם: מַתְחִילִים!",
    arithmeticAnswer: 0,
    arithmeticMcOptions: ["0", "1", "2"],
    arithmeticMcAnswer: "0",
    verbalPrompt: "כִּתְבוּ בְּמִילִים: 10",
    verbalAnswer: "עֶשֶׂר",
    reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 10 גָּדוֹל מִ-9",
    reviewAnswer: true,
    challengePrompt: "מִבְחָן מְסַכֵּם: בּוֹחֲרִים שְׁאֵלוֹת מִבַּנְק.",
    challengeAnswer: 0,
    geometryPrompt: "אֵיזוֹ צוּרָה הִיא מְשֻׁלָּשׁ?",
    geometryAnswer: "triangle",
  },
];

const buildExpandedExercisesForDay = (
  concept: DayConcept,
  dayDifficulty: DifficultyLevel,
  priorConcepts: DayConcept[],
): Section[] => {
  const d = concept.dayNumber;
  const base = 10 + d * 2;
  const dayCue = `לְנוֹשֵׂא ${concept.title}`;

  return [
    {
      id: toSectionId(d, 1),
      title: "חִימּוּם וַחֲזָרַת סְפִּירָלָה",
      type: "warmup",
      learningGoal: "לְהַתְחִיל בְּהַצְלָחָה וּלְחַזֵּק נוֹשְׂאִים מִיָּמִים קוֹדְמִים בְּ-3–4 תַּרְגּוּלִים קְצָרִים.",
      prerequisiteSkillTags: concept.spiralReviewTags,
      exercises: buildSpiralWarmupExercises(concept, priorConcepts, dayDifficulty),
    },
    {
      id: toSectionId(d, 2),
      title: "מוּשָׂג הַיּוֹם - מִתְנַסִּים",
      type: "arithmetic",
      learningGoal: "לְהַעֲמִיק בַּמּוּשָׂג בְּדִרְגּוּת קֹשִׁי עוֹלָה.",
      prerequisiteSkillTags: concept.mainTags,
      example: (() => {
        if (d === 8) return {
          title: "דֻּגְמָה פְּתוּרָה — צוּרוֹת",
          prompt: "לְמְשֻׁלָּשׁ יֵשׁ 3 צְלָעוֹת. לְרִבּוּעַ יֵשׁ 4 צְלָעוֹת.",
          steps: [
            "מְזַהִים כַּמָּה צְלָעוֹת יֵשׁ לְכָל צוּרָה.",
            "לְמְשֻׁלָּשׁ = 3 צְלָעוֹת, לְרִבּוּעַ = 4 צְלָעוֹת.",
            "סוֹפְרִים אֶת הַצְּלָעוֹת כְּדֵי לְזַהוֹת אֶת הַצּוּרָה.",
          ],
          takeaway: "כָּל צוּרָה מְזוּהָה לְפִי מִסְפַּר הַצְּלָעוֹת שֶׁלָּהָ.",
        };
        if (d === 9) return {
          title: "דֻּגְמָה פְּתוּרָה — זוּגִי וְאִי-זוּגִי",
          prompt: "הַמִּסְפָּר 6 — זוּגִי אוֹ אִי-זוּגִי?",
          steps: [
            "מְסַדְּרִים 6 עֲצָמִים בִּשְׁנֵי טוּרִים שָׁוִים.",
            "6 = 3 + 3, כָּל טוּר שָׁוֶה — אֵין שְׁאָרִית.",
            "לָכֵן 6 הוּא מִסְפָּר זוּגִי.",
          ],
          takeaway: "מִסְפָּר זוּגִי הוּא מִסְפָּר שֶׁאֶפְשָׁר לְחַלֵּק לִשְׁתֵּי קְבוּצוֹת שָׁווֹת.",
        };
        if (d === 10) return {
          title: "דֻּגְמָה פְּתוּרָה — עֶרֶךְ מָקוֹם",
          prompt: "בַמִּסְפָּר 47, כַמָּה עֲשָׂרוֹת וְכַמָּה אֲחָדוֹת?",
          steps: [
            "47 = 40 + 7.",
            "הַסִּפְרָה 4 בְמָקוֹם הָעֲשָׂרוֹת = 4 עֲשָׂרוֹת = 40.",
            "הַסִּפְרָה 7 בְמָקוֹם הָאֲחָדוֹת = 7 אֲחָדוֹת.",
          ],
          takeaway: "הַסִּפְרָה מִשְּׂמֹאל מַצִּיגָה עֲשָׂרוֹת, הַסִּפְרָה מִיָּמִין מַצִּיגָה אֲחָדוֹת.",
        };
        if (d === 11) return {
          title: "דֻּגְמָה פְּתוּרָה — חִיבּוּר עֲשָׂרוֹת",
          prompt: "חַשְּׁבוּ 30 + 40",
          steps: [
            "30 = 3 עֲשָׂרוֹת, 40 = 4 עֲשָׂרוֹת.",
            "3 עֲשָׂרוֹת + 4 עֲשָׂרוֹת = 7 עֲשָׂרוֹת = 70.",
            "בּוֹדְקִים: 30 + 40 = 70.",
          ],
          takeaway: "בְּחִיבּוּר עֲשָׂרוֹת שְׁלֵמוֹת, מְחַבְּרִים רַק אֶת הָעֲשָׂרוֹת וְמוֹסִיפִים אֶפֶס.",
        };
        if (d === 12) return {
          title: "דֻּגְמָה פְּתוּרָה — חִיסּוּר עֲשָׂרוֹת",
          prompt: "חַשְּׁבוּ 80 - 30",
          steps: [
            "80 = 8 עֲשָׂרוֹת, 30 = 3 עֲשָׂרוֹת.",
            "8 עֲשָׂרוֹת - 3 עֲשָׂרוֹת = 5 עֲשָׂרוֹת = 50.",
            "בּוֹדְקִים: 80 - 30 = 50.",
          ],
          takeaway: "בְּחִיסּוּר עֲשָׂרוֹת שְׁלֵמוֹת, מַחְסִירִים רַק אֶת הָעֲשָׂרוֹת.",
        };
        if (d === 13) return {
          title: "דֻּגְמָה פְּתוּרָה — בְּעִיָּה בִּשְׁנֵי שְׁלָבִים",
          prompt: "הָיוּ 15 יְלָדִים. 4 הָלְכוּ הַבַּיְתָה וְ-3 הִצְטַּרְפוּ. כַמָּה עַכְשָׁיו?",
          steps: [
            "שָׁלָב 1: 15 - 4 = 11 יְלָדִים נִשְׁאֲרוּ.",
            "שָׁלָב 2: 11 + 3 = 14 יְלָדִים עַכְשָׁיו.",
            "בּוֹדְקִים: הַתּוֹצָאָה הִגְיוֹנִית?",
          ],
          takeaway: "בְּבְּעִיָּה בִּשְׁנֵי שְׁלָבִים — פּוֹתְרִים שָׁלָב אַחַר שָׁלָב, לְפִי הַסֵּדֶר.",
        };
        // d === 14 — review day
        return {
          title: "דֻּגְמָה פְּתוּרָה — חִישּּׁוּב מִשֻֻׁלָּב",
          prompt: `דֻּגְמָה: חַשְּׁבוּ ${base} + 10`,
          steps: [
            `קוֹרְאִים אֶת הַתַּרְגִּיל: ${base} + 10.`,
            `מוֹסִיפִים עֲשָׂרָה לְ-${base} וּמְקַבְּלִים ${base + 10}.`,
            "בּוֹדְקִים שֶׁהַתְּשׁוּבָה הִגְיוֹנִית.",
          ],
          takeaway: "כְּשֶׁמּוֹסִיפִים 10, סְפָרַת הָעֲשָׂרוֹת עוֹלָה בְּ-1.",
        };
      })(),
      exercises: [
        // Variation mini-sequence (China/Germany-inspired): same structure, different unknown position.
        numberInput(
          d,
          2,
          1,
          `דֻּגְמָה: ${base} + 10 = ${base + 10}. עַכְשָׁיו חַשְּׁבוּ ${base + 2} + 10`,
          base + 12,
          ["addition", ...concept.mainTags],
          dayDifficulty,
          "concrete",
        ),
        numberInput(
          d,
          2,
          2,
          `כַּמָּה צָרִיךְ לְהוֹסִיף לְ-10 כְּדֵי לְהַגִּיעַ לְ-${base + 12}?`,
          base + 2,
          ["addition", "place-value", ...concept.mainTags],
          dayDifficulty,
          "pictorial",
          0,
          200,
        ),
        multipleChoice(
          d,
          2,
          3,
          `כַּמָּה צָרִיךְ לְהוֹסִיף לְ-${base + 2} כְּדֵי לְהַגִּיעַ לְ-${base + 12}?`,
          ["8", "9", "10"],
          "10",
          ["number-bonds", "addition", ...concept.mainTags],
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          2,
          4,
          `חַשְּׁבוּ: ${base + 20} - ${d}`,
          base + 20 - d,
          ["subtraction"],
          dayDifficulty,
          "abstract",
        ),
        numberLineJump(
          d,
          2,
          5,
          `עַל קַו הַמִּסְפָּרִים בְּ${dayCue}: מֵ-5 עַד 30 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת נִדְרָשׁוֹת?`,
          5,
          30,
          5,
          5,
          ["number-line", "patterns"],
          dayDifficulty,
          "abstract",
        ),
        trueFalse(
          d,
          2,
          6,
          `הַאִם נָכוֹן: ${base + 30} - 20 = ${base + 10}?`,
          true,
          ["subtraction", "place-value"],
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          2,
          7,
          d === 8
            ? "לְמְרֻבָּע יֵשׁ 4 צְלָעוֹת. לְ-4 מְרֻבָּעִים יֵשׁ כַּמָּה צְלָעוֹת?"
            : d === 9
              ? "הַשְׁלִימוּ סִדְרָה: 6, 12, 18, __"
              : d === 10
                ? "בַּמִּסְפָּר 68 כַּמָּה עֲשָׂרוֹת יֵשׁ?"
                : d === 11
                  ? "כַּמָּה מְקַבְּלִים בְּחִיבּוּר 40 + 40?"
                  : d === 12
                    ? "מָה הַתּוֹצָאָה שֶׁל 90 - 20?"
                    : d === 13
                      ? "פִּתְרוּ שְׁנֵי שְׁלָבִים: 15 + 5 וְאָז מִנּוּ פָּחוֹת 8."
                      : "חַשְּׁבוּ בְּסֵדֶר: 72 - 12.",
          d === 8 ? 16 : d === 9 ? 24 : d === 10 ? 6 : d === 11 ? 80 : d === 12 ? 70 : d === 13 ? 12 : 60,
          concept.mainTags,
          dayDifficulty,
          "abstract",
        ),
        multipleChoice(
          d,
          2,
          8,
          d === 8
            ? "אֵיזוֹ צוּרָה מְתָאִימָה לְשֵׁם 'מְשֻׁלָּשׁ'?"
            : d === 9
              ? "אֵיזוֹ סִדְרָה עוֹלָה בְּ-5 כָּל פַּעַם?"
              : d === 10
                ? "בַּמִּסְפָּר 54, מַה מִסְפַּר הָאֲחָדוֹת?"
                : d === 11
                  ? "אֵיזוֹ תּוֹצָאָה מַתְאִימָה לְ-30 + 50?"
                  : d === 12
                    ? "אֵיזֶה מִסְפָּר מִתְקַבֵּל מֵ-80 - 30?"
                    : d === 13
                      ? "בְּסִפּוּר שֶׁכָּתוּב בּוֹ 'הוֹסִיפוּ' וְאַחַר כָּךְ 'הוֹצִיאוּ' - מָה סֵדֶר הַפְּעוּלוֹת?"
                      : "בַּחֲרוּ תַּרְגִּיל עִם שְׁתֵּי פְּעוּלוֹת בְּדִיּוּק.",
          d === 8
            ? ["triangle", "rectangle", "circle"]
            : d === 9
              ? ["5, 10, 15, 20", "4, 8, 13, 18", "7, 10, 14, 19"]
              : d === 10
                ? ["5", "4", "9"]
                : d === 11
                  ? ["70", "80", "90"]
                  : d === 12
                    ? ["40", "50", "60"]
                    : d === 13
                      ? ["חִיבּוּר וְאָז חִיסּוּר", "רַק חִיסּוּר", "רַק חִיבּוּר"]
                      : ["40 + 9 = 49", "40 + 9 = 50", "40 + 9 = 48"],
          d === 8
            ? "triangle"
            : d === 9
              ? "5, 10, 15, 20"
              : d === 10
                ? "4"
                : d === 11
                  ? "80"
                  : d === 12
                    ? "50"
                    : d === 13
                      ? "חִיבּוּר וְאָז חִיסּוּר"
                      : "40 + 9 = 49",
          concept.mainTags,
          dayDifficulty,
          "pictorial",
        ),
        numberLineJump(
          d,
          2,
          9,
          d === 8
            ? "מַתְחִילִים בְּ-0 וְקוֹפְצִים בְּ-2 עַד 16. כַּמָּה קְפִיצוֹת?"
            : d === 9
              ? "מַתְחִילִים בְּ-2 וְקוֹפְצִים בְּ-2 עַד 20. כַּמָּה קְפִיצוֹת?"
              : d === 10
                ? "מַתְחִילִים בְּ-10 וְקוֹפְצִים בְּ-5 עַד 30. כַּמָּה קְפִיצוֹת?"
                : d === 11
                  ? "עַל קַו מִסְפָּרִים: מִ-0 לְ-40 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת?"
                  : d === 12
                    ? "צְעִידָה לְאָחוֹר עַל הַקַּו: מִ-80 עַד 60 בְּמִדְלַגּוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת?"
                    : d === 13
                      ? "קִפְצוּ בַּחֲמִישִּׁיּוֹת: מִ-5 עַד 25. כַּמָּה קְפִיצוֹת יֵשׁ?"
                      : "סִפְרָה בִּקְפִיצוֹת: מִ-10 לְ-20, כָּל קְפִיצָה 2. כַּמָּה קְפִיצוֹת?",
          d === 8 ? 0 : d === 9 ? 2 : d === 10 ? 10 : d === 11 ? 0 : d === 12 ? 60 : d === 13 ? 5 : 10,
          d === 8 ? 16 : d === 9 ? 20 : d === 10 ? 30 : d === 11 ? 40 : d === 12 ? 80 : d === 13 ? 25 : 20,
          d === 8 ? 2 : d === 9 || d === 14 ? 2 : 5,
          d === 8 ? 8 : d === 9 ? 9 : d === 10 ? 4 : d === 11 ? 8 : d === 12 ? 4 : d === 13 ? 4 : 5,
          concept.mainTags,
          dayDifficulty,
          "abstract",
        ),
        trueFalse(
          d,
          2,
          10,
          d === 8
            ? "הַאִם נָכוֹן: לָעִיגּוּל אֵין צְלָעוֹת?"
            : d === 9
              ? "הַאִם נָכוֹן: 4, 8, 12, 16 הִיא סִדְרָה קְבוּעָה?"
              : d === 10
                ? "הַאִם נָכוֹן: בַּמִּסְפָּר 71 יֵשׁ 7 עֲשָׂרוֹת?"
                : d === 11
                  ? "נָכוֹן אוֹ לֹא: 20 + 30 = 60."
                  : d === 12
                    ? "נָכוֹן אוֹ לֹא: 70 - 20 = 50."
                    : d === 13
                      ? "בִּדְקוּ אֶת הַטְּעָנָה: בִּבְעָיָה בִּשְׁנֵי צְעָדִים מְחַשְּׁבִים רַק פְּעוּלָה אַחַת."
                      : "נָכוֹן אוֹ לֹא: 30 + 20 - 10 = 40.",
          d !== 11 && d !== 13,
          concept.mainTags,
          dayDifficulty,
          "abstract",
        ),
      ],
    },
    {
      id: toSectionId(d, 3),
      title: concept.geometryPrompt ? "שָׂפָה מָתֵמָטִית וְצוּרוֹת" : "שָׂפָה מָתֵמָטִית",
      type: concept.geometryPrompt ? "geometry" : "verbal",
      learningGoal: "לְנַסֵּחַ בְּמִילִּים פְּתָרוֹנוֹת וּלְקַשֵּׁר לִצּוּרוֹת וּלַמִּסְפָּרִים.",
      prerequisiteSkillTags: concept.mainTags,
      exercises: [
        verbalInput(
          d,
          3,
          1,
          concept.verbalPrompt,
          concept.verbalAnswer,
          ["number-recognition"],
          dayDifficulty,
          "pictorial",
        ),
        verbalInput(
          d,
          3,
          2,
          `בְּ${dayCue}, כְּשֶׁכָּתוּב 'נִשְׁאֲרוּ', אֵיזוֹ פְּעוּלָה כּוֹתְבִים? ___.`,
          "חִיסּוּר",
          ["word-problems", "subtraction"],
          dayDifficulty,
          "abstract",
        ),
        multipleChoice(
          d,
          3,
          3,
          `סַמְּנוּ בְּ${dayCue} אֶת הַמִּשְׁפָּט הַמָּתֵמָטִי הַנָּכוֹן.`,
          ["25 + 5 = 35", "25 + 5 = 30", "25 + 5 = 20"],
          "25 + 5 = 30",
          ["addition"],
          dayDifficulty,
          "abstract",
        ),
        concept.geometryPrompt && concept.geometryAnswer
          ? shapeChoice(
              d,
              3,
              4,
              concept.geometryPrompt,
              concept.geometryAnswer,
              ["geometry-shapes"],
              dayDifficulty,
              "concrete",
            )
          : multipleChoice(
              d,
              3,
              4,
              `בְּ${dayCue}, אֵיזֶה סִימָן מַתְאִים לְהַשְׁוָאָה 19 __ 23 ?`,
              ["<", ">", "="],
              "<",
              ["comparing"],
              dayDifficulty,
              "abstract",
            ),
        verbalInput(
          d,
          3,
          5,
          `כִּתְבוּ בְּמִלִּים בְּ${dayCue} אֶת הַתּוֹצָאָה: 30 - 10 = ___.`,
          "עֶשְׂרִים",
          ["subtraction", "place-value"],
          dayDifficulty,
          "abstract",
        ),
        multipleChoice(
          d,
          3,
          6,
          `קִרְאוּ בְּ${dayCue}: 'לְרִינָה הָיוּ 14 גֻּלּוֹת וְקִבְּלָה עוֹד 6'. אֵיזוֹ פְּעוּלָה מַתְאִימָה?`,
          ["חִיבּוּר", "חִיסּוּר", "הַשְׁוָאָה"],
          "חִיבּוּר",
          ["word-problems", "addition"],
          dayDifficulty,
          "pictorial",
        ),
        verbalInput(
          d,
          3,
          7,
          d === 8
            ? "כִּתְבוּ אֶת שֵׁם הַצּוּרָה שֶׁיֵּשׁ לָהּ 3 צְלָעוֹת."
            : d === 9
              ? "כִּתְבוּ בְּמִלָּה אַחַת: הַכְּלָל שֶׁל 2,4,6,8 הוּא קְפִיצָה בְּ___."
              : d === 10
                ? "כִּתְבוּ בְּמִלָּה: בַּמִּסְפָּר 42 יֵשׁ 4 ___."
                : d === 11
                  ? "מִלַּת מִסְפָּר: כִּתְבוּ בְּמִלִּים אֶת הַתּוֹצָאָה שֶׁל 30+30."
                  : d === 12
                    ? "כִּתְבוּ בַּמִּלִּים אֶת הַתּוֹצָאָה שֶׁל 90-40."
                    : d === 13
                      ? "אֵיזוֹ פְּעוּלָה תִּכְתְּבוּ רִאשׁוֹנָה כְּשֶׁהַמִּלִּים הֵן 'נוֹסְפוּ לִי'?"
                      : "כִּתְבוּ בְּמִלִּים אֶת הַמִּסְפָּר 58.",
          d === 8
            ? "מְשֻׁלָּשׁ"
            : d === 9
              ? "2"
              : d === 10
                ? "עֲשָׂרוֹת"
                : d === 11
                  ? "שִׁשִּׁים"
                  : d === 12
                    ? "חֲמִישִּׁים"
                    : d === 13
                      ? "חִיבּוּר"
                      : "חֲמִישִּׁים וּשְׁמוֹנֶה",
          concept.mainTags,
          dayDifficulty,
          "pictorial",
        ),
        multipleChoice(
          d,
          3,
          8,
          d === 8
            ? "אֵיזוֹ צוּרָה מְתָאִימָה לַתֵּאוּר: 4 צְלָעוֹת שָׁווֹת?"
            : d === 9
              ? "אֵיזֶה מִסְפָּר יַתְאִים אַחֲרֵי 12 בְּסִדְרָה שֶׁל +4?"
              : d === 10
                ? "בַּמִּסְפָּר 36, מַה עֶרֶךְ סִפְרַת הָעֲשָׂרוֹת?"
                : d === 11
                  ? "מִבֵּין הָאֶפְשָׁרֻיּוֹת, אֵיזֶה חִיבּוּר נָכוֹן?"
                  : d === 12
                    ? "מִבֵּין הָאֶפְשָׁרֻיּוֹת, אֵיזֶה חִיסּוּר נָכוֹן?"
                    : d === 13
                      ? "כְּשֶׁשּׁוֹמְעִים 'קִבַּלְתִּי עוֹד', לְאֵיזוֹ פְּעוּלָה זֶה מַרְמֵז?"
                      : "בְּחִישּׁוּב מְשֻׁלָּב, אֵיזֶה מִשְׁפָּט מָתֵמָטִי נָכוֹן?",
          d === 8
            ? ["square", "circle", "triangle"]
            : d === 9
              ? ["14", "15", "16"]
              : d === 10
                ? ["30", "3", "6"]
                : d === 11
                  ? ["20 + 40 = 60", "20 + 40 = 50", "20 + 40 = 70"]
                  : d === 12
                    ? ["80 - 20 = 60", "80 - 20 = 50", "80 - 20 = 40"]
                    : d === 13
                      ? ["חִיבּוּר", "חִיסּוּר", "הַשְׁוָאָה"]
                      : ["40 + 20 - 10 = 50", "40 + 20 - 10 = 40", "40 + 20 - 10 = 60"],
          d === 8
            ? "square"
            : d === 9
              ? "16"
              : d === 10
                ? "30"
                : d === 11
                  ? "20 + 40 = 60"
                  : d === 12
                    ? "80 - 20 = 60"
                    : d === 13
                      ? "חִיבּוּר"
                      : "40 + 20 - 10 = 50",
          concept.mainTags,
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          3,
          9,
          d === 8
            ? "לִשְׁנֵי רִיבּוּעִים וּלְמְשֻׁלָּשׁ אֶחָד יֵשׁ כַּמָּה צְלָעוֹת?"
            : d === 9
              ? "הַשְׁלִימוּ: 7, 10, 13, __"
              : d === 10
                ? "בַּמִּסְפָּר 29, כַּמָּה אֲחָדוֹת יֵשׁ?"
                : d === 11
                  ? "מָה הַתּוֹצָאָה שֶׁל 50 + 30?"
                  : d === 12
                    ? "כַּמָּה נוֹתָר בְּ-100 פָּחוֹת 40?"
                    : d === 13
                      ? "פִּתְרוּ שָׁלָב אַחַר שָׁלָב: 16 - 5 + 3."
                      : "חִשּׁוּב קָצָר: 63 - 20.",
          d === 8 ? 11 : d === 9 ? 16 : d === 10 ? 9 : d === 11 ? 80 : d === 12 ? 60 : d === 13 ? 14 : 43,
          concept.mainTags,
          dayDifficulty,
          "abstract",
        ),
        trueFalse(
          d,
          3,
          10,
          d === 8
            ? "הַאִם נָכוֹן: לְמַלְבֵּן יֵשׁ 4 צְלָעוֹת?"
            : d === 9
              ? "הַאִם נָכוֹן: 10, 15, 20, 25 הִיא סִדְרָה בְּ+5?"
              : d === 10
                ? "הַאִם נָכוֹן: בַּמִּסְפָּר 84 יֵשׁ 8 עֲשָׂרוֹת?"
                : d === 11
                  ? "בִּדְקוּ אִם נָכוֹן: 70 + 20 = 90."
                  : d === 12
                    ? "בִּדְקוּ אִם נָכוֹן: 90 - 30 = 70."
                    : d === 13
                      ? "נָכוֹן אוֹ לֹא: הַמִּלָּה 'נוֹסְפוּ' בְּדֶרֶךְ כְּלָל מַתְאִימָה לְחִיבּוּר."
                      : "בִּדְקוּ אִם נָכוֹן: 60 - 10 + 5 = 55.",
          d !== 12,
          concept.mainTags,
          dayDifficulty,
          "abstract",
        ),
      ],
    },
    {
      id: toSectionId(d, 4),
      title: "בְּדִיקַת הֲבָנָה",
      type: "review",
      learningGoal: "לְזַהוֹת טָעוּיוֹת נְפוֹצוֹת וּלְתַקֵּן בְּאֹפֶן עַצְמָאִי.",
      prerequisiteSkillTags: [...concept.spiralReviewTags, ...concept.mainTags],
      exercises: [
        trueFalse(
          d,
          4,
          1,
          `דֻּגְמָה בְּ${dayCue}: 10 + 2 = 12 (נָכוֹן). עַכְשָׁיו: 14 + 3 = 18.`,
          false,
          ["addition", "comparing"],
          dayDifficulty,
          "abstract",
        ),
        trueFalse(
          d,
          4,
          2,
          `${base + 11} - 1 = ${base + 10}`,
          true,
          ["subtraction"],
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          4,
          3,
          `תַּקְּנוּ אֶת הַטָּעוּת: ${base + 7} + 2 = ${base + 8}. מַה הַתְּשׁוּבָה הַנְּכוֹנָה?`,
          base + 9,
          ["addition"],
          dayDifficulty,
          "abstract",
        ),
        multipleChoice(
          d,
          4,
          4,
          d === 8
            ? "אֵיזוֹ תְּשׁוּבָה סְבִירָה לְמִסְפַּר הַצְּלָעוֹת שֶׁל מְשֻׁלָּשׁ?"
            : d === 9
              ? "אֵיזוֹ תְּשׁוּבָה סְבִירָה: הַמִּסְפָּר הַבָּא בַּסִּדְרָה 4, 8, 12, __ ?"
              : d === 10
                ? "אֵיזוֹ תְּשׁוּבָה סְבִירָה לְמִסְפַּר הָאֲחָדוֹת בְּ-57?"
                : d === 11
                  ? "אֵיזוֹ תְּשׁוּבָה סְבִירָה לְ-20 + 50?"
                  : d === 12
                    ? "אֵיזוֹ תְּשׁוּבָה סְבִירָה לְ-80 - 40?"
                    : d === 13
                      ? "אֵיזוֹ תְּשׁוּבָה סְבִירָה לְ-18 + 4 - 2?"
                      : "אֵיזוֹ תְּשׁוּבָה סְבִירָה לְ-39 - 20?",
          d === 8
            ? ["3", "6", "8"]
            : d === 9
              ? ["16", "14", "18"]
              : d === 10
                ? ["7", "5", "57"]
                : d === 11
                  ? ["70", "30", "700"]
                  : d === 12
                    ? ["40", "120", "4"]
                    : d === 13
                      ? ["20", "24", "10"]
                      : ["19", "59", "9"],
          d === 8
            ? "3"
            : d === 9
              ? "16"
              : d === 10
                ? "7"
                : d === 11
                  ? "70"
                  : d === 12
                    ? "40"
                    : d === 13
                      ? "20"
                      : "19",
          ["subtraction", "place-value"],
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          4,
          5,
          d === 8
            ? "לְמְרֻבָּע יֵשׁ 4 צְלָעוֹת. כַּמָּה צְלָעוֹת יֵשׁ לִשְׁנֵי מְרֻבָּעִים?"
            : d === 9
              ? "הַשְׁלִימוּ אֶת הַסִּדְרָה הַזּוּגִית: 10, 12, 14, __"
              : d === 10
                ? "בַּמִּסְפָּר 63 כַּמָּה אֲחָדוֹת יֵשׁ?"
                : d === 11
                  ? "בְּקֻפְסָּה יֵשׁ 30 עִפְּרוֹנוֹת. מוֹסִיפִים עוֹד 40. כַּמָּה עַכְשָׁיו?"
                  : d === 12
                    ? "הָיוּ 90 כַּדּוּרִים. לָקְחוּ 50. כַּמָּה נִשְׁאֲרוּ?"
                    : d === 13
                      ? "לְיָעֵל הָיוּ 14 מַדְבֵּקוֹת. קִבְּלָה עוֹד 6, אַחַר כָּךְ נָתְנָה 4. כַּמָּה נִשְׁאֲרוּ?"
                      : "בְּ-60 יְלָדִים הִצְטָרְפוּ עוֹד 20 וְאָז הָלְכוּ 10. כַּמָּה יֵשׁ?",
          d === 8 ? 8 : d === 9 ? 16 : d === 10 ? 3 : d === 11 ? 70 : d === 12 ? 40 : d === 13 ? 16 : 70,
          ["word-problems", "subtraction"],
          dayDifficulty,
          "pictorial",
        ),
        numberInput(
          d,
          4,
          6,
          d === 8
            ? "לְמְשֻׁלָּשׁ יֵשׁ 3 צְלָעוֹת וּלְמַלְבֵּן יֵשׁ 4. כַּמָּה צְלָעוֹת לָהֶם יַחַד?"
            : d === 9
              ? "הַמִּסְפָּר הַבָּא בַּסִּדְרָה 1, 3, 5, 7 הוּא מַה?"
              : d === 10
                ? "בַּמִּסְפָּר 85 כַּמָּה עֲשָׂרוֹת יֵשׁ?"
                : d === 11
                  ? "חַשְּׁבוּ חִיבּוּר עֲשָׂרוֹת: 50 + 30"
                  : d === 12
                    ? "חַשְּׁבוּ חִיסּוּר עֲשָׂרוֹת: 70 - 20"
                    : d === 13
                      ? "בַּסַּל הָיוּ 20 פֵּרוֹת. נֶאֱכְלוּ 8 וְנוֹסְפוּ 5. כַּמָּה יֵשׁ?"
                      : "בְּקֻפָּה יֵשׁ 40 עִפְּרוֹנוֹת. מוֹסִיפִים עוֹד 30, אַחַר כָּךְ לוֹקְחִים 20. כַּמָּה נִשְׁאַר?",
          d === 8 ? 7 : d === 9 ? 9 : d === 10 ? 8 : d === 11 ? 80 : d === 12 ? 50 : d === 13 ? 17 : 50,
          ["word-problems", "addition"],
          dayDifficulty,
          "pictorial",
        ),
        trueFalse(
          d,
          4,
          7,
          d === 8
            ? "טָעוּת אוֹ נָכוֹן: לָעִיגּוּל יֵשׁ 2 צְלָעוֹת."
            : d === 9
              ? "טָעוּת אוֹ נָכוֹן: 2, 4, 8, 10 הִיא סִדְרָה קְבוּעָה בְּ+2."
              : d === 10
                ? "טָעוּת אוֹ נָכוֹן: בַּמִּסְפָּר 73 יֵשׁ 7 אֲחָדוֹת."
                : d === 11
                  ? "זַהוּ אִם יֵשׁ טָעוּת: 20 + 20 = 30."
                  : d === 12
                    ? "זַהוּ אִם יֵשׁ טָעוּת: 80 - 30 = 40."
                    : d === 13
                      ? "הַאִם הַמִּשְׁפָּט נָכוֹן: בְּעָיָה בִּשְׁנֵי צְעָדִים פּוֹתְרִים בִּשְׁנֵי שְׁלָבִים."
                      : "הַאִם הַמִּשְׁפָּט נָכוֹן: 45 + 10 - 5 = 55.",
          d === 13 || d === 14,
          concept.mainTags,
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          4,
          8,
          d === 8
            ? "תַּקְּנוּ: לִשְׁנֵי מְשֻׁלָּשִׁים יֵשׁ 5 צְלָעוֹת. מַה נָכוֹן?"
            : d === 9
              ? "תַּקְּנוּ: 3, 6, 9, 11. מַה הַמִּסְפָּר הַנָּכוֹן בִּמְקוֹם 11?"
              : d === 10
                ? "תַּקְּנוּ: בַּמִּסְפָּר 64 יֵשׁ 5 עֲשָׂרוֹת. כַּמָּה בֶּאֱמֶת?"
                : d === 11
                  ? "תַּקְּנוּ אֶת הַתַּרְגִּיל: 30 + 30 = 50. כַּמָּה צָרִיךְ לִהְיוֹת?"
                  : d === 12
                    ? "תַּקְּנוּ אֶת הַתַּרְגִּיל: 70 - 20 = 40. כַּמָּה צָרִיךְ לִהְיוֹת?"
                    : d === 13
                      ? "תַּקְּנוּ: 12 + 5 - 4 = 12. מָה הַתּוֹצָאָה הַנְּכוֹנָה?"
                      : "תַּקְּנוּ: 68 - 20 = 38. מָה הַתּוֹצָאָה הַנְּכוֹנָה?",
          d === 8 ? 6 : d === 9 ? 12 : d === 10 ? 6 : d === 11 ? 60 : d === 12 ? 50 : d === 13 ? 13 : 48,
          concept.mainTags,
          dayDifficulty,
          "abstract",
        ),
        multipleChoice(
          d,
          4,
          9,
          d === 8
            ? "מָה מַתְאִים לְמַלְבֵּן?"
            : d === 9
              ? "אֵיזוֹ סִדְרָה נְכוֹנָה?"
              : d === 10
                ? "בַּמִּסְפָּר 31 מָה עֶרֶךְ הָעֲשָׂרוֹת?"
                : d === 11
                  ? "בַּחֲרוּ אֶת מִשְׁפַּט הַחִיבּוּר הַנָּכוֹן."
                  : d === 12
                    ? "בַּחֲרוּ אֶת מִשְׁפַּט הַחִיסּוּר הַנָּכוֹן."
                    : d === 13
                      ? "כְּצַעַד רִאשׁוֹן בִּבְעָיָה בִּשְׁנֵי צְעָדִים, מָה מַתְאִים לַעֲשׂוֹת?"
                      : "אֵיזֶה פִּתְרוֹן מְשֻׁלָּב נָכוֹן?",
          d === 8
            ? ["4 צְלָעוֹת", "3 צְלָעוֹת", "אֵין צְלָעוֹת"]
            : d === 9
              ? ["1, 3, 5, 7", "1, 4, 7, 9", "2, 5, 9, 12"]
              : d === 10
                ? ["30", "3", "1"]
                : d === 11
                  ? ["40 + 20 = 60", "40 + 20 = 70", "40 + 20 = 50"]
                  : d === 12
                    ? ["90 - 50 = 40", "90 - 50 = 30", "90 - 50 = 20"]
                    : d === 13
                      ? ["לִקְרֹא וּלְזַהוֹת נְתוּנִים", "לְנַחֵשׁ מִיָּד", "לְדַלֵּג עַל חִשּׁוּב"]
                      : ["55 + 5 - 10 = 50", "55 + 5 - 10 = 40", "55 + 5 - 10 = 60"],
          d === 8
            ? "4 צְלָעוֹת"
            : d === 9
              ? "1, 3, 5, 7"
              : d === 10
                ? "30"
                : d === 11
                  ? "40 + 20 = 60"
                  : d === 12
                    ? "90 - 50 = 40"
                    : d === 13
                      ? "לִקְרֹא וּלְזַהוֹת נְתוּנִים"
                      : "55 + 5 - 10 = 50",
          concept.mainTags,
          dayDifficulty,
          "pictorial",
        ),
      ],
    },
    {
      id: toSectionId(d, 5),
      title: "אֶתְגָּר מְסַכֵּם",
      type: "challenge",
      learningGoal: "לְיַישֵׂם בְּעָיוֹת מִילּוּלִיּוֹת וּתַרְגִּילִים מְשֻׁלָּבִים בְּרָמָה עוֹלָה.",
      prerequisiteSkillTags: [...concept.mainTags, ...concept.spiralReviewTags],
      exercises: [
        numberInput(
          d,
          5,
          1,
          `דֻּגְמָה בְּ${dayCue}: קֹדֶם מְחַבְּרִים וְאַחַר כָּךְ מַחְסִירִים. 20 + 5 - 3 = 22. עַכְשָׁיו חַשְּׁבוּ 18 + 6 - 4`,
          20,
          ["word-problems", "addition", "subtraction"],
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          5,
          2,
          `בְּ${dayCue}: בַּסִּפְרִיָּה הָיוּ 24 סְפָרִים. הִגִּיעוּ 8 חֲדָשִׁים וְאַחַר כָּךְ הוֹצִיאוּ 7. כַּמָּה נִשְׁאֲרוּ?`,
          25,
          ["word-problems", "addition", "subtraction"],
          dayDifficulty,
          "pictorial",
        ),
        numberInput(
          d,
          5,
          3,
          `בְּ${dayCue}: בְּמִגְרָשׁ יֵשׁ 35 יְלָדִים. 9 הָלְכוּ הַבַּיְתָה וְאָז הִצְטָרְפוּ 4. כַּמָּה עַכְשָׁיו?`,
          30,
          ["word-problems", "addition", "subtraction"],
          dayDifficulty,
          "abstract",
        ),
        multipleChoice(
          d,
          5,
          4,
          `בְּ${dayCue}, אֵיךְ כְּדַאי לִפְתּוֹר 48 - 19?`,
          ["קַו מִסְפָּרִים", "נִחוּשׁ בְּלִי חִשּׁוּב", "רַק סְפִירָה לְאָחוֹר בְּ-1"],
          "קַו מִסְפָּרִים",
          ["number-line", "subtraction"],
          dayDifficulty,
          "abstract",
        ),
        numberLineJump(
          d,
          5,
          5,
          `בְּ${dayCue}: מִתְחִילִים בְּ-15 וְקוֹפְצִים בְּ-5 עַד 45. כַּמָּה קְפִיצוֹת?`,
          15,
          45,
          5,
          6,
          ["number-line", "patterns", "addition"],
          dayDifficulty,
          "abstract",
        ),
        trueFalse(
          d,
          5,
          6,
          `בְּ${dayCue}, הַאִם נָכוֹן: בְּכָל בְּעָיָה שֶׁכָּתוּב בָּהּ 'נִשְׁאֲרוּ', מַתְחִילִים בְּחִיסּוּר?`,
          true,
          ["word-problems", "subtraction"],
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          5,
          7,
          d === 8
            ? "אֶתְגָּר צוּרוֹת: לִמְשֻׁלָּשׁ וּלְרִיבּוּעַ יַחַד יֵשׁ כַּמָּה צְלָעוֹת?"
            : d === 9
              ? "אֶתְגָּר סִדְרָה: 4, 9, 14, __"
              : d === 10
                ? "אֶתְגָּר עֶרֶךְ מָקוֹם: בַּמִּסְפָּר 76 מַה עֶרֶךְ סִפְרַת הָעֲשָׂרוֹת?"
                : d === 11
                  ? "אֶתְגָּר לַיּוֹם: חַשְּׁבוּ 30 + 60."
                  : d === 12
                    ? "אֶתְגָּר לַיּוֹם: חַשְּׁבוּ 100 - 70."
                    : d === 13
                      ? "אֶתְגָּר מִילּוּלִי: בַּסַּל 28 פֵּרוֹת, 9 נֶאֶכְלוּ וְאַחַר כָּךְ הוֹסִיפוּ 6. כַּמָּה נִשְׁאַר?"
                      : "אֶתְגָּר סִכּוּם: פִּתְרוּ 40 + 15 - 8.",
          d === 8 ? 7 : d === 9 ? 19 : d === 10 ? 70 : d === 11 ? 90 : d === 12 ? 30 : d === 13 ? 25 : 47,
          concept.mainTags,
          dayDifficulty,
          "abstract",
        ),
        numberLineJump(
          d,
          5,
          8,
          d === 8
            ? "מַתְחִילִים בְּ-0 וְקוֹפְצִים בְּ-2 עַד 12. כַּמָּה קְפִיצוֹת?"
            : d === 9
              ? "מַתְחִילִים בְּ-3 וְקוֹפְצִים בְּ-3 עַד 18. כַּמָּה קְפִיצוֹת?"
              : d === 10
                ? "מַתְחִילִים בְּ-20 וְקוֹפְצִים בְּ-5 עַד 40. כַּמָּה קְפִיצוֹת?"
                : d === 11
                  ? "מִ-10 עַד 35, קוֹפְצִים בְּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת?"
                  : d === 12
                    ? "קִפְצוּ לְאָחוֹר בַּחֲמִישִּׁיּוֹת: מִ-90 עַד 70. כַּמָּה קְפִיצוֹת?"
                    : d === 13
                      ? "סִפְרָה בְּדִלּוּג שֶׁל 2 מִ-8 עַד 20: כַּמָּה קְפִיצוֹת?"
                      : "מִסְפָּרִים בַּחֲמִישִּׁיּוֹת מִ-5 עַד 30. כַּמָּה קְפִיצוֹת?",
          d === 12 ? 70 : d === 8 ? 0 : d === 9 ? 3 : d === 10 ? 20 : d === 11 ? 10 : d === 13 ? 8 : 5,
          d === 12 ? 90 : d === 8 ? 12 : d === 9 ? 18 : d === 10 ? 40 : d === 11 ? 35 : d === 13 ? 20 : 30,
          d === 9 ? 3 : d === 10 || d === 11 || d === 12 || d === 14 ? 5 : 2,
          d === 8 ? 6 : d === 9 ? 5 : d === 10 ? 4 : d === 11 ? 5 : d === 12 ? 4 : d === 13 ? 6 : 5,
          concept.mainTags,
          dayDifficulty,
          "abstract",
        ),
        trueFalse(
          d,
          5,
          9,
          d === 8
            ? "הַאִם נָכוֹן: לִשְׁנֵי מְרֻבָּעִים יֵשׁ 8 צְלָעוֹת?"
            : d === 9
              ? "הַאִם נָכוֹן: 2, 7, 12, 17 הִיא סִדְרָה בְּ+5?"
              : d === 10
                ? "הַאִם נָכוֹן: בַּמִּסְפָּר 48 יֵשׁ 4 עֲשָׂרוֹת?"
                : d === 11
                  ? "בִּדְקוּ אִם נָכוֹן: 50 + 20 = 80."
                  : d === 12
                    ? "בִּדְקוּ אִם נָכוֹן: 60 - 30 = 30."
                    : d === 13
                      ? "נָכוֹן אוֹ לֹא: בְּעָיָה בִּשְׁנֵי צְעָדִים יְכוֹלָה לְשַׁלֵּב חִיבּוּר וְחִיסּוּר."
                      : "בִּדְקוּ אִם נָכוֹן: 70 - 15 + 5 = 60.",
          d !== 11,
          concept.mainTags,
          dayDifficulty,
          "abstract",
        ),
      ],
    },
  ];
};

const buildExpandedExercisesForEarlyDays = (
  concept: DayConcept,
  dayDifficulty: DifficultyLevel,
  priorConcepts: DayConcept[],
): Section[] => {
  const d = concept.dayNumber;
  const addBase = d + 2;
  const subBase = d + 7;
  const maxForDay = d <= 2 ? d * 5 : 20;
  const focusTag: SkillTag = concept.mainTags[0] ?? "counting";
  const focusTitle = concept.title;
  const countingCap = d === 1 ? 5 : d === 2 ? 10 : maxForDay;
  const spacedFocusOrder = [1, 3, 5, 2, 4, 6];
  const spacedDrillOrder = d <= 2 ? [1, 5, 2, 6, 3, 7, 4, 8] : [1, 3, 5, 7, 2, 4, 6, 8];

  /** יום 3 — חִיבּוּר עַד 10: זוּגוֹת קְבוּעִים לְתִרְגּוּל מְמוּקָּד. */
  const day3AdditionPair = (idx: number): [number, number] => {
    const pairs: [number, number][] = [
      [4, 3],
      [5, 5],
      [2, 7],
      [6, 4],
      [3, 6],
      [8, 2],
      [7, 3],
      [4, 4],
    ];
    const [a, b] = pairs[(idx - 1) % pairs.length] ?? [4, 3];
    return [a, b];
  };

  /** יום 4 — חִיסּוּר עַד 10: מִנּוּעַ ≤ 10, תּוֹצָאָה טְבָעִית לִכִיתָה א׳. */
  const day4SubtractionPair = (idx: number): [number, number] => {
    const pairs: [number, number][] = [
      [9, 4],
      [10, 6],
      [8, 3],
      [7, 2],
      [10, 3],
      [6, 1],
      [9, 5],
      [5, 3],
    ];
    const [m, s] = pairs[(idx - 1) % pairs.length] ?? [9, 4];
    return [m, s];
  };

  const focusNumberPrompt = (idx: number): { prompt: string; answer: number; tags: SkillTag[] } => {
    if (d === 1) {
      const start = Math.max(0, Math.min(4, idx - 1));
      const dayOnePrompts = [
        `סִפְרוּ מִ-${start} עַד 5. כַּמָּה מִסְפָּרִים אוֹמְרִים?`,
        countRangePrompt(start, 5),
        countRangePrompt(start, 5),
        `סִפְרוּ בְּקוֹל: ${start}, ... , 5. כַּמָּה נֶאֱמָרִים בַּסַּךְ הַכֹּל?`,
        `סוֹפְרִים אֶת כָּל הַמִּסְפָּרִים מִ-${start} עַד 5. כַּמָּה יֵשׁ?`,
        `עִבְרוּ מִ-${start} עַד 5 בִּסְפִירָה. כַּמָּה מִסְפָּרִים עוֹבְרִים?`,
      ];
      return {
        prompt: dayOnePrompts[(idx - 1) % dayOnePrompts.length],
        answer: 6 - start,
        tags: ["counting", "number-recognition"],
      };
    }

    if (d === 2) {
      const start = (idx - 1) % 6;
      const end = Math.min(10, start + 4);
      const dayTwoPrompts = [
        countRangePrompt(start, end),
        countRangePrompt(start, end),
        `אִמְרוּ אֶת הַסְּפִירָה ${start} עַד ${end}. כַּמָּה נֶאֱמָר?`,
        `בִּסְפִירָה מִ-${start} לְ-${end}, כַּמָּה מִסְפָּרִים כּוֹלֵל הַטֶּוַח?`,
        `סִפְרָה מֻדְרֶכֶת: מִ-${start} עַד ${end}. כַּמָּה יֵשׁ בַּסְּפִירָה?`,
        countRangePrompt(start, end),
      ];
      return {
        prompt: dayTwoPrompts[(idx - 1) % dayTwoPrompts.length],
        answer: end - start + 1,
        tags: ["counting", "number-recognition"],
      };
    }

    if (d === 3) {
      const [a, b] = day3AdditionPair(idx);
      const dayThreePrompts = [
        `חַשְּׁבוּ: ${a} + ${b}`,
        `חַשְּׁבוּ חִיבּוּר: ${a} + ${b}`,
        `מָה הַתּוֹצָאָה שֶׁל ${a} + ${b}?`,
        `כַּמָּה יֵצֵא בְּ-${a} + ${b}?`,
        `תַּרְגִּיל חִיבּוּר קָצָר: ${a} + ${b}`,
        `תַּרְגִּיל חִיבּוּר: ${a} וְעוֹד ${b}.`,
      ];
      return {
        prompt: dayThreePrompts[(idx - 1) % dayThreePrompts.length],
        answer: a + b,
        tags: ["addition"],
      };
    }

    if (d === 4) {
      const [a, sub] = day4SubtractionPair(idx);
      const dayFourPrompts = [
        `חַשְּׁבוּ: ${a} - ${sub}`,
        `חַשְּׁבוּ חִיסּוּר: ${a} - ${sub}`,
        `מָה הַתּוֹצָאָה בַּתַּרְגִּיל ${a} - ${sub}?`,
        `כַּמָּה יֵצֵא בְּ-${a} - ${sub}?`,
        `תַּרְגִּיל חִיסּוּר קָצָר: ${a} - ${sub}`,
        `תַּרְגִּיל חִיסּוּר: ${a} פָּחוֹת ${sub}.`,
      ];
      return {
        prompt: dayFourPrompts[(idx - 1) % dayFourPrompts.length],
        answer: a - sub,
        tags: ["subtraction"],
      };
    }

    if (d === 5) {
      const left = 8 + idx;
      const right = 10 + (idx % 4);
      const dayFivePrompts = [
        `כִּתְבוּ אֶת הַמִּסְפָּר הַגָּדוֹל יוֹתֵר: ${left} אוֹ ${right}.`,
        `מִי גָּדוֹל יוֹתֵר, ${left} אוֹ ${right}? כִּתְבוּ אֶת הַתְּשׁוּבָה.`,
        `הַשְׁווּ בֵּין ${left} לְ-${right}. מָה הַמִּסְפָּר הַגָּדוֹל?`,
        `בְּחִירַת מִסְפָּר גָּדוֹל: ${left} אוֹ ${right}?`,
        `אֵיזֶה מִסְפָּר גָּדוֹל יוֹתֵר בַּזּוּג ${left}, ${right}?`,
        `רְאוּ אֶת הַזּוּג ${left} וְ-${right}. כִּתְבוּ אֶת הַגָּדוֹל.`,
      ];
      return {
        prompt: dayFivePrompts[(idx - 1) % dayFivePrompts.length],
        answer: Math.max(left, right),
        tags: ["comparing", "number-recognition"],
      };
    }

    if (d === 6) {
      if (idx % 2 === 0) {
        const a = 10 + idx;
        const b = idx <= 4 ? 3 : 4;
        const evenPrompts = [
          `חַשְּׁבוּ חִיבּוּר: ${a} + ${b}`,
          `כַּמָּה יֵשׁ בְּסַךְ הַכֹּל? ${a} וְעוֹד ${b}.`,
          `הוֹסִיפוּ ${b} לְ-${a}. מַה הַתּוֹצָאָה?`,
          `כַּמָּה יֵצֵא בְּ-${a} + ${b}?`,
        ];
        return {
          prompt: evenPrompts[(idx / 2 - 1) % evenPrompts.length],
          answer: a + b,
          tags: ["addition"],
        };
      }
      const a = 18 + idx;
      const b = idx <= 4 ? 4 : 5;
      const oddPrompts = [
        `חַשְּׁבוּ חִיסּוּר: ${a} - ${b}`,
        `מַה נִשְׁאָר אִם מוֹרִידִים ${b} מִ-${a}?`,
        `כַּמָּה יֵצֵא בְּ-${a} - ${b}?`,
        `הַחְסִירוּ ${b} מִ-${a}. מַה הַתְּשׁוּבָה?`,
      ];
      return {
        prompt: oddPrompts[((idx - 1) / 2) % oddPrompts.length],
        answer: a - b,
        tags: ["subtraction"],
      };
    }

    return {
      prompt: `לְאוֹר הָיוּ ${6 + idx} מַדְבֵּקוֹת וְקִבְּלָה עוֹד ${idx <= 4 ? 2 : 3}. כַּמָּה יֵשׁ לָהּ עַכְשָׁיו?`,
      answer: 6 + idx + (idx <= 4 ? 2 : 3),
      tags: ["word-problems", "addition"],
    };
  };

  const focusedDrillPrompt = (idx: number): { prompt: string; answer: number; tags: SkillTag[] } => {
    if (d === 1) {
      const start = Math.max(0, Math.min(4, idx - 1));
      const end = 5;
      const dayOneDrillPrompts = [
        countRangePrompt(start, end),
        countRangePrompt(start, end),
        `הַשְׁלִימוּ סְפִירָה מִ-${start} עַד ${end}. כַּמָּה בַּסַּךְ הַכֹּל?`,
        countRangePrompt(start, end),
        `סוֹפְרִים: ${start}...${end}. כַּמָּה מִסְפָּרִים נֶאֱמָרִים?`,
        `סִפְרָה יְשִׁירָה מִ-${start} עַד ${end}. כַּמָּה יֵשׁ?`,
        countRangePrompt(start, end),
        countRangePrompt(start, end),
      ];
      return {
        prompt: dayOneDrillPrompts[(idx - 1) % dayOneDrillPrompts.length],
        answer: end - start + 1,
        tags: ["counting", "number-recognition"],
      };
    }

    if (d === 2) {
      const start = Math.max(0, idx - 1);
      const end = Math.min(10, start + 5);
      const dayTwoDrillPrompts = [
        `כִּתְבוּ אֶת הַמִּסְפָּר הָאַחֲרוֹן בַּסְּפִירָה מִ-${start} עַד ${end}.`,
        `מַתְחִילִים בְּ-${start} וּמַגִּיעִים לְ-${end}. מָה הַמִּסְפָּר הָאַחֲרוֹן?`,
        `בַּסְּפִירָה ${start} עַד ${end}, אֵיזֶה מִסְפָּר בַּסּוֹף?`,
        `סִיּוּם סְפִירָה: מִ-${start} עַד ${end}. כִּתְבוּ אֶת הָאַחֲרוֹן.`,
        `סִפְרוּ מִ-${start} לְ-${end} וּכְתְבוּ אֶת מִסְפַּר הַסּוֹף.`,
        `בַּטֶּוַח ${start} עַד ${end}, מָה הַמִּסְפָּר שֶׁמַּסְיֵם?`,
        `הַמִּסְפָּר הָאַחֲרוֹן בְּסְפִירָה מִ-${start} עַד ${end} הוּא?`,
        `עִבְרוּ מִ-${start} עַד ${end}. אֵיזֶה מִסְפָּר בָּא בַּסּוֹף?`,
      ];
      return {
        prompt: dayTwoDrillPrompts[(idx - 1) % dayTwoDrillPrompts.length],
        answer: end,
        tags: ["counting", "number-recognition"],
      };
    }

    if (d === 3) {
      const [a, b] = day3AdditionPair(idx);
      const dayThreeDrillPrompts = [
        `חַשְּׁבוּ חִיבּוּר: ${a} + ${b}`,
        `חַשְּׁבוּ אֶת הַתַּרְגִּיל ${a} + ${b}`,
        `מָה תּוֹצָאַת הַחִיבּוּר ${a} + ${b}?`,
        `חִיבּוּר: ${a} וְעוֹד ${b}. כַּמָּה?`,
        `תַּרְגִּיל יוֹם 3: חַשְּׁבוּ ${a} + ${b}`,
        `כִּתְבוּ תְּשׁוּבָה לְ-${a} + ${b}`,
        `חִיבּוּר קָצָר: ${a} וְעוֹד ${b}. כַּמָּה?`,
        `מָה יֵצֵא אִם מוֹסִיפִים ${b} לְ-${a}?`,
      ];
      return {
        prompt: dayThreeDrillPrompts[(idx - 1) % dayThreeDrillPrompts.length],
        answer: a + b,
        tags: ["addition"],
      };
    }

    if (d === 4) {
      const [a, sub] = day4SubtractionPair(idx);
      const dayFourDrillPrompts = [
        `חַשְּׁבוּ חִיסּוּר: ${a} - ${sub}`,
        `חַשְּׁבוּ אֶת הַתַּרְגִּיל ${a} - ${sub}`,
        `מָה תּוֹצָאַת הַחִיסּוּר ${a} - ${sub}?`,
        `חִיסּוּר: ${a} פָּחוֹת ${sub}. כַּמָּה?`,
        `תַּרְגִּיל יוֹם 4: חַשְּׁבוּ ${a} - ${sub}`,
        `כִּתְבוּ תְּשׁוּבָה לְ-${a} - ${sub}`,
        `חִיסּוּר קָצָר: ${a} פָּחוֹת ${sub}. כַּמָּה?`,
        `מָה יֵצֵא אִם נַחְסִיר ${sub} מִ-${a}?`,
      ];
      return {
        prompt: dayFourDrillPrompts[(idx - 1) % dayFourDrillPrompts.length],
        answer: a - sub,
        tags: ["subtraction"],
      };
    }

    if (d === 5) {
      const small = 7 + idx;
      const big = small + (idx % 3) + 1;
      const dayFiveDrillPrompts = [
        `מָה גָּדוֹל יוֹתֵר: ${small} אוֹ ${big}? כִּתְבוּ אֶת הַגָּדוֹל.`,
        `הַשְׁווּ בֵּין ${small} לְ-${big}. מִי גָּדוֹל?`,
        `בִּזְוּג ${small}, ${big} אֵיזֶה מִסְפָּר גָּדוֹל יוֹתֵר?`,
        `כִּתְבוּ אֶת הַמִּסְפָּר הַגָּדוֹל מִבֵּין ${small} וְ-${big}.`,
        `אֵיזֶה מִסְפָּר מְנַצֵּחַ: ${small} אוֹ ${big}?`,
        `מִבֵּין ${small} וְ-${big}, מָה הַמִּסְפָּר הַגָּדוֹל?`,
        `סַמְּנוּ אֶת הַגָּדוֹל בַּזּוּג ${small} וְ-${big}.`,
        `בַּחֲרוּ אֶת הַמִּסְפָּר הַגָּדוֹל יוֹתֵר: ${small} אוֹ ${big}.`,
      ];
      return {
        prompt: dayFiveDrillPrompts[(idx - 1) % dayFiveDrillPrompts.length],
        answer: big,
        tags: ["comparing", "number-recognition"],
      };
    }

    if (d === 6) {
      if (idx % 2 === 0) {
        const a = 11 + idx;
        const b = 4;
        const evenDrillPrompts = [
          `חַשְּׁבוּ: ${a} + ${b}`,
          `מָה הַתּוֹצָאָה שֶׁל ${a} וְעוֹד ${b}?`,
          `הוֹסִיפוּ ${b} לְ-${a} וּכְתְבוּ אֶת הַסְּכוּם.`,
          `תַּרְגִּיל חִיבּוּר: ${a} + ${b}`,
        ];
        return {
          prompt: evenDrillPrompts[(idx / 2 - 1) % evenDrillPrompts.length],
          answer: a + b,
          tags: ["addition"],
        };
      }
      const a = 20 + idx;
      const b = 5;
      const oddDrillPrompts = [
        `חַשְּׁבוּ: ${a} - ${b}`,
        `כַּמָּה נִשְׁאָר מִ-${a} אַחֲרֵי הוֹרָדַת ${b}?`,
        `תַּרְגִּיל חִיסּוּר: ${a} - ${b}`,
        `הַחְסִירוּ ${b} מִ-${a} וּכְתְבוּ תְּשׁוּבָה.`,
      ];
      return {
        prompt: oddDrillPrompts[((idx - 1) / 2) % oddDrillPrompts.length],
        answer: a - b,
        tags: ["subtraction"],
      };
    }

    const startStickers = 8 + idx;
    const add = idx <= 4 ? 2 : 3;
    return {
      prompt: `לְיָד הָיוּ ${startStickers} מַדְבֵּקוֹת. הוּא קִבֵּל עוֹד ${add}. כַּמָּה יֵשׁ לוֹ?`,
      answer: startStickers + add,
      tags: ["word-problems", "addition"],
    };
  };

  return [
    {
      id: toSectionId(d, 1),
      title: "חִימּוּם וַחֲזָרַת סְפִּירָלָה",
      type: "warmup",
      learningGoal: "לְהַתְחִיל בְּהַצְלָחָה עִם 3–4 תַּרְגּוּלִים מִיָּמִים קוֹדְמִים.",
      prerequisiteSkillTags: concept.spiralReviewTags,
      exercises: buildSpiralWarmupExercises(concept, priorConcepts, dayDifficulty),
    },
    {
      id: toSectionId(d, 2),
      title: `מוּשָׂג הַיּוֹם: ${focusTitle}`,
      type: "arithmetic",
      learningGoal: "לְהַעֲמִיק בְּמוּשָׂג הַמֶּרְכָּזִי שֶׁל הַיּוֹם בְּתַרְגּוּל מֻדְרָג.",
      prerequisiteSkillTags: concept.mainTags,
      example: {
        title: "דֻּגְמָה פְּתוּרָה",
        prompt: `דֻּגְמָה: ${concept.arithmeticPrompt}`,
        steps: [
          "קוֹרְאִים אֶת הַשְּׁאֵלָה וּמְזַהִים אֵיזוֹ מְיֻמָּנוּת נִדְרֶשֶׁת.",
          `מְבַצְּעִים אֶת הַפְּעוּלָה בְּשָׁלָבִים קְצָרִים וּמַגִּיעִים לְ-${concept.arithmeticAnswer}.`,
          "בוֹדְקִים שֶׁהַתְּשׁוּבָה הִגְיוֹנִית לְפִי הַסִּפּוּר אוֹ הַתַּרְגִּיל.",
        ],
        takeaway: "רַעְיוֹן זְכִירָה: עוֹבְדִים מְסֻדָּר, שׁוֹמְרִים עַל נוֹשֵׂא הַיּוֹם.",
      },
      exercises: [
        numberInput(
          d,
          2,
          1,
          `דֻּגְמָה: ${concept.arithmeticPrompt} תְּשׁוּבָה ${concept.arithmeticAnswer}. עַכְשָׁיו פִּתְרוּ שְׁאֵלָה דּוֹמָה.`,
          concept.arithmeticAnswer,
          concept.mainTags,
          dayDifficulty,
          "concrete",
          0,
          20,
        ),
        numberInput(
          d,
          2,
          2,
          focusNumberPrompt(spacedFocusOrder[0]).prompt,
          focusNumberPrompt(spacedFocusOrder[0]).answer,
          focusNumberPrompt(spacedFocusOrder[0]).tags,
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          2,
          3,
          focusNumberPrompt(spacedFocusOrder[1]).prompt,
          focusNumberPrompt(spacedFocusOrder[1]).answer,
          focusNumberPrompt(spacedFocusOrder[1]).tags,
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          2,
          4,
          focusNumberPrompt(spacedFocusOrder[2]).prompt,
          focusNumberPrompt(spacedFocusOrder[2]).answer,
          focusNumberPrompt(spacedFocusOrder[2]).tags,
          dayDifficulty,
          "abstract",
        ),
        multipleChoice(
          d,
          2,
          5,
          concept.arithmeticPrompt,
          concept.arithmeticMcOptions,
          concept.arithmeticMcAnswer,
          concept.mainTags,
          dayDifficulty,
          "pictorial",
        ),
        numberInput(
          d,
          2,
          6,
          focusNumberPrompt(spacedFocusOrder[3]).prompt,
          focusNumberPrompt(spacedFocusOrder[3]).answer,
          focusNumberPrompt(spacedFocusOrder[3]).tags,
          dayDifficulty,
          "abstract",
          0,
          maxForDay,
        ),
        numberInput(
          d,
          2,
          7,
          focusNumberPrompt(spacedFocusOrder[4]).prompt,
          focusNumberPrompt(spacedFocusOrder[4]).answer,
          focusNumberPrompt(spacedFocusOrder[4]).tags,
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          2,
          8,
          focusNumberPrompt(spacedFocusOrder[5]).prompt,
          focusNumberPrompt(spacedFocusOrder[5]).answer,
          focusNumberPrompt(spacedFocusOrder[5]).tags,
          dayDifficulty,
          "abstract",
        ),
      ],
    },
    {
      id: toSectionId(d, 3),
      title: "חִיסּוּר",
      type: "arithmetic",
      learningGoal: "לְחַזֵּק חִיסּוּר בְּדִיּוּק וּבְשִׁיטָה סְדוּרָה.",
      prerequisiteSkillTags: ["subtraction", ...concept.mainTags],
      exercises: [
        numberInput(
          d,
          3,
          1,
          `דֻּגְמָה: ${subBase + 2} - 2 = ${subBase}. עַכְשָׁיו חַשְּׁבוּ ${subBase + 3} - 2`,
          subBase + 1,
          ["subtraction"],
          dayDifficulty,
          "concrete",
          0,
          20,
        ),
        numberInput(d, 3, 2, `חַשְּׁבוּ ${subBase + 1} - 3`, subBase - 2, ["subtraction"], dayDifficulty, "abstract"),
        numberInput(d, 3, 3, `חַשְּׁבוּ ${subBase + 2} - 4`, subBase - 2, ["subtraction"], dayDifficulty, "abstract"),
        numberInput(d, 3, 4, `חַשְּׁבוּ ${subBase} - 2`, subBase - 2, ["subtraction"], dayDifficulty, "abstract"),
        multipleChoice(
          d,
          3,
          5,
          `חַשְּׁבוּ ${subBase + 4} - 3`,
          [`${subBase}`, `${subBase + 1}`, `${subBase + 2}`],
          `${subBase + 1}`,
          ["subtraction"],
          dayDifficulty,
          "pictorial",
        ),
        numberInput(
          d,
          3,
          6,
          `חַשְּׁבוּ ${Math.min(maxForDay, subBase + 5)} - 5`,
          Math.min(maxForDay, subBase + 5) - 5,
          ["subtraction"],
          dayDifficulty,
          "abstract",
          0,
          20,
        ),
        trueFalse(
          d,
          3,
          7,
          d === 4
            ? "הַאִם נָכוֹן: 12 - 4 = 8?"
            : d === 5
              ? "הַאִם נָכוֹן: 14 גָּדוֹל מִ-11?"
              : d === 2
                ? "הַאִם נָכוֹן: 9 - 1 = 8?"
              : d === 3
                ? "הַאִם נָכוֹן: 6 + 3 = 9?"
                : "הַאִם נָכוֹן: 10 - 2 = 8?",
          true,
          d === 5 ? ["comparing"] : d === 3 ? ["addition"] : ["subtraction"],
          dayDifficulty,
          "abstract",
        ),
        numberLineJump(
          d,
          3,
          8,
          d === 1
            ? `עַל קַו מִסְפָּרִים: מִ-0 עַד ${countingCap} בְּקְפִיצָה שֶׁל 1. כַּמָּה קְפִיצוֹת?`
            : d === 2
              ? `הִתְקַדְּמוּ מִ-0 עַד ${countingCap}, צַעַד אֶחָד כָּל פַּעַם. כַּמָּה צְעָדִים?`
              : "מִתְחִילִים בְּ-2 וְקוֹפְצִים בְּ-2 עַד 12. כַּמָּה קְפִיצוֹת?",
          d <= 2 ? 0 : 2,
          d <= 2 ? countingCap : 12,
          d <= 2 ? 1 : 2,
          d <= 2 ? countingCap : 5,
          d <= 2 ? ["counting", "number-line"] : ["number-line", "patterns"],
          dayDifficulty,
          "pictorial",
        ),
      ],
    },
    {
      id: toSectionId(d, 4),
      title: "בְּעָיוֹת מִילּוּלִיּוֹת",
      type: "verbal",
      learningGoal: "לְתַרְגֵּם סִפּוּר לִתְרַגִּיל חִיבּוּר אוֹ חִיסּוּר.",
      prerequisiteSkillTags: ["word-problems", "addition", "subtraction"],
      exercises: [
        numberInput(
          d,
          4,
          1,
          `דֻּגְמָה: לְעִידוֹ יֵשׁ ${addBase + 2} גֻּלּוֹת וְהוּא קִבֵּל עוֹד 2. כַּמָּה יֵשׁ לוֹ?`,
          addBase + 4,
          ["word-problems", "addition"],
          dayDifficulty,
          "pictorial",
          0,
          20,
        ),
        numberInput(
          d,
          4,
          2,
          `לְנֹעַם יֵשׁ ${subBase + 2} מַדְבֵּקוֹת. הוּא נָתַן 3. כַּמָּה נִשְׁאָרוּ?`,
          subBase - 1,
          ["word-problems", "subtraction"],
          dayDifficulty,
          "pictorial",
          0,
          20,
        ),
        numberInput(
          d,
          4,
          3,
          `בַּסַּל יֵשׁ ${addBase + 1} תַּפּוּחִים. מוֹסִיפִים 4. כַּמָּה יֵשׁ?`,
          addBase + 5,
          ["word-problems", "addition"],
          dayDifficulty,
          "pictorial",
          0,
          20,
        ),
        numberInput(
          d,
          4,
          4,
          `בַּצֶּלַחַת הָיוּ ${subBase + 4} עוּגִיּוֹת. אָכְלוּ 5. כַּמָּה נִשְׁאָרוּ?`,
          subBase - 1,
          ["word-problems", "subtraction"],
          dayDifficulty,
          "pictorial",
          0,
          20,
        ),
        numberInput(
          d,
          4,
          5,
          `בַּכִּתָּה ${addBase + 3} יְלָדִים וְעוֹד 3 הִצְטָרְפוּ. כַּמָּה יְלָדִים יֵשׁ?`,
          addBase + 6,
          ["word-problems", "addition"],
          dayDifficulty,
          "abstract",
          0,
          20,
        ),
        numberInput(
          d,
          4,
          6,
          `הָיוּ ${Math.min(maxForDay, subBase + 6)} בָּלוֹנִים. 4 הִתְפּוֹצְצוּ. כַּמָּה נִשְׁאָרוּ?`,
          Math.min(maxForDay, subBase + 6) - 4,
          ["word-problems", "subtraction"],
          dayDifficulty,
          "abstract",
          0,
          20,
        ),
        multipleChoice(
          d,
          4,
          7,
          d === 7
            ? "בְּסִפּוּר 'הָיוּ 15 וְאָכְלוּ 4' אֵיזוֹ פְּעוּלָה נַעֲשֶׂה?"
            : "אֵיזוֹ פְּעוּלָה נַעֲשֶׂה כְּשֶׁכָּתוּב 'נִשְׁאֲרוּ'?",
          ["חִיבּוּר", "חִיסּוּר", "סְפִירָה לְלֹא פְּעוּלָה"],
          "חִיסּוּר",
          ["word-problems", "subtraction"],
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          4,
          8,
          d === 7
            ? "לְגִיל הָיוּ 11 קַלָּפִים. הוּא קִבֵּל עוֹד 5. כַּמָּה קַלָּפִים יֵשׁ לוֹ?"
            : `לְדָנִי הָיוּ ${addBase + 4} גֻּלּוֹת. הוּא קִבֵּל עוֹד 2. כַּמָּה יֵשׁ לוֹ?`,
          d === 7 ? 16 : addBase + 6,
          ["word-problems", "addition"],
          dayDifficulty,
          "pictorial",
          0,
          20,
        ),
      ],
    },
    {
      id: toSectionId(d, 5),
      title: "סִכּוּם וּבְדִיקַת עַצְמִי",
      type: "review",
      learningGoal: "לְוַדֵּא הֲבָנָה בִּתְרַגִּילִים מְשֻׁלָּבִים.",
      prerequisiteSkillTags: [...concept.mainTags, ...concept.spiralReviewTags],
      exercises: [
        multipleChoice(
          d,
          5,
          1,
          `דֻּגְמָה: חַשְּׁבוּ ${addBase + 3} + 2`,
          [`${addBase + 4}`, `${addBase + 5}`, `${addBase + 6}`],
          `${addBase + 5}`,
          ["addition"],
          dayDifficulty,
          "abstract",
        ),
        multipleChoice(
          d,
          5,
          2,
          `חַשְּׁבוּ ${subBase + 3} - 3`,
          [`${subBase - 1}`, `${subBase}`, `${subBase + 1}`],
          `${subBase}`,
          ["subtraction"],
          dayDifficulty,
          "abstract",
        ),
        trueFalse(
          d,
          5,
          3,
          `הַאִם נָכוֹן: ${addBase + 2} + 4 = ${addBase + 6}?`,
          true,
          ["addition", "comparing"],
          dayDifficulty,
          "abstract",
        ),
        trueFalse(
          d,
          5,
          4,
          `הַאִם נָכוֹן: ${subBase + 5} - 2 = ${subBase + 4}?`,
          false,
          ["subtraction", "comparing"],
          dayDifficulty,
          "abstract",
        ),
        multipleChoice(
          d,
          5,
          5,
          `בְּעָיָה: לְיָעֵל הָיוּ ${addBase + 2} מַדְבֵּקוֹת וְהִיא קִבְּלָה 3. כַּמָּה עַכְשָׁיו?`,
          [`${addBase + 4}`, `${addBase + 5}`, `${addBase + 6}`],
          `${addBase + 5}`,
          ["word-problems", "addition"],
          dayDifficulty,
          "pictorial",
        ),
        multipleChoice(
          d,
          5,
          6,
          `בְּעָיָה: בַּקֻּפְסָה הָיוּ ${subBase + 4} קוּבִּיּוֹת. הוֹצִיאוּ 4. כַּמָּה נִשְׁאָרוּ?`,
          [`${subBase - 1}`, `${subBase}`, `${subBase + 1}`],
          `${subBase}`,
          ["word-problems", "subtraction"],
          dayDifficulty,
          "pictorial",
        ),
        numberLineJump(
          d,
          5,
          7,
          d === 1
            ? "עַל קַו מִסְפָּרִים: מִ-1 עַד 5 בְּקְפִיצוֹת שֶׁל 1. כַּמָּה קְפִיצוֹת?"
            : d === 2
              ? "עַל קַו מִסְפָּרִים: מִ-0 עַד 10 בְּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת?"
              : "עַל קַו מִסְפָּרִים: מִ-4 עַד 14 בְּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת?",
          d === 1 ? 1 : d === 2 ? 0 : 4,
          d === 1 ? 5 : d === 2 ? 10 : 14,
          d === 1 ? 1 : 2,
          d === 1 ? 4 : 5,
          ["number-line", "patterns"],
          dayDifficulty,
          "abstract",
        ),
        trueFalse(
          d,
          5,
          8,
          d === 3
            ? "הַאִם נָכוֹן: 7 + 2 = 10?"
            : d === 4
              ? "הַאִם נָכוֹן: 13 - 3 = 10?"
              : d === 5
                ? "הַאִם נָכוֹן: 16 גָּדוֹל מִ-12?"
                : "הַאִם נָכוֹן: 9 + 1 = 10?",
          d === 3 ? false : true,
          d === 5 ? ["comparing"] : d === 4 ? ["subtraction"] : ["addition"],
          dayDifficulty,
          "abstract",
        ),
      ],
    },
    {
      id: toSectionId(d, 6),
      title: "תִּרְגּוּל מְמוּקָּד בְּנוֹשֵׂא הַיּוֹם",
      type: "challenge",
      learningGoal: "לְבַסֵּס שְׁטִיפוּת בְּנוֹשֵׂא הַיּוֹם עִם 8 מְשִׂימוֹת נוֹסָפוֹת.",
      prerequisiteSkillTags: [focusTag, ...concept.mainTags],
      exercises: [
        numberInput(d, 6, 1, focusedDrillPrompt(spacedDrillOrder[0]).prompt, focusedDrillPrompt(spacedDrillOrder[0]).answer, focusedDrillPrompt(spacedDrillOrder[0]).tags, dayDifficulty, "abstract"),
        numberInput(d, 6, 2, focusedDrillPrompt(spacedDrillOrder[1]).prompt, focusedDrillPrompt(spacedDrillOrder[1]).answer, focusedDrillPrompt(spacedDrillOrder[1]).tags, dayDifficulty, "abstract"),
        numberInput(d, 6, 3, focusedDrillPrompt(spacedDrillOrder[2]).prompt, focusedDrillPrompt(spacedDrillOrder[2]).answer, focusedDrillPrompt(spacedDrillOrder[2]).tags, dayDifficulty, "abstract"),
        numberInput(d, 6, 4, focusedDrillPrompt(spacedDrillOrder[3]).prompt, focusedDrillPrompt(spacedDrillOrder[3]).answer, focusedDrillPrompt(spacedDrillOrder[3]).tags, dayDifficulty, "abstract"),
        numberInput(d, 6, 5, focusedDrillPrompt(spacedDrillOrder[4]).prompt, focusedDrillPrompt(spacedDrillOrder[4]).answer, focusedDrillPrompt(spacedDrillOrder[4]).tags, dayDifficulty, "abstract"),
        numberInput(d, 6, 6, focusedDrillPrompt(spacedDrillOrder[5]).prompt, focusedDrillPrompt(spacedDrillOrder[5]).answer, focusedDrillPrompt(spacedDrillOrder[5]).tags, dayDifficulty, "abstract"),
        numberInput(d, 6, 7, focusedDrillPrompt(spacedDrillOrder[6]).prompt, focusedDrillPrompt(spacedDrillOrder[6]).answer, focusedDrillPrompt(spacedDrillOrder[6]).tags, dayDifficulty, "abstract"),
        numberInput(d, 6, 8, focusedDrillPrompt(spacedDrillOrder[7]).prompt, focusedDrillPrompt(spacedDrillOrder[7]).answer, focusedDrillPrompt(spacedDrillOrder[7]).tags, dayDifficulty, "abstract"),
      ],
    },
  ];
};

/** מקטע «מושג היום» מורחב אחרי חימום — כל התרגילים נגזרים מ־DayConcept (לכיתה ב׳). */
function buildProgressiveConceptFocusSection(
  concept: DayConcept,
  dayDifficulty: DifficultyLevel,
): Section {
  const d = concept.dayNumber;
  const tags = concept.mainTags;
  const hasTag = (tag: SkillTag) => tags.includes(tag);
  const hasWordProblems = hasTag("word-problems");
  const hasPlaceValue = hasTag("place-value");
  const a = concept.arithmeticAnswer;
  const exercises: Exercise[] = [];
  let exNum = 1;

  exercises.push(
    numberInput(d, 2, exNum++, concept.arithmeticPrompt, a, tags, dayDifficulty, "concrete"),
  );
  exercises.push(
    multipleChoice(
      d,
      2,
      exNum++,
      "בַּחֲרוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
      concept.arithmeticMcOptions,
      concept.arithmeticMcAnswer,
      tags,
      dayDifficulty,
      "pictorial",
    ),
  );

  if (a >= 3) {
    const placeValueNumber = Math.min(999, Math.max(10, a + 10));
    const placeValueTens = Math.floor(placeValueNumber / 10);
    exercises.push(
      numberInput(
        d,
        2,
        exNum++,
        hasPlaceValue
          ? `בַּמִּסְפָּר ${placeValueNumber}, כַּמָּה עֲשָׂרוֹת יֵשׁ?`
          : hasWordProblems
            ? `בְּעָיָה: הָיוּ ${a} עִפְּרוֹנוֹת. הִשְׁתַּמְּשׁוּ בְּ-3. כַּמָּה נִשְׁאֲרוּ?`
            : `תִרְגּוּל הַמְשָׁךְ לְנוֹשֵׂא הַיּוֹם: חַשְּׁבוּ ${a} - 3`,
        hasPlaceValue ? placeValueTens : a - 3,
        hasPlaceValue ? ["place-value", ...tags] : tags,
        dayDifficulty,
        "abstract",
        0,
        400,
      ),
    );
  }

  const placeValueNumber2 = Math.min(999, Math.max(10, a + 10));
  const placeValueTensBase = Math.floor(placeValueNumber2 / 10) * 10;
  const placeValueOnes = placeValueNumber2 - placeValueTensBase;
  exercises.push(
    numberInput(
      d,
      2,
      exNum++,
      hasPlaceValue
        ? `כַּמָּה צָרִיךְ לְהוֹסִיף לְ-${placeValueTensBase} כְּדֵי לְהַגִּיעַ לְ-${placeValueNumber2}?`
        : hasWordProblems
          ? `בְּעָיָה: לְדָנִי הָיוּ ${a + 2} מַדְבֵּקוֹת. הוּא נָתַן 2. כַּמָּה הָיוּ לוֹ לִפְנֵי שֶׁנָּתַן?`
          : `תִרְגּוּל הַמְשָׁךְ: חַשְּׁבוּ ${a} + 2`,
      hasPlaceValue ? placeValueOnes : hasWordProblems ? a : a + 2,
      hasPlaceValue ? ["place-value", "number-bonds", ...tags] : tags,
      dayDifficulty,
      "abstract",
      0,
      400,
    ),
  );

  exercises.push(
    numberInput(
      d,
      2,
      exNum++,
      `חִזּוּק: חַשְּׁבוּ ${a} + 10`,
      a + 10,
      tags,
      dayDifficulty,
      "abstract",
      0,
      400,
    ),
  );

  const roughSpan = Math.min(100, Math.max(20, a + 20));
  const step: 1 | 2 | 3 | 5 = roughSpan > 55 ? 5 : roughSpan > 30 ? 3 : 2;
  const start = Math.max(0, a - (d % 5));
  let end = Math.min(100, start + step * (4 + (d % 4)));
  if (end <= start + step) {
    end = start + step * 5;
  }
  let jumpLen = end - start;
  const rem = jumpLen % step;
  if (rem !== 0) {
    end -= rem;
    jumpLen = end - start;
  }
  const numJumps = jumpLen / step;
  if (numJumps >= 2 && numJumps <= 24) {
    exercises.push(
      numberLineJump(
        d,
        2,
        exNum++,
        `מֵאַחַר הַחִימּוּם — עַל קַו מִסְפָּרִים: מִ-${start} עַד ${end} בִּקְפִיצוֹת שֶׁל ${step}. כַּמָּה קְפִיצוֹת?`,
        start,
        end,
        step,
        numJumps,
        ["number-line", ...tags],
        dayDifficulty,
        "abstract",
      ),
    );
  }

  return {
    id: toSectionId(d, 2),
    title: `מוּשָׂג הַיּוֹם: ${concept.title}`,
    type: "arithmetic",
    learningGoal:
      "לְהַעֲמִיק בְּמוּשַׂג הַיּוֹם אַחֲרֵי הַחִימּוּם — בִּתְרַגּוּל מְדַרְגָּתִי עַל אוֹתוֹ נוֹשֵׂא.",
    prerequisiteSkillTags: concept.mainTags,
    example: {
      title: "דֻּגְמָה פְּתוּרָה",
      prompt: `דֻּגְמָה: ${concept.arithmeticPrompt}`,
      steps: [
        "קוֹרְאִים אֶת הַשְּׁאֵלָה וּמְזַהִים מָה צָרִיךְ לִמְצֹא.",
        `פּוֹתְרִים בְּצַעַדִים קְטַנִּים וּמַגִּיעִים לִתְשׁוּבָה: ${concept.arithmeticAnswer}.`,
        "בּוֹדְקִים שֶׁהַתְּשׁוּבָה הִגְיוֹנִית.",
      ],
      takeaway:
        "אַחַר חִימּוּם — מַתְמִידִים בְּנוֹשֵׂא הַיּוֹם בִּתְרַגּוּלִים נוֹסָפִים לִפְנֵי שָׂפָה וַאֶתְגָּר.",
    },
    exercises,
  };
}

export type BuildDaySectionOptions = {
  simpleSections: boolean;
  /** כיתה ב׳ (וימים < 29): אחרי חימום — מקטע מושג היום מורחב שנבנה רק מ־DayConcept */
  progressiveConceptFocus?: boolean;
};

export function buildDayFromConcepts(
  allConcepts: DayConcept[],
  concept: DayConcept,
  options: BuildDaySectionOptions,
): WorkbookDay {
  const { simpleSections, progressiveConceptFocus } = options;
  const dayDifficulty = Math.min(5, Math.ceil(concept.dayNumber / 3)) as DifficultyLevel;
  const week = concept.dayNumber >= 29 ? 5 : Math.min(4, Math.ceil(concept.dayNumber / 7));
  const priorConcepts = allConcepts.filter(
    (c) => c.dayNumber < concept.dayNumber && c.dayNumber >= concept.dayNumber - 3,
  );

  const defaultSections: Section[] = [
    {
      id: toSectionId(concept.dayNumber, 1),
      title: "חִימּוּם וַחֲזָרַת סְפִּירָלָה",
      type: "warmup",
      learningGoal: "לְהִיזָּכֵר בְּנוֹשְׂאִים מִיָּמִים קוֹדְמִים בְּ-3–4 תַּרְגּוּלִים קְצָרִים.",
      prerequisiteSkillTags: concept.spiralReviewTags,
      exercises: buildSpiralWarmupExercises(concept, priorConcepts, dayDifficulty),
    },
    {
      id: toSectionId(concept.dayNumber, 2),
      title: "מוּשָׂג הַיּוֹם - מִתְנַסִּים",
      type: "arithmetic",
      learningGoal: "לְהָבִין אֶת מוּשַׂג הַיּוֹם בְּמַעֲבָר מִמּוּחָשִׁי, לְיִיצּוּגִי, וּלְסִמְלִי.",
      prerequisiteSkillTags: concept.mainTags,
      example: {
        title: "דֻּגְמָה פְּתוּרָה",
        prompt: concept.arithmeticPrompt,
        steps: [
          "קוֹרְאִים אֶת הַשְּׁאֵלָה וּמְזַהִים מָה יָדוּעַ.",
          "בוֹחֲרִים דֶּרֶךְ פְּתִירָה מַתְאִימָה (סְפִירָה, קַו מִסְפָּרִים אוֹ פֵּרוּק).",
          `פּוֹתְרִים שָׁלָב אַחַר שָׁלָב וּמְקַבְּלִים: ${concept.arithmeticAnswer}.`,
          "בּוֹדְקִים שֶׁהַתְּשׁוּבָה הַגְיוֹנִית לְפִי הַשְּׁאֵלָה.",
        ],
        takeaway: "רַעְיוֹן מֶרְכָּזִי: פּוֹתְרִים בִּשְׁלָבִים קְצָרִים וּבוֹדְקִים אֶת הַתּוֹצָאָה.",
      },
      exercises: [
        numberInput(
          concept.dayNumber,
          2,
          1,
          concept.arithmeticPrompt,
          concept.arithmeticAnswer,
          concept.mainTags,
          dayDifficulty,
          "concrete",
        ),
        multipleChoice(
          concept.dayNumber,
          2,
          2,
          "בַּחֲרוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
          concept.arithmeticMcOptions,
          concept.arithmeticMcAnswer,
          concept.mainTags,
          dayDifficulty,
          "pictorial",
        ),
        numberLineJump(
          concept.dayNumber,
          2,
          3,
          concept.dayNumber <= 8
            ? "הַשְׁלִימוּ קְפִיצוֹת עַל קַו הַמִּסְפָּרִים."
            : "הַשְׁלִימוּ קְפִיצוֹת עַל קַו הַמִּסְפָּרִים: מִ-0 עַד 20 בִּקְפִיצוֹת שֶׁל 2.",
          concept.dayNumber <= 5 ? 0 : concept.dayNumber <= 8 ? concept.dayNumber : 0,
          concept.dayNumber <= 8 ? 10 : 20,
          concept.dayNumber <= 8 ? 1 : 2,
          concept.dayNumber <= 8 ? 10 - (concept.dayNumber <= 5 ? 0 : concept.dayNumber) : 10,
          ["number-line", ...concept.mainTags],
          dayDifficulty,
          "abstract",
        ),
      ],
    },
    {
      id: toSectionId(concept.dayNumber, 3),
      title: concept.geometryPrompt ? "שָׂפָה מָתֵמָטִית וְצוּרוֹת" : "שָׂפָה מָתֵמָטִית",
      type: concept.geometryPrompt ? "geometry" : "verbal",
      learningGoal: "לְהַסְבִּיר וּלְנַסֵּחַ יֶדַע מָתֵמָטִי בְּמִילִּים וּבְיִיצּוּגִים.",
      prerequisiteSkillTags: concept.mainTags,
      exercises: [
        verbalInput(
          concept.dayNumber,
          3,
          1,
          concept.verbalPrompt,
          concept.verbalAnswer,
          ["number-recognition"],
          dayDifficulty,
          "pictorial",
        ),
        concept.geometryPrompt && concept.geometryAnswer
          ? shapeChoice(
              concept.dayNumber,
              3,
              2,
              concept.geometryPrompt,
              concept.geometryAnswer,
              ["geometry-shapes"],
              dayDifficulty,
              "concrete",
            )
          : multipleChoice(
              concept.dayNumber,
              3,
              2,
              "אֵיזֶה מִשְׁפָּט מָתֵמָטִי מַתְאִים?",
              ["הַמִּסְפָּר גָּדֵל", "הַמִּסְפָּר קָטֵן", "הַמִּסְפָּר נִשְׁאָר קָבוּעַ"],
              "הַמִּסְפָּר גָּדֵל",
              ["word-problems", "comparing"],
              dayDifficulty,
              "abstract",
            ),
      ],
    },
    {
      id: toSectionId(concept.dayNumber, 4),
      title: "בְּדִיקַת הֲבָנָה",
      type: "review",
      learningGoal: "לְזַהוֹת טָעוּיוֹת נְפוֹצוֹת וּלְבַסֵּס הֲבָנָה מְדוּיֶּקֶת.",
      prerequisiteSkillTags: [...concept.spiralReviewTags, ...concept.mainTags],
      exercises: [
        trueFalse(
          concept.dayNumber,
          4,
          1,
          concept.reviewPrompt,
          concept.reviewAnswer,
          concept.spiralReviewTags,
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          concept.dayNumber,
          4,
          2,
          "פִּתְרוּ מְשִׂימַת בְּדִיקָה קְצָרָה.",
          concept.arithmeticAnswer,
          concept.mainTags,
          dayDifficulty,
          "abstract",
        ),
      ],
    },
    {
      id: toSectionId(concept.dayNumber, 5),
      title: "אֶתְגָּר מְסַכֵּם",
      type: "challenge",
      learningGoal: "לְיַישֵׂם אֶת הַמּוּשָׂגִים בִּמְשִׂימָה מְאַתְגֶּרֶת בְּרָמַת עַצְמָאוּת גְּבוֹהָה.",
      prerequisiteSkillTags: [...concept.mainTags, ...concept.spiralReviewTags],
      exercises: [
        numberInput(
          concept.dayNumber,
          5,
          1,
          concept.challengePrompt,
          concept.challengeAnswer,
          ["number-line", "patterns", ...concept.mainTags],
          dayDifficulty,
          "abstract",
        ),
        multipleChoice(
          concept.dayNumber,
          5,
          2,
          "בַּחֲרוּ דֶּרֶךְ פְּתִירָה מַתְאִימָה.",
          ["סְפִירָה בָּאֶצְבָּעוֹת", "קַו מִסְפָּרִים", "פֵּרוּק לַעֲשָׂרוֹת וַאֲחָדוֹת"],
          concept.dayNumber >= 10 ? "פֵּרוּק לַעֲשָׂרוֹת וַאֲחָדוֹת" : "קַו מִסְפָּרִים",
          ["word-problems", "number-line", "place-value"],
          dayDifficulty,
          "abstract",
        ),
      ],
    },
  ];

  let sections: Section[];
  if (progressiveConceptFocus && concept.dayNumber < 29) {
    sections = [
      defaultSections[0],
      buildProgressiveConceptFocusSection(concept, dayDifficulty),
      ...defaultSections.slice(2),
    ];
  } else if (simpleSections) {
    sections = defaultSections;
  } else if (concept.dayNumber <= 7) {
    sections = buildExpandedExercisesForEarlyDays(concept, dayDifficulty, priorConcepts);
  } else if (concept.dayNumber <= 14) {
    sections = buildExpandedExercisesForDay(concept, dayDifficulty, priorConcepts);
  } else {
    sections = defaultSections;
  }

  return {
    id: toDayId(concept.dayNumber),
    dayNumber: concept.dayNumber,
    title: concept.title,
    week,
    objective: concept.objective,
    spiralReviewTags: concept.spiralReviewTags,
    unlockThresholdPercent: 90,
    sections,
  };
}

export const workbookDays: WorkbookDay[] = concepts.map((c) =>
  buildDayFromConcepts(concepts, c, { simpleSections: false }),
);

export const workbookDaysById: Record<WorkbookDay["id"], WorkbookDay> = workbookDays.reduce(
  (acc, day) => {
    acc[day.id] = day;
    return acc;
  },
  {} as Record<WorkbookDay["id"], WorkbookDay>,
);

/** מספר ימי הלמידה בחוברת — לשימוש במפת תוכנית ובמדדי התקדמות */
export const WORKBOOK_TOTAL_DAYS = workbookDays.length;

