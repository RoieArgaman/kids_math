import {
  letterTiles,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 18 — "Singular and plural" (Level B, A1). */
export const englishDay18: WorkbookDay = {
  id: "day-18",
  dayNumber: 18,
  title: "שיעור 18: יחיד ורבים",
  week: 5,
  objective: "להוסיף s כדי ליצור רבים באנגלית.",
  teachingSummary:
    "כדי להפוך מילה ליחיד לרבים מוסיפים s בסוף, למשל cat הופך ל-cats ו-dog הופך ל-dogs. קודם מקשיבים ואז בוחרים.",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-18-section-0",
      title: "חימום: אחד או שניים",
      type: "warmup",
      learningGoal: "לזהות צורת רבים עם s.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(18, 0, 1, "איך אומרים 'שני כלבים'?", ["dog", "dogs"], "dogs", [], 1, "abstract"),
        multipleChoice(18, 0, 2, "מה הרבים של 'cat'?", ["cats", "cat"], "cats", [], 1, "abstract"),
        multipleChoice(18, 0, 3, "איך אומרים 'ספרים'?", ["books", "book"], "books", [], 2, "abstract"),
        multipleChoice(18, 0, 4, "מה הרבים של 'pen'?", ["pens", "pen"], "pens", [], 2, "abstract"),
      ],
    },
    {
      id: "day-18-section-1",
      title: "עוד רבים",
      type: "verbal",
      learningGoal: "ליצור רבים במילים נוספות.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(18, 1, 1, "מה הרבים של 'hat'?", ["hats", "hat"], "hats", [], 1, "abstract"),
        multipleChoice(18, 1, 2, "איך אומרים 'כוסות'?", ["cups", "cup"], "cups", [], 1, "abstract"),
        multipleChoice(18, 1, 3, "מה הרבים של 'ball'?", ["balls", "ball"], "balls", [], 2, "abstract"),
        multipleChoice(18, 1, 4, "איך אומרים 'ביצים'?", ["eggs", "egg"], "eggs", [], 2, "abstract"),
        letterTiles(18, 1, 5, "הרכיבו את המילה ששמעתם:", "cats", [], 2, "abstract", "cats"),
      ],
    },
    {
      id: "day-18-section-2",
      title: "הכלל של s",
      type: "verbal",
      learningGoal: "להבין שמוסיפים s כדי ליצור רבים.",
      prerequisiteSkillTags: [],
      exercises: [
        trueFalse(18, 2, 1, "האם מוסיפים s כדי ליצור רבים?", true, [], 1, "abstract"),
        multipleChoice(18, 2, 2, "מה הרבים של 'pen'?", ["pens", "pen"], "pens", [], 1, "abstract"),
        multipleChoice(18, 2, 3, "איך אומרים 'כובעים'?", ["hats", "hat"], "hats", [], 2, "abstract"),
        multipleChoice(18, 2, 4, "מה הרבים של 'cup'?", ["cups", "cup"], "cups", [], 2, "abstract"),
        letterTiles(18, 2, 5, "הרכיבו את המילה ששמעתם:", "pens", [], 2, "abstract", "pens"),
      ],
    },
    {
      id: "day-18-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על יחיד ורבים מהיום.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(18, 3, 1, "מה הרבים של 'dog'?", ["dogs", "dog"], "dogs", [], 1, "abstract"),
        multipleChoice(18, 3, 2, "איך אומרים 'כדורים'?", ["balls", "ball"], "balls", [], 2, "abstract"),
        multipleChoice(18, 3, 3, "מה הרבים של 'book'?", ["books", "book"], "books", [], 2, "abstract"),
        trueFalse(18, 3, 4, "האם 'cats' הוא רבים של 'cat'?", true, [], 1, "abstract"),
        trueFalse(18, 3, 5, "האם 'dog' הוא רבים?", false, [], 2, "abstract"),
        letterTiles(18, 3, 6, "הרכיבו את המילה ששמעתם:", "books", [], 2, "abstract", "books"),
        matchPairs(
          18,
          3,
          7,
          "התאימו כל מילה לצורת הרבים שלה:",
          [
            { left: "dog", right: "dogs" },
            { left: "cat", right: "cats" },
            { left: "book", right: "books" },
            { left: "pen", right: "pens" },
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
