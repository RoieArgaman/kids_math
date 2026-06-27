import { listenChoose, matchPairs } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/** English Day 2 — "Numbers 1–10" (Pre-A1, listening-first). */
export const englishDay02: WorkbookDay = {
  id: "day-2",
  dayNumber: 2,
  title: "שיעור 2: מספרים",
  week: 1,
  objective: "לזהות ולומר מספרים מ-1 עד 10 באנגלית דרך הקשבה.",
  teachingSummary: "היום נלמד לספור באנגלית. קודם מקשיבים למספר ואז בוחרים את התשובה.",
  teachingSteps: [
    "לוחצים על הרמקול 🔊 ומקשיבים למספר.",
    "בוחרים את המספר המתאים.",
    "בסוף מרכיבים ומתאימים מספרים.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-2-section-0",
      title: "חימום: 1, 2, 3",
      type: "warmup",
      learningGoal: "לזהות את המספרים הראשונים באנגלית.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(2, 0, 1, "מה שמעתם?", "one", ["1", "2", "3"], "1", [], 1, "abstract"),
        listenChoose(2, 0, 2, "מה שמעתם?", "two", ["2", "1", "3"], "2", [], 1, "abstract"),
        listenChoose(2, 0, 3, "מה שמעתם?", "three", ["3", "2", "1"], "3", [], 1, "abstract"),
        listenChoose(2, 0, 4, "מה שמעתם?", "four", ["4", "3", "5"], "4", [], 2, "abstract"),
      ],
    },
    {
      id: "day-2-section-1",
      title: "מספרים 1–5",
      type: "verbal",
      learningGoal: "לקשר בין מספר לשם שלו באנגלית.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(2, 1, 1, "מה שמעתם?", "four", ["4", "5", "3"], "4", [], 2, "abstract"),
        listenChoose(2, 1, 2, "מה שמעתם?", "three", ["3", "2", "10"], "3", [], 1, "abstract"),
        listenChoose(2, 1, 3, "מה שמעתם?", "five", ["5", "4", "6"], "5", [], 2, "abstract"),
        listenChoose(2, 1, 4, "מה שמעתם?", "two", ["2", "8", "3"], "2", [], 1, "abstract"),
        listenChoose(2, 1, 5, "מה שמעתם?", "one", ["1", "2", "3"], "1", [], 2, "abstract"),
      ],
    },
    {
      id: "day-2-section-2",
      title: "מספרים 6–10",
      type: "verbal",
      learningGoal: "להכיר מספרים גבוהים יותר באנגלית.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(2, 2, 1, "מה שמעתם?", "seven", ["7", "6", "8"], "7", [], 2, "abstract"),
        listenChoose(2, 2, 2, "מה שמעתם?", "ten", ["10", "9", "1"], "10", [], 2, "abstract"),
        listenChoose(2, 2, 3, "מה שמעתם?", "eight", ["8", "9", "6"], "8", [], 2, "abstract"),
        listenChoose(2, 2, 4, "מה שמעתם?", "six", ["6", "7", "9"], "6", [], 2, "abstract"),
        listenChoose(2, 2, 5, "מה שמעתם?", "nine", ["9", "8", "10"], "9", [], 2, "abstract"),
      ],
    },
    {
      id: "day-2-section-3",
      title: "חזרה",
      type: "review",
      learningGoal: "לחזור על המספרים מהיום.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(2, 3, 1, "מה שמעתם?", "nine", ["9", "5", "7"], "9", [], 2, "abstract"),
        listenChoose(2, 3, 2, "מה שמעתם?", "four", ["4", "5", "2"], "4", [], 2, "abstract"),
        listenChoose(2, 3, 3, "מה שמעתם?", "three", ["3", "2", "4"], "3", [], 1, "abstract"),
        listenChoose(2, 3, 4, "מה שמעתם?", "ten", ["10", "2", "9"], "10", [], 2, "abstract"),
        listenChoose(2, 3, 5, "מה שמעתם?", "two", ["2", "1", "3"], "2", [], 2, "abstract"),
        matchPairs(
          2,
          3,
          6,
          "התאימו כל מספר באנגלית לספרה:",
          [
            { left: "one", right: "1" },
            { left: "five", right: "5" },
            { left: "ten", right: "10" },
          ],
          [],
          2,
          "abstract",
          {
            leftLang: "en",
            rightLang: "en",
            audioByLeft: { one: "one", five: "five", ten: "ten" },
          },
        ),
      ],
    },
  ],
};
