import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 21 — "can ו-can't" (שלב ב, A1). */
export const englishDay21: WorkbookDay = {
  id: "day-21",
  dayNumber: 21,
  title: "שיעור 21: can ו-can't",
  week: 6,
  objective: "להשתמש ב-can ו-can't עם פעלים.",
  teachingSummary:
    "היום נלמד פעלים באנגלית: run זה לרוץ, jump זה לקפוץ, swim זה לשחות, fly זה לעוף, walk זה ללכת. can פירושו יכול ו-can't פירושו לא יכול.",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-21-section-0",
      title: "חימום: פעלים",
      type: "warmup",
      learningGoal: "לזהות פעלים בסיסיים.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(21, 0, 1, "מה שמעתם?", "run", ["לרוץ", "לקפוץ", "לשחות"], "לרוץ", [], 1, "abstract"),
        listenChoose(21, 0, 2, "מה שמעתם?", "jump", ["לקפוץ", "לרוץ", "לעוף"], "לקפוץ", [], 1, "abstract"),
        listenChoose(21, 0, 3, "מה שמעתם?", "swim", ["לשחות", "ללכת", "לרוץ"], "לשחות", [], 2, "abstract"),
        listenChoose(21, 0, 4, "מה שמעתם?", "fly", ["לעוף", "לשחות", "לקפוץ"], "לעוף", [], 2, "abstract"),
      ],
    },
    {
      id: "day-21-section-1",
      title: "פעלים ופירוש",
      type: "verbal",
      learningGoal: "לקשר בין פועל באנגלית לפירוש.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(21, 1, 1, "איך אומרים 'לשחות'?", ["swim", "run", "jump"], "swim", [], 1, "abstract"),
        multipleChoice(21, 1, 2, "מה פירוש המילה 'walk'?", ["ללכת", "לרוץ", "לעוף"], "ללכת", [], 1, "abstract"),
        listenChoose(21, 1, 3, "מה שמעתם?", "walk", ["ללכת", "לרוץ", "לקפוץ"], "ללכת", [], 2, "abstract"),
        multipleChoice(21, 1, 4, "מה פירוש המילה 'fly'?", ["לעוף", "לשחות", "ללכת"], "לעוף", [], 2, "abstract"),
        letterTiles(21, 1, 5, "הרכיבו את המילה ששמעתם:", "run", [], 2, "abstract", "run"),
      ],
    },
    {
      id: "day-21-section-2",
      title: "can ו-can't",
      type: "verbal",
      learningGoal: "להשתמש ב-can עם פעלים במשפט.",
      prerequisiteSkillTags: [],
      exercises: [
        trueFalse(21, 2, 1, "האם 'A fish can swim'? (דג יכול לשחות)", true, [], 1, "abstract"),
        trueFalse(21, 2, 2, "האם 'A dog can fly'? (כלב יכול לעוף)", false, [], 1, "abstract"),
        multipleChoice(21, 2, 3, "מה נכון? כלב יכול לרוץ:", ["A dog can run", "A dog can fly"], "A dog can run", [], 2, "abstract"),
        listenChoose(21, 2, 4, "מה שמעתם?", "jump", ["לקפוץ", "לשחות", "ללכת"], "לקפוץ", [], 2, "abstract"),
        letterTiles(21, 2, 5, "הרכיבו את המילה ששמעתם:", "jump", [], 2, "abstract", "jump"),
      ],
    },
    {
      id: "day-21-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על הפעלים מהיום.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(21, 3, 1, "מה שמעתם?", "swim", ["לשחות", "לרוץ", "לעוף"], "לשחות", [], 1, "abstract"),
        multipleChoice(21, 3, 2, "איך אומרים 'לרוץ'?", ["run", "walk", "jump"], "run", [], 1, "abstract"),
        trueFalse(21, 3, 3, "האם 'jump' פירושו 'לקפוץ'?", true, [], 1, "abstract"),
        trueFalse(21, 3, 4, "האם 'walk' פירושו 'לעוף'?", false, [], 2, "abstract"),
        letterTiles(21, 3, 5, "הרכיבו את המילה ששמעתם:", "fly", [], 2, "abstract", "fly"),
        matchPairs(
          21,
          3,
          6,
          "התאימו כל מילה לפירוש:",
          [
            { left: "run", right: "לרוץ" },
            { left: "jump", right: "לקפוץ" },
            { left: "swim", right: "לשחות" },
            { left: "fly", right: "לעוף" },
            { left: "walk", right: "ללכת" },
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
