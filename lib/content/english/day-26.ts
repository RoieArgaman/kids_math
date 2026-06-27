import {
  letterTiles,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 26 — "Reading sentences" (Level B, A1). */
export const englishDay26: WorkbookDay = {
  id: "day-26",
  dayNumber: 26,
  title: "שיעור 26: קוראים משפטים",
  week: 9,
  objective: "לקרוא משפטים קצרים באנגלית ולהבין אותם.",
  teachingSummary: "היום נקרא משפטים קצרים באנגלית ונבין מה הם אומרים. קוראים ואז בוחרים.",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-26-section-0",
      title: "חימום: משפטים ראשונים",
      type: "warmup",
      learningGoal: "לקרוא משפט קצר ולהבין אותו.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(26, 0, 1, "קראו: \"The cat is big.\" מה נכון?", ["החתול גדול", "החתול קטן", "הכלב גדול"], "החתול גדול", [], 1, "abstract"),
        multipleChoice(26, 0, 2, "קראו: \"I see a dog.\" מה נכון?", ["אני רואה כלב", "אני רואה חתול", "יש לי כלב"], "אני רואה כלב", [], 1, "abstract"),
        multipleChoice(26, 0, 3, "קראו: \"The ball is red.\" מה נכון?", ["הכדור אדום", "הכדור כחול", "החתול אדום"], "הכדור אדום", [], 2, "abstract"),
        trueFalse(26, 0, 4, "קראו: \"The ball is red.\" — הכדור אדום?", true, [], 1, "abstract"),
      ],
    },
    {
      id: "day-26-section-1",
      title: "מה אומר המשפט?",
      type: "verbal",
      learningGoal: "לבחור את הפירוש הנכון של משפט קצר.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(26, 1, 1, "קראו: \"The dog is small.\" מה נכון?", ["הכלב קטן", "הכלב גדול", "החתול קטן"], "הכלב קטן", [], 1, "abstract"),
        multipleChoice(26, 1, 2, "קראו: \"I like pizza.\" מה נכון?", ["אני אוהב פיצה", "אני אוהב עוגה", "אני רואה פיצה"], "אני אוהב פיצה", [], 1, "abstract"),
        multipleChoice(26, 1, 3, "קראו: \"The sun is hot.\" מה נכון?", ["השמש חמה", "השמש קרה", "הירח חם"], "השמש חמה", [], 2, "abstract"),
        trueFalse(26, 1, 4, "קראו: \"The dog is small.\" — הכלב גדול?", false, [], 2, "abstract"),
        letterTiles(26, 1, 5, "הרכיבו את המילה ששמעתם:", "red", [], 2, "abstract", "red"),
      ],
    },
    {
      id: "day-26-section-2",
      title: "עוד משפטים",
      type: "verbal",
      learningGoal: "להרחיב את הבנת הנקרא במשפטים קצרים.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(26, 2, 1, "קראו: \"This is a pen.\" מה נכון?", ["זה עט", "זה ספר", "זה כלב"], "זה עט", [], 1, "abstract"),
        multipleChoice(26, 2, 2, "קראו: \"A fish can swim.\" מה נכון?", ["דג יכול לשחות", "דג יכול לעוף", "כלב יכול לשחות"], "דג יכול לשחות", [], 2, "abstract"),
        multipleChoice(26, 2, 3, "קראו: \"The cat is big.\" מה נכון?", ["החתול גדול", "החתול קטן", "הכלב קטן"], "החתול גדול", [], 1, "abstract"),
        trueFalse(26, 2, 4, "קראו: \"The sun is hot.\" — השמש חמה?", true, [], 1, "abstract"),
        letterTiles(26, 2, 5, "הרכיבו את המילה ששמעתם:", "dog", [], 2, "abstract", "dog"),
      ],
    },
    {
      id: "day-26-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על קריאת משפטים קצרים.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(26, 3, 1, "קראו: \"I see a dog.\" מה נכון?", ["אני רואה כלב", "אני רואה חתול", "יש לי כלב"], "אני רואה כלב", [], 1, "abstract"),
        multipleChoice(26, 3, 2, "קראו: \"I like pizza.\" מה נכון?", ["אני אוהב פיצה", "אני אוהב עוגה", "אני רואה פיצה"], "אני אוהב פיצה", [], 1, "abstract"),
        multipleChoice(26, 3, 3, "קראו: \"A fish can swim.\" מה נכון?", ["דג יכול לשחות", "דג יכול לעוף", "כלב יכול לשחות"], "דג יכול לשחות", [], 2, "abstract"),
        trueFalse(26, 3, 4, "קראו: \"This is a pen.\" — זה עט?", true, [], 1, "abstract"),
        trueFalse(26, 3, 5, "קראו: \"The ball is red.\" — הכדור כחול?", false, [], 2, "abstract"),
        letterTiles(26, 3, 6, "הרכיבו את המילה ששמעתם:", "pen", [], 2, "abstract", "pen"),
        matchPairs(
          26,
          3,
          7,
          "התאימו כל משפט לפירוש:",
          [
            { left: "The cat is big.", right: "החתול גדול" },
            { left: "I see a dog.", right: "אני רואה כלב" },
            { left: "The sun is hot.", right: "השמש חמה" },
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
