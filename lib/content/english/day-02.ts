import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
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
        multipleChoice(2, 1, 1, "איך אומרים 5 באנגלית?", ["five", "four", "nine"], "five", [], 2, "abstract"),
        multipleChoice(2, 1, 2, "איך אומרים 3 באנגלית?", ["three", "two", "ten"], "three", [], 1, "abstract"),
        listenChoose(2, 1, 3, "מה שמעתם?", "five", ["5", "4", "6"], "5", [], 2, "abstract"),
        listenChoose(2, 1, 4, "מה שמעתם?", "two", ["2", "8", "3"], "2", [], 1, "abstract"),
        letterTiles(2, 1, 5, "הרכיבו את המספר ששמעתם:", "one", [], 2, "abstract", "one"),
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
        multipleChoice(2, 2, 3, "איך אומרים 8 באנגלית?", ["eight", "nine", "six"], "eight", [], 2, "abstract"),
        listenChoose(2, 2, 4, "מה שמעתם?", "six", ["6", "7", "9"], "6", [], 2, "abstract"),
        letterTiles(2, 2, 5, "הרכיבו את המספר ששמעתם:", "ten", [], 2, "abstract", "ten"),
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
        multipleChoice(2, 3, 2, "איך אומרים 4 באנגלית?", ["four", "five", "two"], "four", [], 2, "abstract"),
        trueFalse(2, 3, 3, "האם 'three' פירושו 3?", true, [], 1, "abstract"),
        trueFalse(2, 3, 4, "האם 'ten' פירושו 2?", false, [], 2, "abstract"),
        letterTiles(2, 3, 5, "הרכיבו את המספר ששמעתם:", "two", [], 2, "abstract", "two"),
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
          { leftLang: "en", rightLang: "en" },
        ),
      ],
    },
  ],
};
