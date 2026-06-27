import { listenChoose, matchPairs } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 7 — "In the Classroom" (Pre-A1, listening-first). */
export const englishDay07: WorkbookDay = {
  id: "day-7",
  dayNumber: 7,
  title: "שיעור 7: בכיתה",
  week: 2,
  objective: "להכיר מילים על חפצים בכיתה באנגלית דרך הקשבה.",
  teachingSummary: "היום נלמד מילים על חפצים בכיתה באנגלית. קודם מקשיבים ואז בוחרים.",
  teachingSteps: ["מקשיבים למילה 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים מילים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-7-section-0",
      title: "חימום: ספר ועט",
      type: "warmup",
      learningGoal: "לזהות חפצים בסיסיים בכיתה.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(7, 0, 1, "מה שמעתם?", "book", ["ספר", "עט", "תיק"], "ספר", [], 1, "abstract"),
        listenChoose(7, 0, 2, "מה שמעתם?", "pen", ["עט", "ספר", "כיסא"], "עט", [], 1, "abstract"),
        listenChoose(7, 0, 3, "מה שמעתם?", "bag", ["תיק", "שולחן", "ספר"], "תיק", [], 2, "abstract"),
        listenChoose(7, 0, 4, "מה שמעתם?", "chair", ["כיסא", "שולחן", "עט"], "כיסא", [], 2, "abstract"),
      ],
    },
    {
      id: "day-7-section-1",
      title: "חפצים בכיתה",
      type: "verbal",
      learningGoal: "לקשר בין חפץ באנגלית לפירוש.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(7, 1, 1, "מה שמעתם?", "book", ["ספר", "עט", "תיק"], "ספר", [], 1, "abstract"),
        listenChoose(7, 1, 2, "מה שמעתם?", "chair", ["כיסא", "שולחן", "עט"], "כיסא", [], 2, "abstract"),
        listenChoose(7, 1, 3, "מה שמעתם?", "table", ["שולחן", "כיסא", "תיק"], "שולחן", [], 2, "abstract"),
        listenChoose(7, 1, 4, "מה שמעתם?", "pen", ["עט", "ספר", "שולחן"], "עט", [], 1, "abstract"),
        listenChoose(7, 1, 5, "מה שמעתם?", "bag", ["תיק", "ספר", "כיסא"], "תיק", [], 2, "abstract"),
      ],
    },
    {
      id: "day-7-section-2",
      title: "עוד חפצים",
      type: "verbal",
      learningGoal: "להרחיב את אוצר המילים על הכיתה.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(7, 2, 1, "מה שמעתם?", "bag", ["תיק", "ספר", "עט"], "תיק", [], 1, "abstract"),
        listenChoose(7, 2, 2, "מה שמעתם?", "table", ["שולחן", "כיסא", "ספר"], "שולחן", [], 2, "abstract"),
        listenChoose(7, 2, 3, "מה שמעתם?", "book", ["ספר", "תיק", "כיסא"], "ספר", [], 1, "abstract"),
        listenChoose(7, 2, 4, "מה שמעתם?", "chair", ["כיסא", "שולחן", "תיק"], "כיסא", [], 2, "abstract"),
        listenChoose(7, 2, 5, "מה שמעתם?", "pen", ["עט", "ספר", "תיק"], "עט", [], 2, "abstract"),
      ],
    },
    {
      id: "day-7-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על חפצי הכיתה מהיום.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(7, 3, 1, "מה שמעתם?", "chair", ["כיסא", "שולחן", "תיק"], "כיסא", [], 1, "abstract"),
        listenChoose(7, 3, 2, "מה שמעתם?", "pen", ["עט", "ספר", "תיק"], "עט", [], 2, "abstract"),
        listenChoose(7, 3, 3, "מה שמעתם?", "book", ["ספר", "עט", "כיסא"], "ספר", [], 1, "abstract"),
        listenChoose(7, 3, 4, "מה שמעתם?", "table", ["שולחן", "כיסא", "תיק"], "שולחן", [], 2, "abstract"),
        listenChoose(7, 3, 5, "מה שמעתם?", "bag", ["תיק", "ספר", "עט"], "תיק", [], 2, "abstract"),
        matchPairs(
          7,
          3,
          6,
          "התאימו כל מילה לפירוש:",
          [
            { left: "book", right: "ספר" },
            { left: "pen", right: "עט" },
            { left: "chair", right: "כיסא" },
          ],
          [],
          2,
          "abstract",
          { leftLang: "en", rightLang: "he", audioByLeft: { book: "book", pen: "pen", chair: "chair" } },
        ),
      ],
    },
  ],
};
