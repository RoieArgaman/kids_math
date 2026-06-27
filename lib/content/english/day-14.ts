import { letterTiles, listenChoose, matchPairs } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 14 — "Level A review (part 1)" (Pre-A1, listening-first). */
export const englishDay14: WorkbookDay = {
  id: "day-14",
  dayNumber: 14,
  title: "שיעור 14: חזרה — שלב א",
  week: 4,
  objective: "לחזור על אוצר המילים, האותיות והמילים הקצרות של שלב א.",
  teachingSummary:
    "היום נחזור על כל מה שלמדנו בשלב א: צבעים, מספרים, חיות, גוף, כיתה, אותיות ומילים קצרות. החזרה הזו משלימה את שלב א. כל הכבוד!",
  teachingSteps: ["מקשיבים 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-14-section-0",
      title: "חימום: צבעים ומספרים",
      type: "warmup",
      learningGoal: "לחזור על צבעים ומספרים בסיסיים.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(14, 0, 1, "מה שמעתם?", "red", ["אדום", "כחול", "ירוק"], "אדום", [], 1, "abstract"),
        listenChoose(14, 0, 2, "מה שמעתם?", "blue", ["כחול", "אדום", "ירוק"], "כחול", [], 1, "abstract"),
        listenChoose(14, 0, 3, "מה שמעתם?", "one", ["אחת", "שתיים", "שלוש"], "אחת", [], 1, "abstract"),
        listenChoose(14, 0, 4, "מה שמעתם?", "two", ["שתיים", "אחת", "שלוש"], "שתיים", [], 1, "abstract"),
      ],
    },
    {
      id: "day-14-section-1",
      title: "חיות וגוף",
      type: "verbal",
      learningGoal: "לחזור על שמות חיות ואיברי גוף.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(14, 1, 1, "מה שמעתם?", "dog", ["כלב", "חתול", "דג"], "כלב", [], 1, "abstract"),
        listenChoose(14, 1, 2, "מה שמעתם?", "fish", ["דג", "כלב", "חתול"], "דג", [], 1, "abstract"),
        listenChoose(14, 1, 3, "מה שמעתם?", "cat", ["חתול", "כלב", "דג"], "חתול", [], 1, "abstract"),
        listenChoose(14, 1, 4, "מה שמעתם?", "hand", ["יד", "עין", "ספר"], "יד", [], 1, "abstract"),
        listenChoose(14, 1, 5, "מה שמעתם?", "eye", ["עין", "יד", "ספר"], "עין", [], 1, "abstract"),
      ],
    },
    {
      id: "day-14-section-2",
      title: "כיתה, אותיות ומילים קצרות",
      type: "verbal",
      learningGoal: "לחזור על מילות כיתה, אותיות ומילים קצרות.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(14, 2, 1, "מה שמעתם?", "book", ["ספר", "עט", "יד"], "ספר", [], 1, "abstract"),
        listenChoose(14, 2, 2, "מה שמעתם?", "pen", ["עט", "ספר", "יד"], "עט", [], 1, "abstract"),
        listenChoose(14, 2, 3, "באיזו אות מתחילה המילה?", "sun", ["S", "H", "B"], "S", [], 1, "abstract", "en"),
        letterTiles(14, 2, 4, "הרכיבו את המילה ששמעתם:", "sun", [], 1, "abstract", "sun"),
        letterTiles(14, 2, 5, "הרכיבו את המילה ששמעתם:", "hat", [], 2, "abstract", "hat"),
      ],
    },
    {
      id: "day-14-section-3",
      title: "חזרה גדולה — שלב א",
      type: "review",
      learningGoal: "לחזור על כל אוצר המילים של שלב א.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(14, 3, 1, "מה שמעתם?", "green", ["ירוק", "כחול", "אדום"], "ירוק", [], 1, "abstract"),
        listenChoose(14, 3, 2, "מה שמעתם?", "three", ["שלוש", "שתיים", "אחת"], "שלוש", [], 1, "abstract"),
        listenChoose(14, 3, 3, "מה שמעתם?", "dog", ["כלב", "חתול", "דג"], "כלב", [], 1, "abstract"),
        listenChoose(14, 3, 4, "מה שמעתם?", "eye", ["עין", "יד", "ספר"], "עין", [], 1, "abstract"),
        listenChoose(14, 3, 5, "מה שמעתם?", "book", ["ספר", "עט", "יד"], "ספר", [], 2, "abstract"),
        letterTiles(14, 3, 6, "הרכיבו את המילה ששמעתם:", "red", [], 1, "abstract", "red"),
        matchPairs(
          14,
          3,
          7,
          "התאימו כל מילה לפירוש:",
          [
            { left: "blue", right: "כחול" },
            { left: "dog", right: "כלב" },
            { left: "hand", right: "יד" },
            { left: "book", right: "ספר" },
          ],
          [],
          1,
          "abstract",
          {
            leftLang: "en",
            rightLang: "he",
            audioByLeft: { blue: "blue", dog: "dog", hand: "hand", book: "book" },
          },
        ),
      ],
    },
  ],
};
