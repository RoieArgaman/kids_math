import { listenChoose, matchPairs } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 4 — "Animals" (Pre-A1, listening-first). */
export const englishDay04: WorkbookDay = {
  id: "day-4",
  dayNumber: 4,
  title: "שיעור 4: חיות",
  week: 1,
  objective: "להכיר שמות של חיות נפוצות באנגלית דרך הקשבה.",
  teachingSummary: "היום נלמד שמות של חיות באנגלית. קודם מקשיבים ואז בוחרים.",
  teachingSteps: ["מקשיבים למילה 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים מילים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-4-section-0",
      title: "חימום: כלב וחתול",
      type: "warmup",
      learningGoal: "לזהות חיות בסיסיות.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(4, 0, 1, "מה שמעתם?", "dog", ["כלב", "חתול", "ציפור"], "כלב", [], 1, "abstract"),
        listenChoose(4, 0, 2, "מה שמעתם?", "cat", ["חתול", "כלב", "דג"], "חתול", [], 1, "abstract"),
        listenChoose(4, 0, 3, "מה שמעתם?", "bird", ["ציפור", "חתול", "פרה"], "ציפור", [], 2, "abstract"),
        listenChoose(4, 0, 4, "מה שמעתם?", "fish", ["דג", "כלב", "ציפור"], "דג", [], 2, "abstract"),
      ],
    },
    {
      id: "day-4-section-1",
      title: "חיות בית",
      type: "verbal",
      learningGoal: "לקשר בין שם חיה באנגלית לפירוש.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(4, 1, 1, "מה שמעתם?", "cat", ["חתול", "כלב", "פרה"], "חתול", [], 1, "abstract"),
        listenChoose(4, 1, 2, "מה שמעתם?", "dog", ["כלב", "דג", "ציפור"], "כלב", [], 1, "abstract"),
        listenChoose(4, 1, 3, "מה שמעתם?", "cow", ["פרה", "כלב", "דג"], "פרה", [], 2, "abstract"),
        listenChoose(4, 1, 4, "מה שמעתם?", "bird", ["ציפור", "פרה", "חתול"], "ציפור", [], 2, "abstract"),
        listenChoose(4, 1, 5, "מה שמעתם?", "fish", ["דג", "חתול", "כלב"], "דג", [], 2, "abstract"),
      ],
    },
    {
      id: "day-4-section-2",
      title: "עוד חיות",
      type: "verbal",
      learningGoal: "להרחיב את אוצר המילים על חיות.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(4, 2, 1, "מה שמעתם?", "fish", ["דג", "ציפור", "פרה"], "דג", [], 2, "abstract"),
        listenChoose(4, 2, 2, "מה שמעתם?", "cow", ["פרה", "כלב", "חתול"], "פרה", [], 2, "abstract"),
        listenChoose(4, 2, 3, "מה שמעתם?", "dog", ["כלב", "דג", "ציפור"], "כלב", [], 1, "abstract"),
        listenChoose(4, 2, 4, "מה שמעתם?", "bird", ["ציפור", "פרה", "דג"], "ציפור", [], 2, "abstract"),
        listenChoose(4, 2, 5, "מה שמעתם?", "cat", ["חתול", "כלב", "פרה"], "חתול", [], 2, "abstract"),
      ],
    },
    {
      id: "day-4-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על שמות החיות מהיום.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(4, 3, 1, "מה שמעתם?", "cat", ["חתול", "כלב", "דג"], "חתול", [], 1, "abstract"),
        listenChoose(4, 3, 2, "מה שמעתם?", "fish", ["דג", "ציפור", "פרה"], "דג", [], 2, "abstract"),
        listenChoose(4, 3, 3, "מה שמעתם?", "dog", ["כלב", "חתול", "דג"], "כלב", [], 1, "abstract"),
        listenChoose(4, 3, 4, "מה שמעתם?", "cow", ["פרה", "חתול", "ציפור"], "פרה", [], 2, "abstract"),
        listenChoose(4, 3, 5, "מה שמעתם?", "bird", ["ציפור", "כלב", "דג"], "ציפור", [], 2, "abstract"),
        matchPairs(
          4,
          3,
          6,
          "התאימו כל חיה לפירוש:",
          [
            { left: "dog", right: "כלב" },
            { left: "cat", right: "חתול" },
            { left: "bird", right: "ציפור" },
          ],
          [],
          2,
          "abstract",
          {
            leftLang: "en",
            rightLang: "he",
            audioByLeft: { dog: "dog", cat: "cat", bird: "bird" },
          },
        ),
      ],
    },
  ],
};
