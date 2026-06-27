import { listenChoose, matchPairs } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 3 — "Family" (Pre-A1, listening-first). */
export const englishDay03: WorkbookDay = {
  id: "day-3",
  dayNumber: 3,
  title: "שיעור 3: משפחה",
  week: 1,
  objective: "להכיר מילים על בני המשפחה באנגלית דרך הקשבה.",
  teachingSummary: "היום נלמד לומר מי נמצא במשפחה באנגלית. קודם מקשיבים ואז בוחרים.",
  teachingSteps: ["מקשיבים למילה 🔊", "בוחרים את התשובה הנכונה", "מתאימים ומרכיבים מילים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-3-section-0",
      title: "חימום: אמא ואבא",
      type: "warmup",
      learningGoal: "לזהות בני משפחה בסיסיים.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(3, 0, 1, "מה שמעתם?", "mother", ["אמא", "אבא", "אח"], "אמא", [], 1, "abstract"),
        listenChoose(3, 0, 2, "מה שמעתם?", "father", ["אבא", "אמא", "אחות"], "אבא", [], 1, "abstract"),
        listenChoose(3, 0, 3, "מה שמעתם?", "baby", ["תינוק", "אבא", "אמא"], "תינוק", [], 2, "abstract"),
        listenChoose(3, 0, 4, "מה שמעתם?", "brother", ["אח", "אחות", "אמא"], "אח", [], 2, "abstract"),
      ],
    },
    {
      id: "day-3-section-1",
      title: "בני המשפחה",
      type: "verbal",
      learningGoal: "לקשר בין מילה באנגלית לפירוש בעברית.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(3, 1, 1, "מה שמעתם?", "baby", ["תינוק", "אחות", "אמא"], "תינוק", [], 2, "abstract"),
        listenChoose(3, 1, 2, "מה שמעתם?", "mother", ["אמא", "אבא", "אח"], "אמא", [], 1, "abstract"),
        listenChoose(3, 1, 3, "מה שמעתם?", "sister", ["אחות", "אח", "תינוק"], "אחות", [], 2, "abstract"),
        listenChoose(3, 1, 4, "מה שמעתם?", "father", ["אבא", "אח", "אמא"], "אבא", [], 1, "abstract"),
        listenChoose(3, 1, 5, "מה שמעתם?", "brother", ["אח", "אחות", "אבא"], "אח", [], 2, "abstract"),
      ],
    },
    {
      id: "day-3-section-2",
      title: "עוד מילים",
      type: "verbal",
      learningGoal: "להרחיב את אוצר המילים על המשפחה.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(3, 2, 1, "מה שמעתם?", "brother", ["אח", "אחות", "אבא"], "אח", [], 2, "abstract"),
        listenChoose(3, 2, 2, "מה שמעתם?", "sister", ["אחות", "אח", "אמא"], "אחות", [], 2, "abstract"),
        listenChoose(3, 2, 3, "מה שמעתם?", "baby", ["תינוק", "אמא", "אבא"], "תינוק", [], 2, "abstract"),
        listenChoose(3, 2, 4, "מה שמעתם?", "dad", ["אבא", "אמא", "אח"], "אבא", [], 2, "abstract"),
        listenChoose(3, 2, 5, "מה שמעתם?", "mother", ["אמא", "אבא", "תינוק"], "אמא", [], 2, "abstract"),
      ],
    },
    {
      id: "day-3-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על מילות המשפחה מהיום.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(3, 3, 1, "מה שמעתם?", "mother", ["אמא", "אחות", "אח"], "אמא", [], 1, "abstract"),
        listenChoose(3, 3, 2, "מה שמעתם?", "baby", ["תינוק", "אח", "אבא"], "תינוק", [], 2, "abstract"),
        listenChoose(3, 3, 3, "מה שמעתם?", "sister", ["אחות", "אמא", "אח"], "אחות", [], 1, "abstract"),
        listenChoose(3, 3, 4, "מה שמעתם?", "father", ["אבא", "אמא", "אחות"], "אבא", [], 2, "abstract"),
        listenChoose(3, 3, 5, "מה שמעתם?", "brother", ["אח", "אחות", "אבא"], "אח", [], 2, "abstract"),
        matchPairs(
          3,
          3,
          6,
          "התאימו כל מילה לפירוש:",
          [
            { left: "mother", right: "אמא" },
            { left: "father", right: "אבא" },
            { left: "sister", right: "אחות" },
          ],
          [],
          2,
          "abstract",
          {
            leftLang: "en",
            rightLang: "he",
            audioByLeft: { mother: "mother", father: "father", sister: "sister" },
          },
        ),
      ],
    },
  ],
};
