import type { DifficultyLevel, Exercise, SkillTag } from "@/lib/types";

import type { DayConcept } from "./exercise-factories";
import {
  multipleChoice,
  numberInput,
  numberLineJump,
  shapeChoice,
  trueFalse,
} from "./exercise-factories";

export const pickWarmupSkillTags = (concept: DayConcept, priorConcepts: DayConcept[]): SkillTag[] => {
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

export const warmupExerciseForTag = (
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
        `חִימּוּם מִיָּמִים קוֹדְמִים: סִפְרוּ מִ-1 עַד ${4 + (seed % 4)}. כַּמָּה מִסְפָּרִים?`,
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
        "חִימּוּם: חַשְּׁבוּ 5 + 4",
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
          `חִימּוּם: עַל קַו מִסְפָּרִים מִ-${start} עַד ${end} בִּקְפִיצוֹת שֶׁל ${step}. כַּמָּה קְפִיצוֹת?`,
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
      const prompt = `חִימּוּם: חַשְּׁבוּ ${a} + ${b}`;
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
      const prompt = `חִימּוּם: חַשְּׁבוּ ${x} - ${y}`;
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
        "חִימּוּם: לְנֹעַם הָיוּ 6 מַדְבֵּקוֹת. קִבְּלָה עוֹד 3. כַּמָּה יֵשׁ לָהּ?",
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
        "חִימּוּם: הַשְׁלִימוּ: 2, 4, 6, __",
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
        "חִימּוּם בְּגִימַטְרְיָה: חַשְּׁבוּ א (1) + ב (2)",
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
        "חִימּוּם: חַשְּׁבוּ 3 + 3 + 3 (שָׁלוֹשׁ פְּעָמִים שָׁלוֹשׁ)",
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
          `חִימּוּם: כַּמָּה צָרִיךְ לְהוֹסִיף לְ-${left} כְּדֵי לְהַגִּיעַ לְ-${target}?`,
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
        `חִימּוּם: חַשְּׁבוּ ${f} + ${f} + ${f} (שָׁלוֹשׁ פְּעָמִים ${f})`,
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
        `חִימּוּם: חִלְּקוּ ${total} לִשְׁתֵּי קְבוּצוֹת שָׁווֹת. כַּמָּה בְּכָל קְבוּצָה?`,
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
        "חִימּוּם: כַּמָּה רְבָעִים יֵשׁ בְּשָׁלֵם אֶחָד?",
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
        "חִימּוּם: רִשְׁתּוֹת 3 עַל 2 רִיבּוּעִים קְטַנִּים — כַּמָּה רִיבּוּעִים בַּסַּךְ?",
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
        "חִימּוּם: 2 ק״ג וְעוֹד 3 ק״ג — כַּמָּה ק״ג בַּסַּךְ?",
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
        "חִימּוּם: לְאֵיזֶה גּוּף יֵשׁ תָּמִיד 6 פָּנִים שֶׁכֻּלָּם רִיבּוּעִים?",
        ["קוּבִּיָּה", "כַּד", "חֲרוּט"],
        "קוּבִּיָּה",
        ["geometry-solids"],
        difficulty,
        "concrete",
      );
    case "money-shekel":
      return numberInput(
        dayNumber,
        1,
        exerciseIndex,
        "חִימּוּם: מַטְבֵּעַ 5 שְׁקָלִים וְעוֹד מַטְבֵּעַ 2 שְׁקָלִים — כַּמָּה בַּסַּךְ?",
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
        "חִימּוּם: חַשְּׁבוּ 4 + 5",
        9,
        ["addition"],
        difficulty,
        "abstract",
        0,
        20,
      );
  }
};

export const buildSpiralWarmupExercises = (
  concept: DayConcept,
  priorConcepts: DayConcept[],
  dayDifficulty: DifficultyLevel,
): Exercise[] => {
  const tags = pickWarmupSkillTags(concept, priorConcepts);
  return tags.map((tag, i) => warmupExerciseForTag(concept.dayNumber, i + 1, tag, dayDifficulty));
};
