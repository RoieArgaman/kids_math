import { matchPairs, multipleChoice, trueFalse } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/**
 * Science Day 2 — "בַּעֲלֵי חַיִּים וְצָרְכֵיהֶם" (animals & their needs), Level א׳.
 *
 * 100% Hebrew with niqqud; only `multipleChoice` / `trueFalse` / `matchPairs`,
 * and every `matchPairs` keeps both sides Hebrew (`leftLang: "he", rightLang: "he"`).
 *
 * Curriculum anchor: Israeli MoE "מערכות ותהליכים ביצורים חיים" (needs of living
 * things), aligned with NGSS K-LS1 / Singapore "diversity" — concrete & observational.
 */
export const scienceDay02: WorkbookDay = {
  id: "day-2",
  dayNumber: 2,
  title: "שִׁעוּר 2: בַּעֲלֵי חַיִּים וְצָרְכֵיהֶם",
  week: 1,
  objective: "לְהַכִּיר אֶת הַצְּרָכִים שֶׁל בַּעֲלֵי הַחַיִּים: אֹכֶל, מַיִם, אֲוִיר וּמָקוֹם לָגוּר.",
  teachingSummary:
    "הַיּוֹם נִלְמַד שֶׁכָּל בַּעַל חַיִּים צָרִיךְ דְּבָרִים כְּדֵי לִחְיוֹת: לֶאֱכֹל אֹכֶל, לִשְׁתּוֹת מַיִם, לִנְשֹׁם אֲוִיר וְלָגוּר בְּמָקוֹם בָּטוּחַ.",
  teachingSteps: [
    "חוֹשְׁבִים מָה כָּל חַיָּה צְרִיכָה כְּדֵי לִחְיוֹת.",
    "בּוֹחֲרִים אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
    "בַּסּוֹף מַתְאִימִים כָּל חַיָּה לַבַּיִת שֶׁלָּהּ.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-2-section-0",
      title: "חִימּוּם: מָה הַחַיּוֹת צְרִיכוֹת",
      type: "warmup",
      learningGoal: "לְזַהוֹת אֶת הַצְּרָכִים הַבְּסִיסִיִּים שֶׁל בַּעֲלֵי הַחַיִּים.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(2, 0, 1, "מָה שׁוֹתֶה הַכֶּלֶב כְּשֶׁהוּא צָמֵא? 🐕", ["מַיִם", "אֲבָנִים", "חוֹל"], "מַיִם", [], 1, "concrete"),
        multipleChoice(2, 0, 2, "מָה אוֹכֶלֶת הַפָּרָה? 🐄", ["עֵשֶׂב", "בַּרְזֶל", "נְיָר"], "עֵשֶׂב", [], 1, "concrete"),
        multipleChoice(2, 0, 3, "מָה נוֹשֶׁמֶת כָּל חַיָּה כְּדֵי לִחְיוֹת?", ["אֲוִיר", "אֹכֶל", "אֲבָנִים"], "אֲוִיר", [], 1, "concrete"),
        multipleChoice(2, 0, 4, "אֵיפֹה גָּר הַצִּפּוֹר? 🐦", ["בַּקֵּן", "בַּמְּקָרֵר", "בַּתַּנּוּר"], "בַּקֵּן", [], 1, "concrete"),
      ],
    },
    {
      id: "day-2-section-1",
      title: "הַצְּרָכִים שֶׁל בַּעֲלֵי הַחַיִּים",
      type: "verbal",
      learningGoal: "לְהָבִין שֶׁכָּל בַּעַל חַיִּים צָרִיךְ אֹכֶל, מַיִם, אֲוִיר וּמָקוֹם לָגוּר.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(2, 1, 1, "מָה אוֹכֵל הָאַרְנָב? 🐰", ["גֶּזֶר", "פְּלַסְטִיק", "אֲבָנִים"], "גֶּזֶר", [], 1, "abstract"),
        multipleChoice(2, 1, 2, "אֵיפֹה גָּר הַדָּג? 🐟", ["בַּמַּיִם", "בָּעֵץ", "בַּמִּדְבָּר"], "בַּמַּיִם", [], 1, "abstract"),
        multipleChoice(2, 1, 3, "מָה צְרִיכָה כָּל חַיָּה כְּדֵי לִגְדֹּל וּלְהִתְחַזֵּק?", ["אֹכֶל וּמַיִם", "צַעֲצוּעִים", "טֵלֵפוֹן"], "אֹכֶל וּמַיִם", [], 2, "abstract"),
        trueFalse(2, 1, 4, "הַאִם בַּעֲלֵי חַיִּים צְרִיכִים אֲוִיר כְּדֵי לִנְשֹׁם?", true, [], 1, "abstract"),
        trueFalse(2, 1, 5, "הַאִם חַיָּה יְכוֹלָה לִחְיוֹת בְּלִי אֹכֶל וּבְלִי מַיִם?", false, [], 2, "abstract"),
      ],
    },
    {
      id: "day-2-section-2",
      title: "חֲזָרָה",
      type: "review",
      learningGoal: "לַחֲזוֹר עַל הַצְּרָכִים שֶׁל בַּעֲלֵי הַחַיִּים.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(2, 2, 1, "מָה שׁוֹתָה הֶחָתוּל כְּשֶׁהוּא צָמֵא? 🐱", ["מַיִם", "חוֹל", "עָלִים"], "מַיִם", [], 1, "abstract"),
        trueFalse(2, 2, 2, "הַאִם הַצִּפּוֹר גָּרָה בְּקֵן?", true, [], 1, "abstract"),
        multipleChoice(2, 2, 3, "מָה אוֹכֶלֶת הַכִּבְשָׂה? 🐑", ["עֵשֶׂב", "בַּרְזֶל", "זְכוּכִית"], "עֵשֶׂב", [], 1, "abstract"),
        trueFalse(2, 2, 4, "הַאִם הַדָּג יָכוֹל לִחְיוֹת בְּלִי מַיִם?", false, [], 2, "abstract"),
        multipleChoice(2, 2, 5, "מָה צָרִיךְ כָּל בַּעַל חַיִּים כְּדֵי לִחְיוֹת?", ["אֲוִיר", "מַחְשֵׁב", "כֶּסֶף"], "אֲוִיר", [], 2, "abstract"),
        matchPairs(
          2,
          2,
          6,
          "הַתְאִימוּ כָּל חַיָּה לַמָּקוֹם שֶׁבּוֹ הִיא גָּרָה:",
          [
            { left: "דָּג", right: "מַיִם" },
            { left: "צִפּוֹר", right: "קֵן" },
            { left: "כֶּלֶב", right: "מְלוּנָה" },
          ],
          [],
          2,
          "abstract",
          { leftLang: "he", rightLang: "he" },
        ),
      ],
    },
  ],
};
