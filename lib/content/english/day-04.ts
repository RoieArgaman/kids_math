import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 4 — "Animals" (Pre-A1, listening-first). */
export const englishDay04: WorkbookDay = {
  id: "day-4",
  dayNumber: 4,
  title: "שיעור 4: חיות",
  week: 1,
  objective: "להכיר שמות של חיות נפוצות באנגלית דרך הקשבה.",
  teachingSummary: "היום נלמד שמות של חיות באנגלית. קודם מקשיבים ואז בוחרים.",
  teachingSteps: ["מקשיבים למילה 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים מילים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-4-section-0",
      title: "חימום: כלב וחתול",
      type: "warmup",
      learningGoal: "לזהות חיות בסיסיות.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(4, 0, 1, "מה שמעתם?", "dog", ["כלב", "חתול", "ציפור"], "כלב", [], 1, "abstract"),
        listenChoose(4, 0, 2, "מה שמעתם?", "cat", ["חתול", "כלב", "דג"], "חתול", [], 1, "abstract"),
        listenChoose(4, 0, 3, "מה שמעתם?", "bird", ["ציפור", "חתול", "פרה"], "ציפור", [], 2, "abstract"),
        listenChoose(4, 0, 4, "מה שמעתם?", "fish", ["דג", "כלב", "ציפור"], "דג", [], 2, "abstract"),
      ],
    },
    {
      id: "day-4-section-1",
      title: "חיות בית",
      type: "verbal",
      learningGoal: "לקשר בין שם חיה באנגלית לפירוש.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(4, 1, 1, "איך אומרים 'חתול' באנגלית?", ["cat", "dog", "cow"], "cat", [], 1, "abstract"),
        multipleChoice(4, 1, 2, "איך אומרים 'כלב' באנגלית?", ["dog", "fish", "bird"], "dog", [], 1, "abstract"),
        listenChoose(4, 1, 3, "מה שמעתם?", "cow", ["פרה", "כלב", "דג"], "פרה", [], 2, "abstract"),
        listenChoose(4, 1, 4, "מה שמעתם?", "bird", ["ציפור", "פרה", "חתול"], "ציפור", [], 2, "abstract"),
        letterTiles(4, 1, 5, "הרכיבו את המילה ששמעתם:", "cat", [], 2, "abstract", "cat"),
      ],
    },
    {
      id: "day-4-section-2",
      title: "עוד חיות",
      type: "verbal",
      learningGoal: "להרחיב את אוצר המילים על חיות.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(4, 2, 1, "מה שמעתם?", "fish", ["דג", "ציפור", "פרה"], "דג", [], 2, "abstract"),
        multipleChoice(4, 2, 2, "איך אומרים 'פרה' באנגלית?", ["cow", "dog", "cat"], "cow", [], 2, "abstract"),
        listenChoose(4, 2, 3, "מה שמעתם?", "dog", ["כלב", "דג", "ציפור"], "כלב", [], 1, "abstract"),
        multipleChoice(4, 2, 4, "איך אומרים 'ציפור' באנגלית?", ["bird", "fish", "cow"], "bird", [], 2, "abstract"),
        letterTiles(4, 2, 5, "הרכיבו את המילה ששמעתם:", "dog", [], 2, "abstract", "dog"),
      ],
    },
    {
      id: "day-4-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על שמות החיות מהיום.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(4, 3, 1, "מה שמעתם?", "cat", ["חתול", "כלב", "דג"], "חתול", [], 1, "abstract"),
        multipleChoice(4, 3, 2, "איך אומרים 'דג' באנגלית?", ["fish", "bird", "cow"], "fish", [], 2, "abstract"),
        trueFalse(4, 3, 3, "האם 'dog' פירושו 'כלב'?", true, [], 1, "abstract"),
        trueFalse(4, 3, 4, "האם 'cow' פירושו 'חתול'?", false, [], 2, "abstract"),
        letterTiles(4, 3, 5, "הרכיבו את המילה ששמעתם:", "fish", [], 2, "abstract", "fish"),
        matchPairs(
          4,
          3,
          6,
          "התאימו כל חיה לפירוש:",
          [
            { left: "dog", right: "כלב" },
            { left: "cat", right: "חתול" },
            { left: "bird", right: "ציפור" },
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
