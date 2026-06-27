import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 25 — "Adjectives" (Level B, A1). */
export const englishDay25: WorkbookDay = {
  id: "day-25",
  dayNumber: 25,
  title: "שיעור 25: שמות תואר",
  week: 8,
  objective: "להכיר שמות תואר נפוצים והפכים באנגלית.",
  teachingSummary: "היום נלמד שמות תואר באנגלית והפכים. קודם מקשיבים ואז בוחרים.",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-25-section-0",
      title: "חימום: גדול וקטן",
      type: "warmup",
      learningGoal: "לזהות שמות תואר בסיסיים.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(25, 0, 1, "מה שמעתם?", "big", ["גדול", "קטן", "גבוה"], "גדול", [], 1, "abstract"),
        listenChoose(25, 0, 2, "מה שמעתם?", "small", ["קטן", "גדול", "חם"], "קטן", [], 1, "abstract"),
        listenChoose(25, 0, 3, "מה שמעתם?", "hot", ["חם", "קר", "שמח"], "חם", [], 2, "abstract"),
        listenChoose(25, 0, 4, "מה שמעתם?", "cold", ["קר", "חם", "עצוב"], "קר", [], 2, "abstract"),
      ],
    },
    {
      id: "day-25-section-1",
      title: "שמות תואר באנגלית",
      type: "verbal",
      learningGoal: "לקשר בין שם תואר באנגלית לפירוש.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(25, 1, 1, "איך אומרים 'גדול' באנגלית?", ["big", "small", "tall"], "big", [], 1, "abstract"),
        multipleChoice(25, 1, 2, "איך אומרים 'קטן' באנגלית?", ["small", "big", "short"], "small", [], 1, "abstract"),
        listenChoose(25, 1, 3, "מה שמעתם?", "happy", ["שמח", "עצוב", "גבוה"], "שמח", [], 2, "abstract"),
        listenChoose(25, 1, 4, "מה שמעתם?", "sad", ["עצוב", "שמח", "קר"], "עצוב", [], 2, "abstract"),
        letterTiles(25, 1, 5, "הרכיבו את המילה ששמעתם:", "big", [], 2, "abstract", "big"),
      ],
    },
    {
      id: "day-25-section-2",
      title: "עוד שמות תואר",
      type: "verbal",
      learningGoal: "להרחיב את אוצר המילים של שמות תואר.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(25, 2, 1, "מה שמעתם?", "tall", ["גבוה", "קצר", "גדול"], "גבוה", [], 2, "abstract"),
        listenChoose(25, 2, 2, "מה שמעתם?", "short", ["קצר", "גבוה", "קטן"], "קצר", [], 2, "abstract"),
        multipleChoice(25, 2, 3, "איך אומרים 'חם' באנגלית?", ["hot", "cold", "tall"], "hot", [], 2, "abstract"),
        multipleChoice(25, 2, 4, "איך אומרים 'שמח' באנגלית?", ["happy", "sad", "small"], "happy", [], 2, "abstract"),
        letterTiles(25, 2, 5, "הרכיבו את המילה ששמעתם:", "hot", [], 2, "abstract", "hot"),
      ],
    },
    {
      id: "day-25-section-3",
      title: "חזרה והפכים",
      type: "review",
      learningGoal: "לחזור על שמות התואר ולהכיר הפכים.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(25, 3, 1, "מה שמעתם?", "cold", ["קר", "חם", "קטן"], "קר", [], 1, "abstract"),
        multipleChoice(25, 3, 2, "איך אומרים 'גבוה' באנגלית?", ["tall", "short", "big"], "tall", [], 2, "abstract"),
        trueFalse(25, 3, 3, "האם 'small' פירושו 'קטן'?", true, [], 1, "abstract"),
        trueFalse(25, 3, 4, "האם 'hot' פירושו 'קר'?", false, [], 2, "abstract"),
        multipleChoice(25, 3, 5, "מה פירוש המילה 'sad'?", ["עצוב", "שמח", "גבוה"], "עצוב", [], 2, "abstract"),
        letterTiles(25, 3, 6, "הרכיבו את המילה ששמעתם:", "small", [], 2, "abstract", "small"),
        matchPairs(
          25,
          3,
          7,
          "התאימו כל מילה להפך שלה:",
          [
            { left: "big", right: "small" },
            { left: "hot", right: "cold" },
            { left: "happy", right: "sad" },
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
