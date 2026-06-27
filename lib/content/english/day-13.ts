import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 13 — "Reading short words" (Pre-A1, listening-first). */
export const englishDay13: WorkbookDay = {
  id: "day-13",
  dayNumber: 13,
  title: "שיעור 13: קוראים מילים קצרות",
  week: 4,
  objective: "לקרוא ולהרכיב מילים קצרות באנגלית (עיצור-תנועה-עיצור).",
  teachingSummary:
    "היום נקרא ונרכיב מילים קצרות באנגלית. קודם מקשיבים למילה, ואז בוחרים את הפירוש או מרכיבים אותה.",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-13-section-0",
      title: "חימום: מילים קצרות",
      type: "warmup",
      learningGoal: "לזהות מילים קצרות לפי הקשבה.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(13, 0, 1, "מה שמעתם?", "cat", ["חתול", "כלב", "שמש"], "חתול", [], 1, "abstract"),
        listenChoose(13, 0, 2, "מה שמעתם?", "dog", ["כלב", "חתול", "עט"], "כלב", [], 1, "abstract"),
        listenChoose(13, 0, 3, "מה שמעתם?", "sun", ["שמש", "כלב", "כובע"], "שמש", [], 1, "abstract"),
        listenChoose(13, 0, 4, "מה שמעתם?", "pen", ["עט", "כוס", "מיטה"], "עט", [], 2, "abstract"),
      ],
    },
    {
      id: "day-13-section-1",
      title: "פירוש המילה",
      type: "verbal",
      learningGoal: "לקשר בין מילה קצרה באנגלית לפירוש בעברית.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(13, 1, 1, "מה שמעתם?", "big", ["גדול", "אדום", "כוס"], "גדול", [], 2, "abstract"),
        listenChoose(13, 1, 2, "מה שמעתם?", "hat", ["כובע", "מיטה", "חזיר"], "כובע", [], 1, "abstract"),
        multipleChoice(13, 1, 3, "מה פירוש המילה 'cup'?", ["כוס", "כובע", "מיטה"], "כוס", [], 2, "abstract"),
        multipleChoice(13, 1, 4, "מה פירוש המילה 'red'?", ["אדום", "גדול", "חזיר"], "אדום", [], 1, "abstract"),
        letterTiles(13, 1, 5, "הרכיבו את המילה ששמעתם:", "cat", [], 2, "abstract", "cat"),
      ],
    },
    {
      id: "day-13-section-2",
      title: "עוד מילים קצרות",
      type: "verbal",
      learningGoal: "להרחיב את אוצר המילים הקצרות ולהרכיב אותן.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(13, 2, 1, "מה שמעתם?", "bed", ["מיטה", "כוס", "עט"], "מיטה", [], 2, "abstract"),
        listenChoose(13, 2, 2, "מה שמעתם?", "pig", ["חזיר", "כלב", "כובע"], "חזיר", [], 2, "abstract"),
        multipleChoice(13, 2, 3, "מה פירוש המילה 'big'?", ["גדול", "אדום", "כוס"], "גדול", [], 1, "abstract"),
        letterTiles(13, 2, 4, "הרכיבו את המילה ששמעתם:", "sun", [], 2, "abstract", "sun"),
        letterTiles(13, 2, 5, "הרכיבו את המילה ששמעתם:", "bed", [], 2, "abstract", "bed"),
      ],
    },
    {
      id: "day-13-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על המילים הקצרות מהיום.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(13, 3, 1, "מה שמעתם?", "cup", ["כוס", "כובע", "חזיר"], "כוס", [], 2, "abstract"),
        multipleChoice(13, 3, 2, "מה פירוש המילה 'dog'?", ["כלב", "חתול", "שמש"], "כלב", [], 1, "abstract"),
        trueFalse(13, 3, 3, "האם 'pig' פירושו 'חזיר'?", true, [], 1, "abstract"),
        trueFalse(13, 3, 4, "האם 'bed' פירושו 'כוס'?", false, [], 2, "abstract"),
        letterTiles(13, 3, 5, "הרכיבו את המילה ששמעתם:", "cup", [], 2, "abstract", "cup"),
        matchPairs(
          13,
          3,
          6,
          "התאימו כל מילה לפירוש:",
          [
            { left: "cat", right: "חתול" },
            { left: "sun", right: "שמש" },
            { left: "bed", right: "מיטה" },
            { left: "cup", right: "כוס" },
          ],
          [],
          2,
          "abstract",
          {
            leftLang: "en",
            rightLang: "he",
            audioByLeft: { cat: "cat", sun: "sun", bed: "bed", cup: "cup" },
          },
        ),
      ],
    },
  ],
};
