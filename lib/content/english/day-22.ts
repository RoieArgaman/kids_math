import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 22 — "I like — אני אוהב" (שלב ב, A1). */
export const englishDay22: WorkbookDay = {
  id: "day-22",
  dayNumber: 22,
  title: "שיעור 22: I like — אני אוהב",
  week: 7,
  objective: "לומר מה אוהבים ולא אוהבים באנגלית.",
  teachingSummary:
    "היום נלמד לומר מה אנחנו אוהבים: like פירושו אוהב ו-don't like פירושו לא אוהב. נשתמש במילים של אוכל שכבר למדנו: apple, banana, pizza, milk, cake, water.",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-22-section-0",
      title: "חימום: אוכל",
      type: "warmup",
      learningGoal: "לזהות שמות של אוכל באנגלית.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(22, 0, 1, "מה שמעתם?", "apple", ["תפוח", "בננה", "פיצה"], "תפוח", [], 1, "abstract"),
        listenChoose(22, 0, 2, "מה שמעתם?", "banana", ["בננה", "תפוח", "חלב"], "בננה", [], 1, "abstract"),
        listenChoose(22, 0, 3, "מה שמעתם?", "pizza", ["פיצה", "עוגה", "מים"], "פיצה", [], 2, "abstract"),
        listenChoose(22, 0, 4, "מה שמעתם?", "milk", ["חלב", "מים", "תפוח"], "חלב", [], 2, "abstract"),
      ],
    },
    {
      id: "day-22-section-1",
      title: "אוכל ופירוש",
      type: "verbal",
      learningGoal: "לקשר בין מילת אוכל באנגלית לפירוש.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(22, 1, 1, "מה פירוש המילה 'cake'?", ["עוגה", "פיצה", "תפוח"], "עוגה", [], 1, "abstract"),
        multipleChoice(22, 1, 2, "מה פירוש המילה 'water'?", ["מים", "חלב", "בננה"], "מים", [], 1, "abstract"),
        listenChoose(22, 1, 3, "מה שמעתם?", "cake", ["עוגה", "חלב", "מים"], "עוגה", [], 2, "abstract"),
        listenChoose(22, 1, 4, "מה שמעתם?", "water", ["מים", "חלב", "פיצה"], "מים", [], 2, "abstract"),
        letterTiles(22, 1, 5, "הרכיבו את המילה ששמעתם:", "cake", [], 2, "abstract", "cake"),
      ],
    },
    {
      id: "day-22-section-2",
      title: "I like",
      type: "verbal",
      learningGoal: "לומר מה אוהבים באנגלית.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(22, 2, 1, "איך אומרים 'אני אוהב'?", ["I like", "I see", "I am"], "I like", [], 1, "abstract"),
        multipleChoice(22, 2, 2, "מה נכון? אני אוהב פיצה:", ["I like pizza", "I pizza like"], "I like pizza", [], 2, "abstract"),
        trueFalse(22, 2, 3, "האם 'I don't like' פירושו 'אני לא אוהב'?", true, [], 1, "abstract"),
        listenChoose(22, 2, 4, "מה שמעתם?", "apple", ["תפוח", "בננה", "עוגה"], "תפוח", [], 2, "abstract"),
        letterTiles(22, 2, 5, "הרכיבו את המילה ששמעתם:", "like", [], 2, "abstract", "like"),
      ],
    },
    {
      id: "day-22-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על מילות האוכל ו-I like.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(22, 3, 1, "מה שמעתם?", "banana", ["בננה", "תפוח", "מים"], "בננה", [], 1, "abstract"),
        multipleChoice(22, 3, 2, "איך אומרים 'תפוח'?", ["apple", "banana", "cake"], "apple", [], 1, "abstract"),
        trueFalse(22, 3, 3, "האם 'milk' פירושו 'חלב'?", true, [], 1, "abstract"),
        trueFalse(22, 3, 4, "האם 'pizza' פירושו 'עוגה'?", false, [], 2, "abstract"),
        letterTiles(22, 3, 5, "הרכיבו את המילה ששמעתם:", "milk", [], 2, "abstract", "milk"),
        matchPairs(
          22,
          3,
          6,
          "התאימו כל מילה לפירוש:",
          [
            { left: "apple", right: "תפוח" },
            { left: "banana", right: "בננה" },
            { left: "pizza", right: "פיצה" },
            { left: "milk", right: "חלב" },
            { left: "cake", right: "עוגה" },
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
