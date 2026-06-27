import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 24 — "מספרים 11–20" (שלב ב, A1). */
export const englishDay24: WorkbookDay = {
  id: "day-24",
  dayNumber: 24,
  title: "שיעור 24: מספרים 11–20",
  week: 8,
  objective: "לזהות ולומר מספרים מ-11 עד 20 באנגלית.",
  teachingSummary:
    "היום נלמד מספרים מ-11 עד 20 באנגלית: eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen, twenty. נחזור גם על המספרים מ-1 עד 10.",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-24-section-0",
      title: "חימום: מספרים 1–10",
      type: "warmup",
      learningGoal: "לחזור על מספרים בסיסיים.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(24, 0, 1, "מה שמעתם?", "one", ["1", "2", "3"], "1", [], 1, "abstract", "en"),
        listenChoose(24, 0, 2, "מה שמעתם?", "two", ["2", "1", "4"], "2", [], 1, "abstract", "en"),
        listenChoose(24, 0, 3, "מה שמעתם?", "three", ["3", "2", "5"], "3", [], 2, "abstract", "en"),
        multipleChoice(24, 0, 4, "איך אומרים 3?", ["three", "two", "thirteen"], "three", [], 2, "abstract"),
      ],
    },
    {
      id: "day-24-section-1",
      title: "מספרים 11–15",
      type: "verbal",
      learningGoal: "לזהות מספרים מ-11 עד 15.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(24, 1, 1, "מה שמעתם?", "eleven", ["11", "12", "13"], "11", [], 1, "abstract", "en"),
        listenChoose(24, 1, 2, "מה שמעתם?", "twelve", ["12", "11", "14"], "12", [], 1, "abstract", "en"),
        listenChoose(24, 1, 3, "מה שמעתם?", "thirteen", ["13", "12", "15"], "13", [], 2, "abstract", "en"),
        multipleChoice(24, 1, 4, "איך אומרים 15?", ["fifteen", "fifty", "five"], "fifteen", [], 2, "abstract"),
        letterTiles(24, 1, 5, "הרכיבו את המילה ששמעתם:", "ten", [], 2, "abstract", "ten"),
      ],
    },
    {
      id: "day-24-section-2",
      title: "מספרים 16–20",
      type: "verbal",
      learningGoal: "לזהות מספרים מ-16 עד 20.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(24, 2, 1, "מה שמעתם?", "sixteen", ["16", "17", "18"], "16", [], 1, "abstract", "en"),
        listenChoose(24, 2, 2, "מה שמעתם?", "eighteen", ["18", "17", "19"], "18", [], 2, "abstract", "en"),
        listenChoose(24, 2, 3, "מה שמעתם?", "twenty", ["20", "19", "12"], "20", [], 2, "abstract", "en"),
        multipleChoice(24, 2, 4, "איך אומרים 17?", ["seventeen", "seventy", "seven"], "seventeen", [], 2, "abstract"),
        letterTiles(24, 2, 5, "הרכיבו את המילה ששמעתם:", "six", [], 2, "abstract", "six"),
      ],
    },
    {
      id: "day-24-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על המספרים 11–20.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(24, 3, 1, "מה שמעתם?", "fourteen", ["14", "13", "15"], "14", [], 1, "abstract", "en"),
        multipleChoice(24, 3, 2, "איך אומרים 19?", ["nineteen", "ninety", "nine"], "nineteen", [], 2, "abstract"),
        trueFalse(24, 3, 3, "האם 'twenty' זה 20?", true, [], 1, "abstract"),
        trueFalse(24, 3, 4, "האם 'thirteen' זה 30?", false, [], 2, "abstract"),
        letterTiles(24, 3, 5, "הרכיבו את המילה ששמעתם:", "ten", [], 2, "abstract", "ten"),
        matchPairs(
          24,
          3,
          6,
          "התאימו כל מילה למספר:",
          [
            { left: "eleven", right: "11" },
            { left: "twelve", right: "12" },
            { left: "fifteen", right: "15" },
            { left: "eighteen", right: "18" },
            { left: "twenty", right: "20" },
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
