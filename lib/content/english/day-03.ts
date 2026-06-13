import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
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
        multipleChoice(3, 1, 1, "איך אומרים 'אחות' באנגלית?", ["sister", "brother", "mother"], "sister", [], 2, "abstract"),
        multipleChoice(3, 1, 2, "איך אומרים 'אמא' באנגלית?", ["mother", "father", "baby"], "mother", [], 1, "abstract"),
        listenChoose(3, 1, 3, "מה שמעתם?", "sister", ["אחות", "אח", "תינוק"], "אחות", [], 2, "abstract"),
        listenChoose(3, 1, 4, "מה שמעתם?", "father", ["אבא", "אח", "אמא"], "אבא", [], 1, "abstract"),
        letterTiles(3, 1, 5, "הרכיבו את המילה ששמעתם:", "mom", [], 2, "abstract", "mom"),
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
        multipleChoice(3, 2, 2, "איך אומרים 'אח' באנגלית?", ["brother", "sister", "baby"], "brother", [], 2, "abstract"),
        listenChoose(3, 2, 3, "מה שמעתם?", "baby", ["תינוק", "אמא", "אבא"], "תינוק", [], 2, "abstract"),
        multipleChoice(3, 2, 4, "איך אומרים 'אבא' באנגלית?", ["dad", "mom", "sister"], "dad", [], 2, "abstract"),
        letterTiles(3, 2, 5, "הרכיבו את המילה ששמעתם:", "dad", [], 2, "abstract", "dad"),
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
        multipleChoice(3, 3, 2, "איך אומרים 'תינוק' באנגלית?", ["baby", "brother", "father"], "baby", [], 2, "abstract"),
        trueFalse(3, 3, 3, "האם 'sister' פירושו 'אחות'?", true, [], 1, "abstract"),
        trueFalse(3, 3, 4, "האם 'father' פירושו 'אמא'?", false, [], 2, "abstract"),
        letterTiles(3, 3, 5, "הרכיבו את המילה ששמעתם:", "mom", [], 2, "abstract", "mom"),
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
          { leftLang: "en", rightLang: "he" },
        ),
      ],
    },
  ],
};
