import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 5 — "Food & Drink" (Pre-A1, listening-first). */
export const englishDay05: WorkbookDay = {
  id: "day-5",
  dayNumber: 5,
  title: "שיעור 5: אוכל",
  week: 1,
  objective: "להכיר מילים על אוכל ושתייה באנגלית דרך הקשבה.",
  teachingSummary: "היום נלמד מילים על אוכל באנגלית. קודם מקשיבים ואז בוחרים.",
  teachingSteps: ["מקשיבים למילה 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים מילים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-5-section-0",
      title: "חימום: תפוח ולחם",
      type: "warmup",
      learningGoal: "לזהות מילות אוכל בסיסיות.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(5, 0, 1, "מה שמעתם?", "apple", ["תפוח", "לחם", "חלב"], "תפוח", [], 1, "abstract"),
        listenChoose(5, 0, 2, "מה שמעתם?", "bread", ["לחם", "תפוח", "מים"], "לחם", [], 1, "abstract"),
        listenChoose(5, 0, 3, "מה שמעתם?", "milk", ["חלב", "מים", "ביצה"], "חלב", [], 2, "abstract"),
        listenChoose(5, 0, 4, "מה שמעתם?", "water", ["מים", "חלב", "תפוח"], "מים", [], 2, "abstract"),
      ],
    },
    {
      id: "day-5-section-1",
      title: "אוכל",
      type: "verbal",
      learningGoal: "לקשר בין מילת אוכל באנגלית לפירוש.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(5, 1, 1, "איך אומרים 'תפוח' באנגלית?", ["apple", "bread", "egg"], "apple", [], 1, "abstract"),
        multipleChoice(5, 1, 2, "איך אומרים 'מים' באנגלית?", ["water", "milk", "bread"], "water", [], 2, "abstract"),
        listenChoose(5, 1, 3, "מה שמעתם?", "egg", ["ביצה", "לחם", "חלב"], "ביצה", [], 2, "abstract"),
        listenChoose(5, 1, 4, "מה שמעתם?", "milk", ["חלב", "מים", "תפוח"], "חלב", [], 1, "abstract"),
        letterTiles(5, 1, 5, "הרכיבו את המילה ששמעתם:", "egg", [], 2, "abstract", "egg"),
      ],
    },
    {
      id: "day-5-section-2",
      title: "עוד אוכל",
      type: "verbal",
      learningGoal: "להרחיב את אוצר המילים על אוכל.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(5, 2, 1, "מה שמעתם?", "bread", ["לחם", "ביצה", "מים"], "לחם", [], 1, "abstract"),
        multipleChoice(5, 2, 2, "איך אומרים 'ביצה' באנגלית?", ["egg", "milk", "apple"], "egg", [], 2, "abstract"),
        listenChoose(5, 2, 3, "מה שמעתם?", "apple", ["תפוח", "מים", "לחם"], "תפוח", [], 1, "abstract"),
        multipleChoice(5, 2, 4, "איך אומרים 'חלב' באנגלית?", ["milk", "water", "egg"], "milk", [], 2, "abstract"),
        letterTiles(5, 2, 5, "הרכיבו את המילה ששמעתם:", "milk", [], 2, "abstract", "milk"),
      ],
    },
    {
      id: "day-5-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על מילות האוכל מהיום.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(5, 3, 1, "מה שמעתם?", "water", ["מים", "חלב", "ביצה"], "מים", [], 1, "abstract"),
        multipleChoice(5, 3, 2, "איך אומרים 'לחם' באנגלית?", ["bread", "apple", "egg"], "bread", [], 2, "abstract"),
        trueFalse(5, 3, 3, "האם 'apple' פירושו 'תפוח'?", true, [], 1, "abstract"),
        trueFalse(5, 3, 4, "האם 'milk' פירושו 'מים'?", false, [], 2, "abstract"),
        letterTiles(5, 3, 5, "הרכיבו את המילה ששמעתם:", "apple", [], 2, "abstract", "apple"),
        matchPairs(
          5,
          3,
          6,
          "התאימו כל מילה לפירוש:",
          [
            { left: "apple", right: "תפוח" },
            { left: "milk", right: "חלב" },
            { left: "water", right: "מים" },
          ],
          [],
          2,
          "abstract",
          { leftLang: "en", rightLang: "he" },
        ),
      ],
    },
  ],
};
