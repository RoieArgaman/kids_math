import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 23 — "איפה? in, on, under" (שלב ב, A1). */
export const englishDay23: WorkbookDay = {
  id: "day-23",
  dayNumber: 23,
  title: "שיעור 23: איפה? in, on, under",
  week: 7,
  objective: "להכיר מילות מקום: in, on, under.",
  teachingSummary:
    "היום נלמד מילות מקום באנגלית: in פירושו בתוך, on פירושו על, under פירושו מתחת. המילים האלה עוזרות לנו להגיד איפה נמצא משהו.",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-23-section-0",
      title: "חימום: מילות מקום",
      type: "warmup",
      learningGoal: "לזהות מילות מקום בסיסיות.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(23, 0, 1, "מה שמעתם?", "in", ["בתוך", "על", "מתחת"], "בתוך", [], 1, "abstract"),
        listenChoose(23, 0, 2, "מה שמעתם?", "on", ["על", "בתוך", "מתחת"], "על", [], 1, "abstract"),
        listenChoose(23, 0, 3, "מה שמעתם?", "under", ["מתחת", "על", "בתוך"], "מתחת", [], 2, "abstract"),
        multipleChoice(23, 0, 4, "מה פירוש המילה 'in'?", ["בתוך", "על", "מתחת"], "בתוך", [], 2, "abstract"),
      ],
    },
    {
      id: "day-23-section-1",
      title: "מילות מקום ופירוש",
      type: "verbal",
      learningGoal: "לקשר בין מילת מקום באנגלית לפירוש.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(23, 1, 1, "איך אומרים 'על'?", ["on", "in", "under"], "on", [], 1, "abstract"),
        multipleChoice(23, 1, 2, "מה פירוש המילה 'under'?", ["מתחת", "על", "בתוך"], "מתחת", [], 1, "abstract"),
        listenChoose(23, 1, 3, "מה שמעתם?", "on", ["על", "בתוך", "מתחת"], "על", [], 2, "abstract"),
        listenChoose(23, 1, 4, "מה שמעתם?", "under", ["מתחת", "בתוך", "על"], "מתחת", [], 2, "abstract"),
        letterTiles(23, 1, 5, "הרכיבו את המילה ששמעתם:", "in", [], 2, "abstract", "in"),
      ],
    },
    {
      id: "day-23-section-2",
      title: "קוראים משפט",
      type: "verbal",
      learningGoal: "להבין מילת מקום במשפט.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(23, 2, 1, "קראו: 'The cat is on the box.' איפה החתול?", ["על הקופסה", "בתוך הקופסה", "מתחת לקופסה"], "על הקופסה", [], 2, "abstract"),
        trueFalse(23, 2, 2, "האם 'under' פירושו 'מתחת'?", true, [], 1, "abstract"),
        trueFalse(23, 2, 3, "האם 'on' פירושו 'בתוך'?", false, [], 2, "abstract"),
        listenChoose(23, 2, 4, "מה שמעתם?", "in", ["בתוך", "על", "מתחת"], "בתוך", [], 2, "abstract"),
        letterTiles(23, 2, 5, "הרכיבו את המילה ששמעתם:", "on", [], 2, "abstract", "on"),
      ],
    },
    {
      id: "day-23-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על מילות המקום מהיום.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(23, 3, 1, "מה שמעתם?", "on", ["על", "בתוך", "מתחת"], "על", [], 1, "abstract"),
        multipleChoice(23, 3, 2, "איך אומרים 'בתוך'?", ["in", "on", "under"], "in", [], 1, "abstract"),
        trueFalse(23, 3, 3, "האם 'in' פירושו 'בתוך'?", true, [], 1, "abstract"),
        trueFalse(23, 3, 4, "האם 'under' פירושו 'על'?", false, [], 2, "abstract"),
        letterTiles(23, 3, 5, "הרכיבו את המילה ששמעתם:", "in", [], 2, "abstract", "in"),
        multipleChoice(23, 3, 6, "מה פירוש המילה 'on'?", ["על", "בתוך", "מתחת"], "על", [], 2, "abstract"),
        matchPairs(
          23,
          3,
          7,
          "התאימו כל מילה לפירוש:",
          [
            { left: "in", right: "בתוך" },
            { left: "on", right: "על" },
            { left: "under", right: "מתחת" },
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
