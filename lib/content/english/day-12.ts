import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 12 — "Initial sounds" (Pre-A1, listening-first). */
export const englishDay12: WorkbookDay = {
  id: "day-12",
  dayNumber: 12,
  title: "שיעור 12: צליל ראשון",
  week: 3,
  objective: "לזהות את האות הראשונה של מילים באנגלית לפי הצליל.",
  teachingSummary:
    "היום נלמד לזהות באיזו אות מתחילה כל מילה. קודם מקשיבים, ואז בוחרים את האות הנכונה.",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-12-section-0",
      title: "חימום: באיזו אות מתחילים?",
      type: "warmup",
      learningGoal: "לזהות את האות הראשונה של מילים נפוצות.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(12, 0, 1, "באיזו אות מתחילה המילה?", "ball", ["B", "C", "D"], "B", [], 1, "abstract", "en"),
        listenChoose(12, 0, 2, "באיזו אות מתחילה המילה?", "cat", ["C", "B", "D"], "C", [], 1, "abstract", "en"),
        listenChoose(12, 0, 3, "באיזו אות מתחילה המילה?", "dog", ["D", "C", "B"], "D", [], 1, "abstract", "en"),
        listenChoose(12, 0, 4, "באיזו אות מתחילה המילה?", "fish", ["F", "H", "M"], "F", [], 2, "abstract", "en"),
      ],
    },
    {
      id: "day-12-section-1",
      title: "צלילים ראשונים",
      type: "verbal",
      learningGoal: "לקשר בין צליל ראשון לאות.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(12, 1, 1, "באיזו אות מתחילה המילה?", "hat", ["H", "M", "S"], "H", [], 1, "abstract", "en"),
        listenChoose(12, 1, 2, "באיזו אות מתחילה המילה?", "milk", ["M", "H", "P"], "M", [], 2, "abstract", "en"),
        listenChoose(12, 1, 3, "באיזו אות מתחילה המילה?", "sun", ["S", "T", "R"], "S", [], 1, "abstract", "en"),
        multipleChoice(12, 1, 4, "איזו מילה מתחילה ב-B?", ["ball", "cat", "dog"], "ball", [], 2, "abstract"),
        letterTiles(12, 1, 5, "הרכיבו את המילה ששמעתם:", "sun", [], 2, "abstract", "sun"),
      ],
    },
    {
      id: "day-12-section-2",
      title: "עוד צלילים",
      type: "verbal",
      learningGoal: "להרחיב את זיהוי האות הראשונה.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(12, 2, 1, "באיזו אות מתחילה המילה?", "pen", ["P", "R", "T"], "P", [], 2, "abstract", "en"),
        listenChoose(12, 2, 2, "באיזו אות מתחילה המילה?", "red", ["R", "P", "T"], "R", [], 2, "abstract", "en"),
        listenChoose(12, 2, 3, "באיזו אות מתחילה המילה?", "top", ["T", "P", "R"], "T", [], 2, "abstract", "en"),
        multipleChoice(12, 2, 4, "איזו מילה מתחילה ב-C?", ["cat", "ball", "dog"], "cat", [], 1, "abstract"),
        letterTiles(12, 2, 5, "הרכיבו את המילה ששמעתם:", "hat", [], 2, "abstract", "hat"),
      ],
    },
    {
      id: "day-12-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על זיהוי האות הראשונה.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(12, 3, 1, "באיזו אות מתחילה המילה?", "dog", ["D", "B", "C"], "D", [], 1, "abstract", "en"),
        listenChoose(12, 3, 2, "באיזו אות מתחילה המילה?", "milk", ["M", "S", "H"], "M", [], 2, "abstract", "en"),
        multipleChoice(12, 3, 3, "איזו מילה מתחילה ב-S?", ["sun", "pen", "top"], "sun", [], 2, "abstract"),
        trueFalse(12, 3, 4, "האם המילה 'dog' מתחילה באות D?", true, [], 1, "abstract"),
        trueFalse(12, 3, 5, "האם המילה 'cat' מתחילה באות B?", false, [], 2, "abstract"),
        letterTiles(12, 3, 6, "הרכיבו את המילה ששמעתם:", "pen", [], 2, "abstract", "pen"),
        matchPairs(
          12,
          3,
          7,
          "התאימו כל מילה לאות הראשונה שלה:",
          [
            { left: "cat", right: "C" },
            { left: "dog", right: "D" },
            { left: "ball", right: "B" },
            { left: "fish", right: "F" },
          ],
          [],
          2,
          "abstract",
          {
            leftLang: "en",
            rightLang: "en",
            audioByLeft: { cat: "cat", dog: "dog", ball: "ball", fish: "fish" },
          },
        ),
      ],
    },
  ],
};
