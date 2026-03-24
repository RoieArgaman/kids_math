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

type DayConcept = {
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
  step: 1 | 2 | 5,
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

const concepts: DayConcept[] = [
  {
    dayNumber: 1,
    title: "מוֹנִים עַד 5",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִמְנֶה עַד 5 בְּדִיּוּק שֶׁל 5 מִתּוֹךְ 6 מְשִׂימוֹת סְפִירָה.",
    mainTags: ["counting", "number-recognition"],
    spiralReviewTags: ["counting"],
    arithmeticPrompt: "יֵשׁ 2 תַּפּוּחִים וּמִצְטָרֵף עוֹד תַּפּוּחַ. כַּמָּה תַּפּוּחִים עַכְשָׁיו?",
    arithmeticAnswer: 3,
    arithmeticMcOptions: ["2", "3", "4"],
    arithmeticMcAnswer: "3",
    verbalPrompt: "כִּתְבוּ בְּמִילָּה: הַמִּסְפָּר 4",
    verbalAnswer: "אַרְבַּע",
    reviewPrompt: "הַמִּשְׁפָּט נָכוֹן? 5 גָּדוֹל מִ-2",
    reviewAnswer: true,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים מַתְחִילִים בְּ-1 וְקוֹפְצִים בִּקְפִיצוֹת שֶׁל 1 עַד 5. כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 4,
    geometryPrompt: "אֵיזוֹ צוּרָה הִיא עִיגּוּל?",
    geometryAnswer: "circle",
  },
  {
    dayNumber: 2,
    title: "מוֹנִים עַד 10",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְזַהֶה וְיִכְתּוֹב מִסְפָּרִים עַד 10 בְּ-80% הַצְלָחָה.",
    mainTags: ["counting", "number-recognition", "addition"],
    spiralReviewTags: ["counting", "number-recognition"],
    arithmeticPrompt: "יֵשׁ 4 כַּדּוּרִים וּמוֹסִיפִים עוֹד 2. כַּמָּה כַּדּוּרִים יֵשׁ?",
    arithmeticAnswer: 6,
    arithmeticMcOptions: ["5", "6", "7"],
    arithmeticMcAnswer: "6",
    verbalPrompt: "כִּתְבוּ בְּמִילָּה: הַמִּסְפָּר 7",
    verbalAnswer: "שֶׁבַע",
    reviewPrompt: "הַמִּשְׁפָּט נָכוֹן? 3 קָטָן מִ-9",
    reviewAnswer: true,
    challengePrompt: "עַל קַו הַמִּסְפָּרִים מַתְחִילִים בְּ-0 וְקוֹפְצִים עַד 10 בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 5,
    geometryPrompt: "אֵיזוֹ צוּרָה הִיא רִיבּוּעַ?",
    geometryAnswer: "square",
  },
  {
    dayNumber: 3,
    title: "חִיבּוּר עַד 10",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִפְתּוֹר/תִּפְתּוֹר תַּרְגִּילֵי חִיבּוּר עַד 10 בְּרָמַת דִּיּוּק שֶׁל 4 מִתּוֹךְ 5.",
    mainTags: ["addition", "number-line"],
    spiralReviewTags: ["counting", "number-recognition"],
    arithmeticPrompt: "5 + 3 = ?",
    arithmeticAnswer: 8,
    arithmeticMcOptions: ["7", "8", "9"],
    arithmeticMcAnswer: "8",
    verbalPrompt: "כִּתְבוּ בְּמִילָּה: הַמִּסְפָּר 8",
    verbalAnswer: "שְׁמוֹנֶה",
    reviewPrompt: "הַמִּשְׁפָּט נָכוֹן? 6 + 1 = 7",
    reviewAnswer: true,
    challengePrompt: "מַתְחִילִים בְּ-2 וּמַגִּיעִים לְ-10 בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 4,
  },
  {
    dayNumber: 4,
    title: "חִיסּוּר עַד 10",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִפְתּוֹר/תִּפְתּוֹר לְפָחוֹת 4 מִתּוֹךְ 5 תַּרְגִּילֵי חִיסּוּר עַד 10.",
    mainTags: ["subtraction", "addition"],
    spiralReviewTags: ["addition", "number-line"],
    arithmeticPrompt: "9 - 4 = ?",
    arithmeticAnswer: 5,
    arithmeticMcOptions: ["4", "5", "6"],
    arithmeticMcAnswer: "5",
    verbalPrompt: "כִּתְבוּ בְּמִילָּה: הַמִּסְפָּר 5",
    verbalAnswer: "חָמֵשׁ",
    reviewPrompt: "הַמִּשְׁפָּט נָכוֹן? 10 - 3 = 8",
    reviewAnswer: false,
    challengePrompt: "מַתְחִילִים בְּ-10 וְיוֹרְדִים לְ-2 בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 4,
  },
  {
    dayNumber: 5,
    title: "הַשְׁוָאַת מִסְפָּרִים",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְשַׁוֶּה זוּגוֹת מִסְפָּרִים עַד 20 בְּ-80% הַצְלָחָה.",
    mainTags: ["comparing", "number-recognition"],
    spiralReviewTags: ["addition", "subtraction"],
    arithmeticPrompt: "אֵיזֶה מִסְפָּר גָּדוֹל יוֹתֵר: 14 אוֹ 11? כִּתְבוּ אֶת הַגָּדוֹל.",
    arithmeticAnswer: 14,
    arithmeticMcOptions: ["14", "11", "שָׁוִים"],
    arithmeticMcAnswer: "14",
    verbalPrompt: "כִּתְבוּ בְּמִילָּה: הַמִּסְפָּר 10",
    verbalAnswer: "עֶשֶׂר",
    reviewPrompt: "הַמִּשְׁפָּט נָכוֹן? 9 גָּדוֹל מִ-13",
    reviewAnswer: false,
    challengePrompt: "מַתְחִילִים בְּ-6 וּמַגִּיעִים לְ-16 בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 5,
  },
  {
    dayNumber: 6,
    title: "חִיבּוּר וְחִיסּוּר עַד 20",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִפְתּוֹר/תִּפְתּוֹר תַּרְגִּילִים מְעוֹרָבִים עַד 20 בְּדִיּוּק שֶׁל 4 מִתּוֹךְ 5.",
    mainTags: ["addition", "subtraction", "number-line"],
    spiralReviewTags: ["comparing", "addition"],
    arithmeticPrompt: "12 + 5 = ?",
    arithmeticAnswer: 17,
    arithmeticMcOptions: ["16", "17", "18"],
    arithmeticMcAnswer: "17",
    verbalPrompt: "כִּתְבוּ בְּמִילָּה: הַמִּסְפָּר 12",
    verbalAnswer: "שְׁתֵּים עֶשְׂרֵה",
    reviewPrompt: "הַמִּשְׁפָּט נָכוֹן? 18 - 7 = 11",
    reviewAnswer: true,
    challengePrompt: "מַתְחִילִים בְּ-1 וּמַגִּיעִים לְ-11 בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 5,
  },
  {
    dayNumber: 7,
    title: "בְּעָיוֹת מִילּוּלִיּוֹת פְּשׁוּטוֹת",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִפְתּוֹר/תִּפְתּוֹר 3 מִתּוֹךְ 4 בְּעָיוֹת מִילּוּלִיּוֹת חַד-שְׁלָבִיּוֹת.",
    mainTags: ["word-problems", "addition", "subtraction"],
    spiralReviewTags: ["number-line", "comparing"],
    arithmeticPrompt: "לְדָנָה הָיוּ 7 מַדְבֵּקוֹת וְקִבְּלָה עוֹד 6. כַּמָּה מַדְבֵּקוֹת יֵשׁ לָהּ עַכְשָׁיו?",
    arithmeticAnswer: 13,
    arithmeticMcOptions: ["12", "13", "14"],
    arithmeticMcAnswer: "13",
    verbalPrompt: "כִּתְבוּ בְּמִילָּה: הַמִּסְפָּר 13",
    verbalAnswer: "שְׁלוֹשׁ עֶשְׂרֵה",
    reviewPrompt: "הַמִּשְׁפָּט נָכוֹן? אִם יֵשׁ 15 עוּגִיּוֹת וְאָכְלוּ 5 נִשְׁאָרוֹת 10",
    reviewAnswer: true,
    challengePrompt: "עַל קַו מִסְפָּרִים: מִ-3 לְ-13 בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 5,
  },
  {
    dayNumber: 8,
    title: "צוּרוֹת וְגוּפִים בְּסִיסִיִּים",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְזַהֶה צוּרוֹת בְּסִיסִיּוֹת וִיתָאֵר תְּכוּנָה אַחַת נְכוֹנָה בְּ-80% הַצְלָחָה.",
    mainTags: ["geometry-shapes", "comparing"],
    spiralReviewTags: ["word-problems", "addition"],
    arithmeticPrompt: "לִמְשֻׁלָּשׁ יֵשׁ 3 צְלָעוֹת. לִשְׁנֵי מְשֻׁלָּשִׁים יַחַד יֵשׁ כַּמָּה צְלָעוֹת?",
    arithmeticAnswer: 6,
    arithmeticMcOptions: ["5", "6", "7"],
    arithmeticMcAnswer: "6",
    verbalPrompt: "כִּתְבוּ בְּמִילָּה: הַמִּסְפָּר 6",
    verbalAnswer: "שֵׁשׁ",
    reviewPrompt: "הַמִּשְׁפָּט נָכוֹן? לְמַלְבֵּן תָּמִיד יֵשׁ 4 צְלָעוֹת",
    reviewAnswer: true,
    challengePrompt: "מַתְחִילִים בְּ-4 וּמַגִּיעִים לְ-14 בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 5,
    geometryPrompt: "בַּחֲרוּ אֶת הַצּוּרָה שֶׁיֵּשׁ לָהּ 3 צְלָעוֹת",
    geometryAnswer: "triangle",
  },
  {
    dayNumber: 9,
    title: "דְּפוּסִים וְסִדְרוֹת",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַשְׁלִים/תַּשְׁלִים סִדְרוֹת מִסְפָּרִיּוֹת בְּ-4 מִתּוֹךְ 5 מְשִׂימוֹת.",
    mainTags: ["patterns", "number-line"],
    spiralReviewTags: ["geometry-shapes", "word-problems"],
    arithmeticPrompt: "הַשְׁלִימוּ סִדְרָה: 2, 4, 6, __",
    arithmeticAnswer: 8,
    arithmeticMcOptions: ["7", "8", "10"],
    arithmeticMcAnswer: "8",
    verbalPrompt: "כִּתְבוּ בְּמִילָּה: הַמִּסְפָּר 14",
    verbalAnswer: "אַרְבַּע עֶשְׂרֵה",
    reviewPrompt: "הַמִּשְׁפָּט נָכוֹן? בַּסִּדְרָה 1,3,5 הַמִּסְפָּר הַבָּא הוּא 7",
    reviewAnswer: true,
    challengePrompt: "מַתְחִילִים בְּ-5 וּמַגִּיעִים לְ-15 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 2,
  },
  {
    dayNumber: 10,
    title: "עֵרֶךְ הַמָּקוֹם בַּעֲשָׂרוֹת",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְזַהֶה עֲשָׂרוֹת וַאֲחָדוֹת בְּמִסְפָּרִים עַד 99 בְּ-80% הַצְלָחָה.",
    mainTags: ["place-value", "number-recognition"],
    spiralReviewTags: ["patterns", "subtraction"],
    arithmeticPrompt: "בַּמִּסְפָּר 34 כַּמָּה עֲשָׂרוֹת יֵשׁ? כִּתְבוּ מִסְפָּר.",
    arithmeticAnswer: 3,
    arithmeticMcOptions: ["3", "4", "7"],
    arithmeticMcAnswer: "3",
    verbalPrompt: "כִּתְבוּ בְּמִילָּה: הַמִּסְפָּר 20",
    verbalAnswer: "עֶשְׂרִים",
    reviewPrompt: "הַמִּשְׁפָּט נָכוֹן? בַּמִּסְפָּר 52 יֵשׁ 5 עֲשָׂרוֹת",
    reviewAnswer: true,
    challengePrompt: "מַתְחִילִים בְּ-10 וּמַגִּיעִים לְ-30 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 4,
  },
  {
    dayNumber: 11,
    title: "חִיבּוּר בַּעֲשָׂרוֹת",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִפְתּוֹר/תִּפְתּוֹר תַּרְגִּילֵי חִיבּוּר בַּעֲשָׂרוֹת שְׁלֵמוֹת בְּ-4 מִתּוֹךְ 5 מְשִׂימוֹת.",
    mainTags: ["addition", "place-value"],
    spiralReviewTags: ["place-value", "patterns"],
    arithmeticPrompt: "30 + 20 = ?",
    arithmeticAnswer: 50,
    arithmeticMcOptions: ["40", "50", "60"],
    arithmeticMcAnswer: "50",
    verbalPrompt: "כִּתְבוּ בְּמִילָּה: הַמִּסְפָּר 50",
    verbalAnswer: "חֲמִישִּׁים",
    reviewPrompt: "הַמִּשְׁפָּט נָכוֹן? 40 + 10 = 60",
    reviewAnswer: false,
    challengePrompt: "מַתְחִילִים בְּ-0 וּמַגִּיעִים לְ-20 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 4,
  },
  {
    dayNumber: 12,
    title: "חִיסּוּר בַּעֲשָׂרוֹת",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִפְתּוֹר/תִּפְתּוֹר חִיסּוּר בַּעֲשָׂרוֹת שְׁלֵמוֹת בְּ-80% הַצְלָחָה.",
    mainTags: ["subtraction", "place-value"],
    spiralReviewTags: ["addition", "place-value"],
    arithmeticPrompt: "70 - 30 = ?",
    arithmeticAnswer: 40,
    arithmeticMcOptions: ["30", "40", "50"],
    arithmeticMcAnswer: "40",
    verbalPrompt: "כִּתְבוּ בְּמִילָּה: הַמִּסְפָּר 40",
    verbalAnswer: "אַרְבָּעִים",
    reviewPrompt: "הַמִּשְׁפָּט נָכוֹן? 90 - 40 = 50",
    reviewAnswer: true,
    challengePrompt: "מַתְחִילִים בְּ-50 וּמַגִּיעִים לְ-20 בִּקְפִיצוֹת שֶׁל 5 אֲחוֹרָה. כַּמָּה קְפִיצוֹת?",
    challengeAnswer: 6,
  },
  {
    dayNumber: 13,
    title: "בְּעָיוֹת מִילּוּלִיּוֹת מִתְקַדְּמוֹת",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִפְתּוֹר/תִּפְתּוֹר לְפָחוֹת 3 מִתּוֹךְ 4 בְּעָיוֹת מִילּוּלִיּוֹת דּוּ-שְׁלָבִיּוֹת פְּשׁוּטוֹת.",
    mainTags: ["word-problems", "addition", "subtraction"],
    spiralReviewTags: ["subtraction", "place-value"],
    arithmeticPrompt: "בַּכִּיתָּה 18 תַּלְמִידִים, 4 יָצְאוּ לַהַפְסָקָה וְאָז הִצְטָרְפוּ 3. כַּמָּה בַּכִּיתָּה עַכְשָׁיו?",
    arithmeticAnswer: 17,
    arithmeticMcOptions: ["16", "17", "18"],
    arithmeticMcAnswer: "17",
    verbalPrompt: "כִּתְבוּ בְּמִילָּה: הַמִּסְפָּר 17",
    verbalAnswer: "שְׁבַע עֶשְׂרֵה",
    reviewPrompt: "הַמִּשְׁפָּט נָכוֹן? אִם הָיוּ 12 וְנוֹסְפוּ 8 יֵשׁ 20",
    reviewAnswer: true,
    challengePrompt: "מַתְחִילִים בְּ-7 וּמַגִּיעִים לְ-27 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת מְלֵאוֹת?",
    challengeAnswer: 4,
  },
  {
    dayNumber: 14,
    title: "יוֹם סִיכּוּם וְהַטְמָעָה",
    objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַעֲמוֹד/תַּעֲמוֹד בְּ-80% הַצְלָחָה בְּמְשִׂימוֹת מְסַכְּמוֹת מִמִּגְוַן נוֹשְׂאִים.",
    mainTags: ["addition", "subtraction", "word-problems", "geometry-shapes", "place-value"],
    spiralReviewTags: ["addition", "subtraction", "word-problems", "geometry-shapes", "place-value"],
    arithmeticPrompt: "46 + 12 = ?",
    arithmeticAnswer: 58,
    arithmeticMcOptions: ["56", "58", "60"],
    arithmeticMcAnswer: "58",
    verbalPrompt: "כִּתְבוּ בְּמִילָּה: הַמִּסְפָּר 58",
    verbalAnswer: "חֲמִישִּׁים וּשְׁמוֹנֶה",
    reviewPrompt: "הַמִּשְׁפָּט נָכוֹן? 64 - 20 = 44",
    reviewAnswer: true,
    challengePrompt: "מַתְחִילִים בְּ-8 וּמַגִּיעִים לְ-28 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת מְלֵאוֹת?",
    challengeAnswer: 4,
    geometryPrompt: "בַּחֲרוּ צוּרָה עִם 4 צְלָעוֹת שָׁווֹת",
    geometryAnswer: "square",
  },
];

const buildExpandedExercisesForDay = (
  concept: DayConcept,
  dayDifficulty: DifficultyLevel,
): Section[] => {
  const d = concept.dayNumber;
  const base = 10 + d * 2;
  const dayCue = `לְנוֹשֵׂא ${concept.title}`;

  return [
    {
      id: toSectionId(d, 1),
      title: "חִימּוּם וַחֲזָרַת סְפִּירָלָה",
      type: "warmup",
      learningGoal: "לְהַתְחִיל בְּהַצְלָחָה וּלְחַזֵּק חִיבּוּר וְחִיסּוּר קְצָרִים.",
      prerequisiteSkillTags: concept.spiralReviewTags,
      exercises: [
        numberInput(
          d,
          1,
          1,
          `דֻּגְמָה לְ${dayCue}: 12 + 3 = 15. עַכְשָׁיו פִּתְרוּ: 14 + 2 = ?`,
          16,
          ["addition", "number-recognition"],
          dayDifficulty,
          "concrete",
        ),
        numberInput(d, 1, 2, `${base} + 4 = ?`, base + 4, ["addition"], dayDifficulty, "abstract"),
        numberInput(
          d,
          1,
          3,
          `${base + 6} - 5 = ?`,
          base + 1,
          ["subtraction"],
          dayDifficulty,
          "abstract",
        ),
        trueFalse(
          d,
          1,
          4,
          `הַאִם נָכוֹן: ${base + 7} - 2 = ${base + 5}?`,
          true,
          ["subtraction", "comparing"],
          dayDifficulty,
          "abstract",
        ),
        numberLineJump(
          d,
          1,
          5,
          `הַשְׁלִימוּ בַּקּוֹ בְּ${dayCue}: מִתְחִילִים בְּ-10 וְקוֹפְצִים בְּ-2 עַד 20. כַּמָּה קְפִיצוֹת?`,
          10,
          20,
          2,
          5,
          ["number-line", "patterns"],
          dayDifficulty,
          "pictorial",
        ),
        verbalInput(
          d,
          1,
          6,
          `כִּתְבוּ בְּמִילָּה אֶת הַמִּסְפָּר ${d + 12}.`,
          d === 8
            ? "עֶשְׂרִים"
            : d === 9
              ? "עֶשְׂרִים וְאַחַת"
              : d === 10
                ? "עֶשְׂרִים וּשְׁתַּיִם"
                : d === 11
                  ? "עֶשְׂרִים וְשָׁלוֹשׁ"
                  : d === 12
                    ? "עֶשְׂרִים וְאַרְבַּע"
                    : d === 13
                      ? "עֶשְׂרִים וְחָמֵשׁ"
                      : "עֶשְׂרִים וָשֵׁשׁ",
          ["number-recognition"],
          dayDifficulty,
          "pictorial",
        ),
        multipleChoice(
          d,
          1,
          7,
          d === 8
            ? "לְאֵיזוֹ צוּרָה יֵשׁ בְּדִיּוּק 4 צְלָעוֹת?"
            : d === 9
              ? "אֵיזוֹ סִדְרָה מַמְשִׁיכָה בְּקְפִיצָה שֶׁל 2?"
              : d === 10
                ? "בַּמִּסְפָּר 47, מַה מִסְפַּר הָעֲשָׂרוֹת?"
                : d === 11
                  ? "בַּחֲרוּ תַּרְגִּיל שֶׁמְּחַבֵּר עֲשָׂרוֹת שְׁלֵמוֹת."
                  : d === 12
                    ? "סַמְּנוּ תַּרְגִּיל שֶׁמַּחְסִיר עֲשָׂרוֹת שְׁלֵמוֹת."
                    : d === 13
                      ? "כְּשֶׁכָּתוּב 'נִשְׁאֲרוּ', אֵיזוֹ פְּעוּלָה בְּדֶרֶךְ כְּלָל נִצְטָרֵךְ?"
                      : "בְּיוֹם הַסִּכּוּם, אֵילוּ נוֹשְׂאִים מְשַׁלְּבִים?",
          d === 8
            ? ["triangle", "circle", "rectangle"]
            : d === 9
              ? ["4, 6, 8, 10", "3, 6, 10, 15", "5, 7, 10, 14"]
              : d === 10
                ? ["4", "7", "47"]
                : d === 11
                  ? ["30 + 20", "34 + 2", "29 + 1"]
                  : d === 12
                    ? ["80 - 30", "83 - 2", "77 - 5"]
                    : d === 13
                      ? ["חִיסּוּר", "חִיבּוּר", "כֶּפֶל"]
                      : ["חִיבּוּר", "הַכֹּל נָכוֹן", "רַק צוּרוֹת"],
          d === 8
            ? "rectangle"
            : d === 9
              ? "4, 6, 8, 10"
              : d === 10
                ? "4"
                : d === 11
                  ? "30 + 20"
                  : d === 12
                    ? "80 - 30"
                    : d === 13
                      ? "חִיסּוּר"
                      : "הַכֹּל נָכוֹן",
          concept.mainTags,
          dayDifficulty,
          "pictorial",
        ),
        trueFalse(
          d,
          1,
          8,
          d === 8
            ? "הַאִם נָכוֹן: לַמְּרֻבָּע יֵשׁ 4 צְלָעוֹת שָׁווֹת?"
            : d === 9
              ? "הַאִם נָכוֹן: 3, 6, 9, 12 הִיא סִדְרָה בְּקְפִיצָה שֶׁל 3?"
              : d === 10
                ? "הַאִם נָכוֹן: בַּמִּסְפָּר 62 יֵשׁ 6 עֲשָׂרוֹת?"
                : d === 11
                  ? "בִּדְקוּ: 40 + 30 שָׁוֶה לְ-70?"
                  : d === 12
                    ? "בִּדְקוּ אִם זֶה נָכוֹן: 90 - 40 = 50."
                    : d === 13
                      ? "שְׁאֵלַת חֲשִׁיבָה: בִּבְעָיָה בִּשְׁנֵי צְעָדִים פּוֹתְרִים צַעַד אַחַר צַעַד?"
                      : "נָכוֹן אוֹ לֹא: בְּיוֹם סִכּוּם מְשַׁלְּבִים יוֹתֵר מִנּוֹשֵׂא אֶחָד.",
          true,
          concept.mainTags,
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          1,
          9,
          d === 8
            ? "לִשְׁלוֹשָׁה מְשֻׁלָּשִׁים יֵשׁ כַּמָּה צְלָעוֹת בְּסַךְ הַכֹּל?"
            : d === 9
              ? "הַשְׁלִימוּ סִדְרָה: 5, 10, 15, __"
              : d === 10
                ? "בַּמִּסְפָּר 83, כַּמָּה אֲחָדוֹת יֵשׁ?"
                : d === 11
                  ? "מָה הַסְּכוּם שֶׁל 60 וְ-20?"
                  : d === 12
                    ? "כַּמָּה נִשְׁאַר מִ-70 אַחֲרֵי שֶׁמּוֹרִידִים 20?"
                    : d === 13
                      ? "לְיָדֵנוּ 20 גֻּלּוֹת: נָתַנּוּ 6 וְאַחַר כָּךְ קִבַּלְנוּ 4. כַּמָּה יֵשׁ כָּעֵת?"
                      : "חַשְּׁבוּ: 50 וְעוֹד 8.",
          d === 8 ? 9 : d === 9 ? 20 : d === 10 ? 3 : d === 11 ? 80 : d === 12 ? 50 : d === 13 ? 18 : 58,
          concept.mainTags,
          dayDifficulty,
          "concrete",
        ),
        numberInput(
          d,
          1,
          10,
          d === 8
            ? "לַמַּלְבֵּן יֵשׁ 4 צְלָעוֹת. לִשְׁנֵי מַלְבְּנִים יֵשׁ כַּמָּה צְלָעוֹת?"
            : d === 9
              ? "הַשְׁלִימוּ: 2, 5, 8, __"
              : d === 10
                ? "בַּמִּסְפָּר 95, כַּמָּה עֲשָׂרוֹת יֵשׁ?"
                : d === 11
                  ? "חַבְּרוּ עֲשָׂרוֹת: 20 + 50 = ?"
                  : d === 12
                    ? "בַּחִיסּוּר 60 - 50, מָה נוֹתָר?"
                    : d === 13
                      ? "בַּכִּתָּה יֵשׁ 24 תַּלְמִידִים. 5 יָצְאוּ, וְאַחַר כָּךְ 2 חָזְרוּ. כַּמָּה נִשְׁאֲרוּ בַּכִּתָּה?"
                      : "פִּתְרוּ בְּרֹאשׁ: 90 פָּחוֹת 40.",
          d === 8 ? 8 : d === 9 ? 11 : d === 10 ? 9 : d === 11 ? 70 : d === 12 ? 10 : d === 13 ? 21 : 50,
          concept.mainTags,
          dayDifficulty,
          "concrete",
        ),
      ],
    },
    {
      id: toSectionId(d, 2),
      title: "מוּשָׂג הַיּוֹם - מִתְנַסִּים",
      type: "arithmetic",
      learningGoal: "לְהַעֲמִיק בַּמּוּשָׂג בְּדִרְגּוּת קֹשִׁי עוֹלָה.",
      prerequisiteSkillTags: concept.mainTags,
      example: {
        title: "דֻּגְמָה פְּתוּרָה",
        prompt: `דֻּגְמָה: ${base} + 10 = ?`,
        steps: [
          `קוֹרְאִים אֶת הַתַּרְגִּיל: ${base} + 10.`,
          `מוֹסִיפִים עֲשָׂרָה לְ-${base} וּמְקַבְּלִים ${base + 10}.`,
          "בוֹדְקִים שֶׁהַתְּשׁוּבָה הִגְיוֹנִית.",
        ],
        takeaway: "כְּשֶׁמּוֹסִיפִים 10, סְפָרַת הָעֲשָׂרוֹת עוֹלָה בְּ-1.",
      },
      exercises: [
        numberInput(
          d,
          2,
          1,
          `דֻּגְמָה: ${base} + 10 = ${base + 10}. עַכְשָׁיו: ${base + 2} + 10 = ?`,
          base + 12,
          ["addition", ...concept.mainTags],
          dayDifficulty,
          "concrete",
        ),
        multipleChoice(
          d,
          2,
          2,
          `${base + 15} - 10 = ?`,
          [`${base + 5}`, `${base + 4}`, `${base + 6}`],
          `${base + 5}`,
          ["subtraction", ...concept.mainTags],
          dayDifficulty,
          "pictorial",
        ),
        numberInput(
          d,
          2,
          3,
          `פִּתְרוּ: ${base + 9} + ${d - 5} = ?`,
          base + d + 4,
          ["addition"],
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          2,
          4,
          `פִּתְרוּ: ${base + 20} - ${d} = ?`,
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
            ? "מַתְחִילִים בְּ-0 וְקוֹפְצִים בְּ-4 עַד 16. כַּמָּה קְפִיצוֹת?"
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
          d === 8 || d === 9 || d === 14 ? 2 : 5,
          d === 8 ? 4 : d === 9 ? 9 : d === 10 ? 4 : d === 11 ? 8 : d === 12 ? 4 : d === 13 ? 4 : 5,
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
          `דֻּגְמָה בְּ${dayCue}: אֶת 18 כּוֹתְבִים 'שְׁמוֹנֶה עֶשְׂרֵה'. עַכְשָׁיו כִּתְבוּ בְּמִילָּה אֶת 19.`,
          "תְּשַׁע עֶשְׂרֵה",
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
          `בְּ${dayCue}, אֵיזוֹ תְּשׁוּבָה סְבִירָה יוֹתֵר לְ-39 - 20?`,
          ["19", "59", "9"],
          "19",
          ["subtraction", "place-value"],
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          4,
          5,
          `בְּ${dayCue}: לְיָעֵל הָיוּ 22 מַדְבֵּקוֹת. הִיא נָתְנָה 5. כַּמָּה נִשְׁאֲרוּ?`,
          17,
          ["word-problems", "subtraction"],
          dayDifficulty,
          "pictorial",
        ),
        numberInput(
          d,
          4,
          6,
          `בְּ${dayCue}: בְּקֻפָּה יֵשׁ 18 עִפְּרוֹנוֹת וּמוֹסִיפִים 7. כַּמָּה יֵשׁ עַכְשָׁיו?`,
          25,
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
          `דֻּגְמָה בְּ${dayCue}: קֹדֶם מְחַבְּרִים וְאַחַר כָּךְ מַחְסִירִים. 20 + 5 - 3 = 22. עַכְשָׁיו: 18 + 6 - 4 = ?`,
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
          d === 9 ? 1 : d === 14 ? 5 : 2,
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

  const focusNumberPrompt = (idx: number): { prompt: string; answer: number; tags: SkillTag[] } => {
    if (d === 1) {
      const start = Math.max(0, Math.min(4, idx - 1));
      const dayOnePrompts = [
        `סִפְרוּ מִ-${start} עַד 5. כַּמָּה מִסְפָּרִים אוֹמְרִים?`,
        `מַתְחִילִים בְּ-${start} וּמְסַיְּמִים בְּ-5. כַּמָּה מִסְפָּרִים יֵשׁ?`,
        `סִפְרָה קְצָרָה: מִ-${start} עַד 5. מָה מִסְפַּר הַמִּסְפָּרִים?`,
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
        `סִפְרוּ מִ-${start} עַד ${end}. כַּמָּה מִסְפָּרִים יֵשׁ?`,
        `הַתְחִילוּ בְּ-${start} וְסִיְּמוּ בְּ-${end}. מָה כַּמּוּת הַמִּסְפָּרִים?`,
        `אִמְרוּ אֶת הַסְּפִירָה ${start} עַד ${end}. כַּמָּה נֶאֱמָר?`,
        `בִּסְפִירָה מִ-${start} לְ-${end}, כַּמָּה מִסְפָּרִים כּוֹלֵל הַטֶּוַח?`,
        `סִפְרָה מֻדְרֶכֶת: מִ-${start} עַד ${end}. כַּמָּה יֵשׁ בַּסְּפִירָה?`,
        `סִפְרוּ צַעַד-צַעַד מִ-${start} עַד ${end}. כַּמָּה מִסְפָּרִים?`,
      ];
      return {
        prompt: dayTwoPrompts[(idx - 1) % dayTwoPrompts.length],
        answer: end - start + 1,
        tags: ["counting", "number-recognition"],
      };
    }

    if (d === 3) {
      const a = 2 + idx;
      const b = idx <= 4 ? 2 : 3;
      const dayThreePrompts = [
        `${a} + ${b} = ?`,
        `פִּתְרוּ חִיבּוּר: ${a} + ${b}.`,
        `מָה הַתּוֹצָאָה שֶׁל ${a} + ${b}?`,
        `חַשְּׁבוּ: ${a} + ${b} = __`,
        `תַּרְגִּיל חִיבּוּר קָצָר: ${a} + ${b}`,
        `הַשְׁלִימוּ: ${a} + ${b} = ___`,
      ];
      return {
        prompt: dayThreePrompts[(idx - 1) % dayThreePrompts.length],
        answer: a + b,
        tags: ["addition"],
      };
    }

    if (d === 4) {
      const a = 11 + idx;
      const b = idx <= 4 ? 2 : 3;
      const dayFourPrompts = [
        `${a} - ${b} = ?`,
        `פִּתְרוּ חִיסּוּר: ${a} - ${b}.`,
        `מָה הַתּוֹצָאָה בַּתַּרְגִּיל ${a} - ${b}?`,
        `חַשְּׁבוּ: ${a} - ${b} = __`,
        `תַּרְגִּיל חִיסּוּר קָצָר: ${a} - ${b}`,
        `הַשְׁלִימוּ: ${a} - ${b} = ___`,
      ];
      return {
        prompt: dayFourPrompts[(idx - 1) % dayFourPrompts.length],
        answer: a - b,
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
          `חַשְּׁבוּ חִיבּוּר: ${a} + ${b} = ?`,
          `כַּמָּה יֵשׁ בְּסַךְ הַכֹּל? ${a} וְעוֹד ${b}.`,
          `הוֹסִיפוּ ${b} לְ-${a}. מַה הַתּוֹצָאָה?`,
          `הַשְׁלִימוּ אֶת הַתַּרְגִּיל: ${a} + ${b} = __`,
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
        `חַשְּׁבוּ חִיסּוּר: ${a} - ${b} = ?`,
        `מַה נִשְׁאָר אִם מוֹרִידִים ${b} מִ-${a}?`,
        `הַשְׁלִימוּ אֶת הַתַּרְגִּיל: ${a} - ${b} = __`,
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
        `סִפְרוּ מִ-${start} עַד ${end}. כַּמָּה מִסְפָּרִים יֵשׁ?`,
        `מֵהַמִּסְפָּר ${start} עַד ${end} - כַּמָּה סוֹפְרִים?`,
        `הַשְׁלִימוּ סְפִירָה מִ-${start} עַד ${end}. כַּמָּה בַּסַּךְ הַכֹּל?`,
        `סִפְרוּ בַּטֶּוַח ${start} עַד ${end}. מָה כַּמּוּת הַמִּסְפָּרִים?`,
        `סוֹפְרִים: ${start}...${end}. כַּמָּה מִסְפָּרִים נֶאֱמָרִים?`,
        `סִפְרָה יְשִׁירָה מִ-${start} עַד ${end}. כַּמָּה יֵשׁ?`,
        `מַתְחִילִים בְּ-${start} וְעוֹצְרִים בְּ-${end}. כַּמָּה מִסְפָּרִים?`,
        `מִ-${start} עַד ${end} כּוֹלֵל. כַּמָּה מִסְפָּרִים יֵשׁ?`,
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
      const a = 3 + idx;
      const b = idx <= 4 ? 3 : 4;
      const dayThreeDrillPrompts = [
        `פִּתְרוּ חִיבּוּר: ${a} + ${b} = ?`,
        `חַשְּׁבוּ אֶת הַתַּרְגִּיל ${a} + ${b}.`,
        `מָה תּוֹצָאַת הַחִיבּוּר ${a} + ${b}?`,
        `הַשְׁלִימוּ: ${a} + ${b} = __`,
        `תַּרְגִּיל יוֹם 3: ${a} + ${b}.`,
        `כִּתְבוּ תְּשׁוּבָה לְ-${a} + ${b}.`,
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
      const a = 13 + idx;
      const b = idx <= 4 ? 3 : 4;
      const dayFourDrillPrompts = [
        `פִּתְרוּ חִיסּוּר: ${a} - ${b} = ?`,
        `חַשְּׁבוּ אֶת הַתַּרְגִּיל ${a} - ${b}.`,
        `מָה תּוֹצָאַת הַחִיסּוּר ${a} - ${b}?`,
        `הַשְׁלִימוּ: ${a} - ${b} = __`,
        `תַּרְגִּיל יוֹם 4: ${a} - ${b}.`,
        `כִּתְבוּ תְּשׁוּבָה לְ-${a} - ${b}.`,
        `חִיסּוּר קָצָר: ${a} פָּחוֹת ${b}. כַּמָּה?`,
        `מָה יֵצֵא אִם נַחְסִיר ${b} מִ-${a}?`,
      ];
      return {
        prompt: dayFourDrillPrompts[(idx - 1) % dayFourDrillPrompts.length],
        answer: a - b,
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
          `פִּתְרוּ: ${a} + ${b} = ?`,
          `מָה הַתּוֹצָאָה שֶׁל ${a} וְעוֹד ${b}?`,
          `הוֹסִיפוּ ${b} לְ-${a} וּכְתְבוּ אֶת הַסְּכוּם.`,
          `תַּרְגִּיל חִיבּוּר: ${a} + ${b}.`,
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
        `פִּתְרוּ: ${a} - ${b} = ?`,
        `כַּמָּה נִשְׁאָר מִ-${a} אַחֲרֵי הוֹרָדַת ${b}?`,
        `תַּרְגִּיל חִיסּוּר: ${a} - ${b}.`,
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
      learningGoal: "לְהַתְחִיל בְּהַצְלָחָה עִם תַּרְגִּילִים קְצָרִים וּבְרוּרִים.",
      prerequisiteSkillTags: concept.spiralReviewTags,
      exercises: [
        numberInput(
          d,
          1,
          1,
          `דֻּגְמָה: ${addBase} + 1 = ${addBase + 1}. עַכְשָׁיו פִּתְרוּ: ${addBase + 1} + 1 = ?`,
          addBase + 2,
          ["addition", "counting"],
          dayDifficulty,
          "concrete",
          0,
          20,
        ),
        numberInput(d, 1, 2, `${addBase + 2} + 2 = ?`, addBase + 4, ["addition"], dayDifficulty, "abstract"),
        numberInput(d, 1, 3, `${subBase} - 1 = ?`, subBase - 1, ["subtraction"], dayDifficulty, "abstract"),
        trueFalse(
          d,
          1,
          4,
          `הַאִם נָכוֹן: ${subBase + 1} - 2 = ${subBase - 1}?`,
          true,
          ["subtraction", "comparing"],
          dayDifficulty,
          "abstract",
        ),
        numberLineJump(
          d,
          1,
          5,
          "מִתְחִילִים בְּ-0 וְקוֹפְצִים בְּ-1 עַד 5. כַּמָּה קְפִיצוֹת?",
          0,
          5,
          1,
          5,
          ["number-line", "counting"],
          dayDifficulty,
          "pictorial",
        ),
        numberInput(
          d,
          1,
          6,
          `כַּמָּה הַמִּסְפָּר הַבָּא אַחֲרֵי ${Math.min(maxForDay - 1, 9 + d)}?`,
          Math.min(maxForDay, 10 + d),
          ["number-recognition", "counting"],
          dayDifficulty,
          "concrete",
          0,
          20,
        ),
        numberInput(
          d,
          1,
          7,
          `כַּמָּה חָסֵר כְּדֵי לְהַגִּיעַ מִ-${Math.max(0, d - 1)} לְ-${Math.max(2, d + 2)}?`,
          3,
          ["counting", "number-line"],
          dayDifficulty,
          "concrete",
          0,
          20,
        ),
        trueFalse(
          d,
          1,
          8,
          `הַאִם נָכוֹן: ${addBase + 4} - 2 = ${addBase + 2}?`,
          true,
          ["subtraction", "comparing"],
          dayDifficulty,
          "abstract",
        ),
      ],
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
          `דֻּגְמָה: ${subBase + 2} - 2 = ${subBase}. עַכְשָׁיו: ${subBase + 3} - 2 = ?`,
          subBase + 1,
          ["subtraction"],
          dayDifficulty,
          "concrete",
          0,
          20,
        ),
        numberInput(d, 3, 2, `${subBase + 1} - 3 = ?`, subBase - 2, ["subtraction"], dayDifficulty, "abstract"),
        numberInput(d, 3, 3, `${subBase + 2} - 4 = ?`, subBase - 2, ["subtraction"], dayDifficulty, "abstract"),
        numberInput(d, 3, 4, `${subBase} - 2 = ?`, subBase - 2, ["subtraction"], dayDifficulty, "abstract"),
        multipleChoice(
          d,
          3,
          5,
          `${subBase + 4} - 3 = ?`,
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
          `${Math.min(maxForDay, subBase + 5)} - 5 = ?`,
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
          `דֻּגְמָה: ${addBase + 3} + 2 = ?`,
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
          `${subBase + 3} - 3 = ?`,
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

const buildDay = (concept: DayConcept): WorkbookDay => {
  const dayDifficulty = Math.min(5, Math.ceil(concept.dayNumber / 3)) as DifficultyLevel;
  const week = Math.ceil(concept.dayNumber / 5);

  const defaultSections: Section[] = [
    {
      id: toSectionId(concept.dayNumber, 1),
      title: "חִימּוּם וַחֲזָרַת סְפִּירָלָה",
      type: "warmup",
      learningGoal: "לְהִיזָּכֵר בְּנוֹשְׂאִים קוֹדְמִים וְלִפְתּוֹחַ אֶת הַיּוֹם בְּהַצְלָחָה רֵאשׁוֹנִית.",
      prerequisiteSkillTags: concept.spiralReviewTags,
      exercises: [
        numberInput(
          concept.dayNumber,
          1,
          1,
          "סִפְרוּ חֲפָצִים דִּמְיוֹנִיִּים וּכְתְבוּ כַּמָּה סְפַרְתֶּם (עַד 10).",
          Math.min(10, concept.dayNumber + 2),
          ["counting", "number-recognition"],
          dayDifficulty,
          "concrete",
          0,
          10,
          "אֶפְשָׁר לְדַמְיֵן אֶצְבָּעוֹת אוֹ קֻבִּיּוֹת וְלִסְפּוֹר אַחַת-אַחַת.",
        ),
        trueFalse(
          concept.dayNumber,
          1,
          2,
          concept.reviewPrompt,
          concept.reviewAnswer,
          concept.spiralReviewTags,
          dayDifficulty,
          "abstract",
        ),
      ],
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
          "הַשְׁלִימוּ קְפִיצוֹת עַל קַו הַמִּסְפָּרִים.",
          concept.dayNumber <= 5 ? 0 : concept.dayNumber,
          concept.dayNumber <= 5 ? 10 : 20,
          concept.dayNumber <= 8 ? 1 : 2,
          concept.dayNumber <= 8 ? 10 - (concept.dayNumber <= 5 ? 0 : concept.dayNumber) : 5,
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

  const sections =
    concept.dayNumber <= 7
      ? buildExpandedExercisesForEarlyDays(concept, dayDifficulty)
      : concept.dayNumber >= 8
        ? buildExpandedExercisesForDay(concept, dayDifficulty)
        : defaultSections;

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
};

export const workbookDays: WorkbookDay[] = concepts.map(buildDay);

export const workbookDaysById: Record<WorkbookDay["id"], WorkbookDay> = workbookDays.reduce(
  (acc, day) => {
    acc[day.id] = day;
    return acc;
  },
  {} as Record<WorkbookDay["id"], WorkbookDay>,
);

