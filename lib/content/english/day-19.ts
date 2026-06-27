import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 19 — "this and that" (Level B, A1). */
export const englishDay19: WorkbookDay = {
  id: "day-19",
  dayNumber: 19,
  title: "שיעור 19: this ו-that",
  week: 6,
  objective: "להבדיל בין this, that, these, those.",
  teachingSummary:
    "this פירושו זה בקרבה ולדבר אחד, that פירושו זה במרחק. these פירושו אלה בקרבה ולכמה דברים, those פירושו אלה במרחק ולכמה דברים.",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-19-section-0",
      title: "חימום: קרוב ורחוק",
      type: "warmup",
      learningGoal: "לזהות this ו-that.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(19, 0, 1, "מה פירוש 'this'?", ["זה קרוב", "זה רחוק", "אלה רחוק"], "זה קרוב", [], 1, "abstract"),
        multipleChoice(19, 0, 2, "מה פירוש 'that'?", ["זה רחוק", "זה קרוב", "אלה קרוב"], "זה רחוק", [], 1, "abstract"),
        listenChoose(19, 0, 3, "מה שמעתם?", "this", ["זה קרוב", "זה רחוק", "אלה רחוק"], "זה קרוב", [], 2, "abstract"),
        listenChoose(19, 0, 4, "מה שמעתם?", "that", ["זה רחוק", "זה קרוב", "אלה קרוב"], "זה רחוק", [], 2, "abstract"),
      ],
    },
    {
      id: "day-19-section-1",
      title: "יחיד ורבים: קרוב",
      type: "verbal",
      learningGoal: "להבדיל בין this ל-these.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(19, 1, 1, "מה פירוש 'these'?", ["אלה קרוב", "זה קרוב", "אלה רחוק"], "אלה קרוב", [], 1, "abstract"),
        multipleChoice(19, 1, 2, "איך אומרים 'זה' (קרוב, יחיד)?", ["this", "these", "that"], "this", [], 1, "abstract"),
        listenChoose(19, 1, 3, "מה שמעתם?", "these", ["אלה קרוב", "אלה רחוק", "זה קרוב"], "אלה קרוב", [], 2, "abstract"),
        multipleChoice(19, 1, 4, "איך אומרים 'אלה' (קרוב, רבים)?", ["these", "this", "those"], "these", [], 2, "abstract"),
        letterTiles(19, 1, 5, "הרכיבו את המילה ששמעתם:", "this", [], 2, "abstract", "this"),
      ],
    },
    {
      id: "day-19-section-2",
      title: "יחיד ורבים: רחוק",
      type: "verbal",
      learningGoal: "להבדיל בין that ל-those.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(19, 2, 1, "מה פירוש 'those'?", ["אלה רחוק", "אלה קרוב", "זה רחוק"], "אלה רחוק", [], 1, "abstract"),
        multipleChoice(19, 2, 2, "איך אומרים 'אלה' (רחוק, רבים)?", ["those", "these", "that"], "those", [], 2, "abstract"),
        listenChoose(19, 2, 3, "מה שמעתם?", "those", ["אלה רחוק", "אלה קרוב", "זה רחוק"], "אלה רחוק", [], 2, "abstract"),
        multipleChoice(19, 2, 4, "איך אומרים 'זה' (רחוק, יחיד)?", ["that", "those", "this"], "that", [], 1, "abstract"),
        letterTiles(19, 2, 5, "הרכיבו את המילה ששמעתם:", "that", [], 2, "abstract", "that"),
      ],
    },
    {
      id: "day-19-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על this, that, these, those.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(19, 3, 1, "מה שמעתם?", "this", ["זה קרוב", "זה רחוק", "אלה קרוב"], "זה קרוב", [], 1, "abstract"),
        multipleChoice(19, 3, 2, "מה פירוש 'that'?", ["זה רחוק", "אלה רחוק", "זה קרוב"], "זה רחוק", [], 2, "abstract"),
        multipleChoice(19, 3, 3, "מה פירוש 'these'?", ["אלה קרוב", "זה קרוב", "אלה רחוק"], "אלה קרוב", [], 2, "abstract"),
        trueFalse(19, 3, 4, "האם 'these' מתאר רבים?", true, [], 1, "abstract"),
        trueFalse(19, 3, 5, "האם 'this' מתאר רבים?", false, [], 2, "abstract"),
        letterTiles(19, 3, 6, "הרכיבו את המילה ששמעתם:", "these", [], 2, "abstract", "these"),
        matchPairs(
          19,
          3,
          7,
          "התאימו כל מילה לפירוש:",
          [
            { left: "this", right: "זה קרוב" },
            { left: "that", right: "זה רחוק" },
            { left: "these", right: "אלה קרוב" },
            { left: "those", right: "אלה רחוק" },
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
