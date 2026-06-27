import {
  letterTiles,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 17 — "a and an" (Level B, A1). */
export const englishDay17: WorkbookDay = {
  id: "day-17",
  dayNumber: 17,
  title: "שיעור 17: a ו-an",
  week: 5,
  objective: "לדעת מתי אומרים a ומתי an לפני שם עצם.",
  teachingSummary:
    "אומרים an לפני מילה שמתחילה בצליל תנועה (a, e, i, o, u), למשל an apple, an egg. בכל מקרה אחר אומרים a, למשל a cat, a dog.",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-17-section-0",
      title: "חימום: a או an",
      type: "warmup",
      learningGoal: "לבחור a או an לפי תחילת המילה.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(17, 0, 1, "מה נכון?", ["a apple", "an apple"], "an apple", [], 1, "abstract"),
        multipleChoice(17, 0, 2, "מה נכון?", ["an cat", "a cat"], "a cat", [], 1, "abstract"),
        multipleChoice(17, 0, 3, "מה נכון?", ["an egg", "a egg"], "an egg", [], 2, "abstract"),
        multipleChoice(17, 0, 4, "מה נכון?", ["a dog", "an dog"], "a dog", [], 2, "abstract"),
      ],
    },
    {
      id: "day-17-section-1",
      title: "עוד תרגול a ו-an",
      type: "verbal",
      learningGoal: "לבחור a או an במילים נוספות.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(17, 1, 1, "מה נכון?", ["an orange", "a orange"], "an orange", [], 1, "abstract"),
        multipleChoice(17, 1, 2, "מה נכון?", ["a ball", "an ball"], "a ball", [], 1, "abstract"),
        multipleChoice(17, 1, 3, "מה נכון?", ["an ant", "a ant"], "an ant", [], 2, "abstract"),
        multipleChoice(17, 1, 4, "מה נכון?", ["a book", "an book"], "a book", [], 2, "abstract"),
        letterTiles(17, 1, 5, "הרכיבו את המילה ששמעתם:", "an", [], 2, "abstract", "an"),
      ],
    },
    {
      id: "day-17-section-2",
      title: "הכלל של a ו-an",
      type: "verbal",
      learningGoal: "להבין מתי משתמשים ב-an.",
      prerequisiteSkillTags: [],
      exercises: [
        trueFalse(17, 2, 1, "האם אומרים 'an' לפני מילה שמתחילה בתנועה a, e, i, o, u?", true, [], 1, "abstract"),
        trueFalse(17, 2, 2, "האם אומרים 'an' לפני המילה 'cat'?", false, [], 2, "abstract"),
        multipleChoice(17, 2, 3, "מה נכון?", ["an apple", "a apple"], "an apple", [], 1, "abstract"),
        multipleChoice(17, 2, 4, "מה נכון?", ["a dog", "an dog"], "a dog", [], 1, "abstract"),
        letterTiles(17, 2, 5, "הרכיבו את המילה ששמעתם:", "an", [], 2, "abstract", "an"),
      ],
    },
    {
      id: "day-17-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על הכלל של a ו-an.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(17, 3, 1, "מה נכון?", ["an egg", "a egg"], "an egg", [], 1, "abstract"),
        multipleChoice(17, 3, 2, "מה נכון?", ["a ball", "an ball"], "a ball", [], 2, "abstract"),
        multipleChoice(17, 3, 3, "מה נכון?", ["an orange", "a orange"], "an orange", [], 2, "abstract"),
        trueFalse(17, 3, 4, "האם אומרים 'a' לפני המילה 'dog'?", true, [], 1, "abstract"),
        trueFalse(17, 3, 5, "האם אומרים 'a' לפני המילה 'apple'?", false, [], 2, "abstract"),
        letterTiles(17, 3, 6, "הרכיבו את המילה ששמעתם:", "an", [], 2, "abstract", "an"),
        matchPairs(
          17,
          3,
          7,
          "התאימו כל מילה למילית הנכונה:",
          [
            { left: "apple", right: "an" },
            { left: "cat", right: "a" },
            { left: "egg", right: "an" },
            { left: "dog", right: "a" },
          ],
          [],
          2,
          "abstract",
          { leftLang: "en", rightLang: "en" },
        ),
      ],
    },
  ],
};
