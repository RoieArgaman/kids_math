import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 16 — "Sight words" (Level B, A1). */
export const englishDay16: WorkbookDay = {
  id: "day-16",
  dayNumber: 16,
  title: "שיעור 16: מילים נפוצות",
  week: 5,
  objective: "לזהות מילים נפוצות וחשובות באנגלית.",
  teachingSummary:
    "היום נלמד מילים נפוצות מאוד באנגלית, כמו I, you, see. את המילים האלה כדאי לזהות מהר. קודם מקשיבים ואז בוחרים.",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-16-section-0",
      title: "חימום: אני ואתה",
      type: "warmup",
      learningGoal: "לזהות מילים נפוצות בסיסיות.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(16, 0, 1, "איך אומרים 'אני' באנגלית?", ["I", "you", "he"], "I", [], 1, "abstract"),
        listenChoose(16, 0, 2, "מה שמעתם?", "you", ["אתה", "אני", "הוא"], "אתה", [], 1, "abstract"),
        multipleChoice(16, 0, 3, "איך אומרים 'הוא' באנגלית?", ["he", "she", "you"], "he", [], 2, "abstract"),
        listenChoose(16, 0, 4, "מה שמעתם?", "she", ["היא", "הוא", "אני"], "היא", [], 2, "abstract"),
      ],
    },
    {
      id: "day-16-section-1",
      title: "מילות פעולה נפוצות",
      type: "verbal",
      learningGoal: "לקשר בין מילים נפוצות לפירוש.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(16, 1, 1, "מה פירוש המילה 'see'?", ["לראות", "אוהב", "וגם"], "לראות", [], 1, "abstract"),
        multipleChoice(16, 1, 2, "מה פירוש המילה 'like'?", ["אוהב", "לראות", "אני"], "אוהב", [], 1, "abstract"),
        listenChoose(16, 1, 3, "מה שמעתם?", "see", ["לראות", "אוהב", "וגם"], "לראות", [], 2, "abstract"),
        listenChoose(16, 1, 4, "מה שמעתם?", "like", ["אוהב", "לראות", "היא"], "אוהב", [], 2, "abstract"),
        letterTiles(16, 1, 5, "הרכיבו את המילה ששמעתם:", "see", [], 2, "abstract", "see"),
      ],
    },
    {
      id: "day-16-section-2",
      title: "מילות קישור",
      type: "verbal",
      learningGoal: "להכיר מילים קטנות וחשובות במשפט.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(16, 2, 1, "מה פירוש המילה 'and'?", ["וגם", "הא הידיעה", "אני"], "וגם", [], 1, "abstract"),
        multipleChoice(16, 2, 2, "איך אומרים 'אתה' באנגלית?", ["you", "he", "she"], "you", [], 2, "abstract"),
        listenChoose(16, 2, 3, "מה שמעתם?", "I", ["אני", "אתה", "הוא"], "אני", [], 1, "abstract"),
        multipleChoice(16, 2, 4, "איך אומרים 'היא' באנגלית?", ["she", "he", "you"], "she", [], 2, "abstract"),
        letterTiles(16, 2, 5, "הרכיבו את המילה ששמעתם:", "and", [], 2, "abstract", "and"),
      ],
    },
    {
      id: "day-16-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על המילים הנפוצות מהיום.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(16, 3, 1, "מה שמעתם?", "he", ["הוא", "היא", "אתה"], "הוא", [], 1, "abstract"),
        multipleChoice(16, 3, 2, "מה פירוש המילה 'the'?", ["הא הידיעה", "אחד", "וגם"], "הא הידיעה", [], 2, "abstract"),
        multipleChoice(16, 3, 3, "מה פירוש המילה 'a'?", ["אחד", "הא הידיעה", "אני"], "אחד", [], 2, "abstract"),
        trueFalse(16, 3, 4, "האם 'like' פירושו 'אוהב'?", true, [], 1, "abstract"),
        trueFalse(16, 3, 5, "האם 'see' פירושו 'אוהב'?", false, [], 2, "abstract"),
        letterTiles(16, 3, 6, "הרכיבו את המילה ששמעתם:", "you", [], 2, "abstract", "you"),
        matchPairs(
          16,
          3,
          7,
          "התאימו כל מילה לפירוש:",
          [
            { left: "I", right: "אני" },
            { left: "you", right: "אתה" },
            { left: "see", right: "לראות" },
            { left: "like", right: "אוהב" },
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
