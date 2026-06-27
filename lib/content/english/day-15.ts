import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 15 — "Word families" (Level B, A1). */
export const englishDay15: WorkbookDay = {
  id: "day-15",
  dayNumber: 15,
  title: "שיעור 15: משפחות מילים",
  week: 4,
  objective: "לקרוא מילים מאותה משפחת צליל באנגלית.",
  teachingSummary:
    "היום נלמד משפחות מילים. מילים שמסתיימות באותו צליל הן באותה משפחה, למשל cat, hat, bat. קודם מקשיבים ואז בוחרים.",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-15-section-0",
      title: "חימום: משפחת at-",
      type: "warmup",
      learningGoal: "לזהות מילים ממשפחת at-.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(15, 0, 1, "מה שמעתם?", "cat", ["חתול", "כובע", "עטלף"], "חתול", [], 1, "abstract"),
        listenChoose(15, 0, 2, "מה שמעתם?", "hat", ["כובע", "חתול", "שטיחון"], "כובע", [], 1, "abstract"),
        listenChoose(15, 0, 3, "מה שמעתם?", "bat", ["עטלף", "עכבר", "כובע"], "עטלף", [], 2, "abstract"),
        listenChoose(15, 0, 4, "מה שמעתם?", "rat", ["עכבר", "שטיחון", "חתול"], "עכבר", [], 2, "abstract"),
      ],
    },
    {
      id: "day-15-section-1",
      title: "משפחת an-",
      type: "verbal",
      learningGoal: "לקשר בין מילים ממשפחת an- לפירוש.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(15, 1, 1, "מה פירוש המילה 'can'?", ["פחית", "איש", "מאוורר"], "פחית", [], 1, "abstract"),
        multipleChoice(15, 1, 2, "מה פירוש המילה 'man'?", ["איש", "מחבת", "פחית"], "איש", [], 1, "abstract"),
        listenChoose(15, 1, 3, "מה שמעתם?", "fan", ["מאוורר", "מחבת", "איש"], "מאוורר", [], 2, "abstract"),
        listenChoose(15, 1, 4, "מה שמעתם?", "pan", ["מחבת", "פחית", "מאוורר"], "מחבת", [], 2, "abstract"),
        letterTiles(15, 1, 5, "הרכיבו את המילה ששמעתם:", "can", [], 2, "abstract", "can"),
      ],
    },
    {
      id: "day-15-section-2",
      title: "משפחות ig- ו-og",
      type: "verbal",
      learningGoal: "להרחיב מילים ממשפחות ig- ו-og.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(15, 2, 1, "מה שמעתם?", "big", ["גדול", "חזיר", "לחפור"], "גדול", [], 1, "abstract"),
        multipleChoice(15, 2, 2, "מה פירוש המילה 'pig'?", ["חזיר", "כלב", "גדול"], "חזיר", [], 2, "abstract"),
        listenChoose(15, 2, 3, "מה שמעתם?", "dog", ["כלב", "ערפל", "בול עץ"], "כלב", [], 1, "abstract"),
        multipleChoice(15, 2, 4, "מה פירוש המילה 'fog'?", ["ערפל", "בול עץ", "כלב"], "ערפל", [], 2, "abstract"),
        letterTiles(15, 2, 5, "הרכיבו את המילה ששמעתם:", "pig", [], 2, "abstract", "pig"),
      ],
    },
    {
      id: "day-15-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על משפחות המילים מהיום.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(15, 3, 1, "מה שמעתם?", "mat", ["שטיחון", "כובע", "עכבר"], "שטיחון", [], 1, "abstract"),
        multipleChoice(15, 3, 2, "מה פירוש המילה 'dig'?", ["לחפור", "חזיר", "גדול"], "לחפור", [], 2, "abstract"),
        multipleChoice(15, 3, 3, "מה פירוש המילה 'log'?", ["בול עץ", "ערפל", "כלב"], "בול עץ", [], 2, "abstract"),
        trueFalse(15, 3, 4, "האם 'cat' פירושו 'חתול'?", true, [], 1, "abstract"),
        trueFalse(15, 3, 5, "האם 'pig' פירושו 'כלב'?", false, [], 2, "abstract"),
        letterTiles(15, 3, 6, "הרכיבו את המילה ששמעתם:", "hat", [], 2, "abstract", "hat"),
        matchPairs(
          15,
          3,
          7,
          "התאימו כל מילה לפירוש:",
          [
            { left: "cat", right: "חתול" },
            { left: "pig", right: "חזיר" },
            { left: "dog", right: "כלב" },
            { left: "fan", right: "מאוורר" },
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
