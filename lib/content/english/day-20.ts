import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 20 — "כינויי גוף ו-to be" (שלב ב, A1). */
export const englishDay20: WorkbookDay = {
  id: "day-20",
  dayNumber: 20,
  title: "שיעור 20: כינויי גוף ו-to be",
  week: 6,
  objective: "להכיר כינויי גוף ולחבר אותם עם am/is/are.",
  teachingSummary:
    "היום נלמד כינויי גוף באנגלית: I זה אני, you זה אתה, he זה הוא, she זה היא, it זה זה. אחרי הכינוי באה מילת to be: I am, you are, he is, she is, it is.",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-20-section-0",
      title: "חימום: כינויי גוף",
      type: "warmup",
      learningGoal: "לזהות כינויי גוף בסיסיים.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(20, 0, 1, "מה שמעתם?", "I", ["אני", "אתה", "הוא"], "אני", [], 1, "abstract"),
        listenChoose(20, 0, 2, "מה שמעתם?", "you", ["אתה", "אני", "היא"], "אתה", [], 1, "abstract"),
        listenChoose(20, 0, 3, "מה שמעתם?", "he", ["הוא", "היא", "זה"], "הוא", [], 2, "abstract"),
        listenChoose(20, 0, 4, "מה שמעתם?", "she", ["היא", "הוא", "אני"], "היא", [], 2, "abstract"),
      ],
    },
    {
      id: "day-20-section-1",
      title: "כינויים ופירוש",
      type: "verbal",
      learningGoal: "לקשר בין כינוי גוף באנגלית לפירוש.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(20, 1, 1, "איך אומרים 'הוא'?", ["he", "she", "I"], "he", [], 1, "abstract"),
        multipleChoice(20, 1, 2, "מה פירוש המילה 'she'?", ["היא", "הוא", "אני"], "היא", [], 1, "abstract"),
        listenChoose(20, 1, 3, "מה שמעתם?", "it", ["זה", "הוא", "היא"], "זה", [], 2, "abstract"),
        multipleChoice(20, 1, 4, "מה פירוש המילה 'you'?", ["אתה", "אני", "זה"], "אתה", [], 2, "abstract"),
        letterTiles(20, 1, 5, "הרכיבו את המילה ששמעתם:", "you", [], 2, "abstract", "you"),
      ],
    },
    {
      id: "day-20-section-2",
      title: "כינוי עם to be",
      type: "verbal",
      learningGoal: "לחבר כינוי גוף עם am/is/are.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(20, 2, 1, "מה נכון?", ["I is", "I am"], "I am", [], 1, "abstract"),
        multipleChoice(20, 2, 2, "מה נכון?", ["he am", "he is"], "he is", [], 1, "abstract"),
        multipleChoice(20, 2, 3, "מה נכון?", ["you is", "you are"], "you are", [], 2, "abstract"),
        multipleChoice(20, 2, 4, "מה נכון?", ["she are", "she is"], "she is", [], 2, "abstract"),
        letterTiles(20, 2, 5, "הרכיבו את המילה ששמעתם:", "she", [], 2, "abstract", "she"),
      ],
    },
    {
      id: "day-20-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על כינויי הגוף ו-to be.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(20, 3, 1, "מה שמעתם?", "he", ["הוא", "היא", "אני"], "הוא", [], 1, "abstract"),
        multipleChoice(20, 3, 2, "איך אומרים 'אני'?", ["I", "you", "he"], "I", [], 1, "abstract"),
        trueFalse(20, 3, 3, "האם אומרים 'I am'?", true, [], 1, "abstract"),
        trueFalse(20, 3, 4, "האם 'she' פירושו 'היא'?", true, [], 2, "abstract"),
        letterTiles(20, 3, 5, "הרכיבו את המילה ששמעתם:", "he", [], 2, "abstract", "he"),
        matchPairs(
          20,
          3,
          6,
          "התאימו כל מילה לפירוש:",
          [
            { left: "I", right: "אני" },
            { left: "you", right: "אתה" },
            { left: "he", right: "הוא" },
            { left: "she", right: "היא" },
            { left: "it", right: "זה" },
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
