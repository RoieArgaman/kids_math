import {
  letterTiles,
  listenChoose,
  matchPairs,
  multipleChoice,
  trueFalse,
} from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/**
 * English Day 1 — "Greetings & Colors" (Pre-A1, listening-first).
 *
 * Pedagogy (see plan research): oral/aural before reading, comprehensible input
 * with repeated multi-context exposure, tap-only answers (no free text). Each
 * vocabulary item is heard (TTS English) before the learner chooses or builds it.
 */
export const englishDay01: WorkbookDay = {
  id: "day-1",
  dayNumber: 1,
  title: "שִׁעוּר 1: שָׁלוֹם וּצְבָעִים",
  week: 1,
  objective: "לְהַכִּיר בְּרָכוֹת בְּסִיסִיּוֹת וּצְבָעִים בְּאַנְגְּלִית דֶּרֶךְ הַקְשָׁבָה.",
  teachingSummary:
    "הַיּוֹם נִלְמַד לוֹמַר שָׁלוֹם וְלִשְׁמֹעַ אֶת שְׁמוֹת הַצְּבָעִים בְּאַנְגְּלִית. קֹדֶם מַקְשִׁיבִים — אַחַר כָּךְ בּוֹחֲרִים.",
  teachingSteps: [
    "לוֹחֲצִים עַל הָרַמְקוֹל 🔊 וּמַקְשִׁיבִים לַמִּלָּה.",
    "בּוֹחֲרִים אֶת הַתְּשׁוּבָה שֶׁמַּתְאִימָה.",
    "בַּסּוֹף מַרְכִּיבִים מִילָּה מֵאוֹתִיּוֹת.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-1-section-0",
      title: "חִימּוּם: מִילִּים רִאשׁוֹנוֹת",
      type: "warmup",
      learningGoal: "לְזַהוֹת מִילִּים בְּסִיסִיּוֹת לְפִי הַקְשָׁבָה.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(1, 0, 1, "מָה שָׁמַעְתֶּם?", "hello", ["שָׁלוֹם", "תּוֹדָה", "כֵּן"], "שָׁלוֹם", [], 1, "abstract"),
        listenChoose(1, 0, 2, "מָה שָׁמַעְתֶּם?", "yes", ["כֵּן", "לֹא", "שָׁלוֹם"], "כֵּן", [], 1, "abstract"),
        listenChoose(1, 0, 3, "מָה שָׁמַעְתֶּם?", "no", ["לֹא", "כֵּן", "תּוֹדָה"], "לֹא", [], 1, "abstract"),
        listenChoose(1, 0, 4, "מָה שָׁמַעְתֶּם?", "bye", ["לְהִתְרָאוֹת", "שָׁלוֹם", "כֵּן"], "לְהִתְרָאוֹת", [], 1, "abstract"),
      ],
    },
    {
      id: "day-1-section-1",
      title: "בְּרָכוֹת",
      type: "verbal",
      learningGoal: "לְהַכִּיר בְּרָכוֹת נְפוֹצוֹת בְּאַנְגְּלִית.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(1, 1, 1, "מָה שָׁמַעְתֶּם?", "hello", ["שָׁלוֹם", "לֹא", "אָדוֹם"], "שָׁלוֹם", [], 1, "abstract"),
        listenChoose(1, 1, 2, "מָה שָׁמַעְתֶּם?", "thank you", ["תּוֹדָה", "שָׁלוֹם", "כֵּן"], "תּוֹדָה", [], 2, "abstract"),
        listenChoose(1, 1, 3, "מָה שָׁמַעְתֶּם?", "goodbye", ["לְהִתְרָאוֹת", "תּוֹדָה", "כֵּן"], "לְהִתְרָאוֹת", [], 2, "abstract"),
        multipleChoice(1, 1, 4, "אֵיךְ אוֹמְרִים 'תּוֹדָה' בְּאַנְגְּלִית?", ["thank you", "hello", "goodbye"], "thank you", [], 2, "abstract"),
        multipleChoice(1, 1, 5, "אֵיךְ אוֹמְרִים 'שָׁלוֹם' בְּאַנְגְּלִית?", ["hello", "yes", "red"], "hello", [], 1, "abstract"),
      ],
    },
    {
      id: "day-1-section-2",
      title: "צְבָעִים",
      type: "verbal",
      learningGoal: "לְזַהוֹת וּלְהַרְכִּיב שְׁמוֹת צְבָעִים בְּאַנְגְּלִית.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(1, 2, 1, "מָה שָׁמַעְתֶּם?", "red", ["אָדוֹם", "כָּחוֹל", "יָרוֹק"], "אָדוֹם", [], 1, "abstract"),
        listenChoose(1, 2, 2, "מָה שָׁמַעְתֶּם?", "blue", ["כָּחוֹל", "אָדוֹם", "צָהוֹב"], "כָּחוֹל", [], 1, "abstract"),
        listenChoose(1, 2, 3, "מָה שָׁמַעְתֶּם?", "green", ["יָרוֹק", "כָּחוֹל", "אָדוֹם"], "יָרוֹק", [], 2, "abstract"),
        listenChoose(1, 2, 4, "מָה שָׁמַעְתֶּם?", "yellow", ["צָהוֹב", "יָרוֹק", "כָּחוֹל"], "צָהוֹב", [], 2, "abstract"),
        letterTiles(1, 2, 5, "הַרְכִּיבוּ אֶת הַמִּילָּה שֶׁשְּׁמַעְתֶּם:", "red", [], 2, "abstract", "red"),
      ],
    },
    {
      id: "day-1-section-3",
      title: "חֲזָרָה",
      type: "review",
      learningGoal: "לַחֲזוֹר עַל הַבְּרָכוֹת וְהַצְּבָעִים מֵהַיּוֹם.",
      prerequisiteSkillTags: [],
      exercises: [
        listenChoose(1, 3, 1, "מָה שָׁמַעְתֶּם?", "hello", ["שָׁלוֹם", "לְהִתְרָאוֹת", "אָדוֹם"], "שָׁלוֹם", [], 1, "abstract"),
        listenChoose(1, 3, 2, "מָה שָׁמַעְתֶּם?", "blue", ["כָּחוֹל", "יָרוֹק", "צָהוֹב"], "כָּחוֹל", [], 2, "abstract"),
        multipleChoice(1, 3, 3, "אֵיךְ אוֹמְרִים 'יָרוֹק' בְּאַנְגְּלִית?", ["green", "blue", "red"], "green", [], 2, "abstract"),
        trueFalse(1, 3, 4, "הַאִם 'thank you' פֵּירוּשׁוֹ 'תּוֹדָה'?", true, [], 1, "abstract"),
        trueFalse(1, 3, 5, "הַאִם 'red' פֵּירוּשׁוֹ 'כָּחוֹל'?", false, [], 2, "abstract"),
        letterTiles(1, 3, 6, "הַרְכִּיבוּ אֶת הַמִּילָּה שֶׁשְּׁמַעְתֶּם:", "blue", [], 2, "abstract", "blue"),
        matchPairs(
          1,
          3,
          7,
          "הַתְאִימוּ כָּל מִילָּה בְּאַנְגְּלִית לַפֵּירוּשׁ בְּעִבְרִית:",
          [
            { left: "red", right: "אָדוֹם" },
            { left: "blue", right: "כָּחוֹל" },
            { left: "hello", right: "שָׁלוֹם" },
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
