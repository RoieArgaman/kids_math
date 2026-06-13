import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 6 — "My Body" (Pre-A1, listening-first). */
export const englishDay06: WorkbookDay = {
  id: "day-6",
  dayNumber: 6,
  title: "שיעור 6: הגוף",
  week: 2,
  objective: "להכיר מילים על חלקי הגוף באנגלית דרך הקשבה.",
  teachingSummary: "היום נלמד מילים על הגוף שלנו באנגלית. קודם מקשיבים ואז בוחרים.",
  teachingSteps: ["מקשיבים למילה 🔊", "בוחרים את התשובה", "מתאימים ומרכיבים מילים"],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-6-section-0",
      title: "חימום: יד וראש",
      type: "warmup",
      learningGoal: "לזהות חלקי גוף בסיסיים.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(6, 0, 1, "מה שמעתם?", "hand", ["יד", "ראש", "עין"], "יד", [], 1, "abstract"),
        listenChoose(6, 0, 2, "מה שמעתם?", "head", ["ראש", "יד", "רגל"], "ראש", [], 1, "abstract"),
        listenChoose(6, 0, 3, "מה שמעתם?", "eye", ["עין", "אוזן", "יד"], "עין", [], 2, "abstract"),
        listenChoose(6, 0, 4, "מה שמעתם?", "leg", ["רגל", "ראש", "עין"], "רגל", [], 2, "abstract"),
      ],
    },
    {
      id: "day-6-section-1",
      title: "חלקי הגוף",
      type: "verbal",
      learningGoal: "לקשר בין חלק גוף באנגלית לפירוש.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(6, 1, 1, "איך אומרים 'יד' באנגלית?", ["hand", "head", "leg"], "hand", [], 1, "abstract"),
        multipleChoice(6, 1, 2, "איך אומרים 'עין' באנגלית?", ["eye", "ear", "leg"], "eye", [], 2, "abstract"),
        listenChoose(6, 1, 3, "מה שמעתם?", "ear", ["אוזן", "עין", "יד"], "אוזן", [], 2, "abstract"),
        listenChoose(6, 1, 4, "מה שמעתם?", "head", ["ראש", "רגל", "עין"], "ראש", [], 1, "abstract"),
        letterTiles(6, 1, 5, "הרכיבו את המילה ששמעתם:", "ear", [], 2, "abstract", "ear"),
      ],
    },
    {
      id: "day-6-section-2",
      title: "עוד חלקי גוף",
      type: "verbal",
      learningGoal: "להרחיב את אוצר המילים על הגוף.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(6, 2, 1, "מה שמעתם?", "leg", ["רגל", "יד", "אוזן"], "רגל", [], 1, "abstract"),
        multipleChoice(6, 2, 2, "איך אומרים 'ראש' באנגלית?", ["head", "hand", "eye"], "head", [], 2, "abstract"),
        listenChoose(6, 2, 3, "מה שמעתם?", "hand", ["יד", "רגל", "אוזן"], "יד", [], 1, "abstract"),
        multipleChoice(6, 2, 4, "איך אומרים 'אוזן' באנגלית?", ["ear", "eye", "leg"], "ear", [], 2, "abstract"),
        letterTiles(6, 2, 5, "הרכיבו את המילה ששמעתם:", "leg", [], 2, "abstract", "leg"),
      ],
    },
    {
      id: "day-6-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על חלקי הגוף מהיום.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(6, 3, 1, "מה שמעתם?", "eye", ["עין", "אוזן", "ראש"], "עין", [], 1, "abstract"),
        multipleChoice(6, 3, 2, "איך אומרים 'רגל' באנגלית?", ["leg", "hand", "head"], "leg", [], 2, "abstract"),
        trueFalse(6, 3, 3, "האם 'hand' פירושו 'יד'?", true, [], 1, "abstract"),
        trueFalse(6, 3, 4, "האם 'head' פירושו 'עין'?", false, [], 2, "abstract"),
        letterTiles(6, 3, 5, "הרכיבו את המילה ששמעתם:", "eye", [], 2, "abstract", "eye"),
        matchPairs(
          6,
          3,
          6,
          "התאימו כל מילה לפירוש:",
          [
            { left: "hand", right: "יד" },
            { left: "head", right: "ראש" },
            { left: "eye", right: "עין" },
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
