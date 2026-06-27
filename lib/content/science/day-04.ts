import { matchPairs, multipleChoice, trueFalse } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/**
 * Science Day 4 — "מֶזֶג הָאֲוִיר וְעוֹנוֹת הַשָּׁנָה" (weather & seasons), Level א׳.
 *
 * 100% Hebrew with niqqud; only `multipleChoice` / `trueFalse` / `matchPairs`,
 * and every `matchPairs` keeps both sides Hebrew (`leftLang: "he", rightLang: "he"`).
 *
 * Curriculum anchor: Israeli MoE "כדור הארץ והיקום" (weather & seasons), aligned
 * with NGSS K-ESS2 / Germany Sachunterricht "Wetter und Jahreszeiten".
 */
export const scienceDay04: WorkbookDay = {
  id: "day-4",
  dayNumber: 4,
  title: "שִׁעוּר 4: מֶזֶג הָאֲוִיר וְעוֹנוֹת הַשָּׁנָה",
  week: 1,
  objective: "לְהַכִּיר אֶת מַצְבֵי מֶזֶג הָאֲוִיר וְאֶת אַרְבַּע עוֹנוֹת הַשָּׁנָה.",
  teachingSummary:
    "הַיּוֹם נִלְמַד עַל מֶזֶג הָאֲוִיר: לִפְעָמִים שִׁמְשִׁי, לִפְעָמִים גָּשׁוּם וְלִפְעָמִים מְעֻנָּן. וְנַכִּיר אֶת אַרְבַּע הָעוֹנוֹת: סְתָו, חֹרֶף, אָבִיב וְקַיִץ.",
  teachingSteps: [
    "מִסְתַּכְּלִים הַחוּצָה וְחוֹשְׁבִים אֵיךְ מֶזֶג הָאֲוִיר.",
    "בּוֹחֲרִים אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
    "בַּסּוֹף מַתְאִימִים כָּל עוֹנָה לְמָה שֶׁמַּתְאִים לָהּ.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-4-section-0",
      title: "חִימּוּם: מֶזֶג הָאֲוִיר",
      type: "warmup",
      learningGoal: "לְזַהוֹת מַצְבֵי מֶזֶג אֲוִיר שׁוֹנִים.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(4, 0, 1, "אֵיךְ קוֹרְאִים לְיוֹם שֶׁבּוֹ יוֹרֵד גֶּשֶׁם? 🌧️", ["יוֹם גָּשׁוּם", "יוֹם שִׁמְשִׁי", "יוֹם יָבֵשׁ"], "יוֹם גָּשׁוּם", [], 1, "concrete"),
        multipleChoice(4, 0, 2, "מָה רוֹאִים בַּשָּׁמַיִם בְּיוֹם שִׁמְשִׁי? ☀️", ["שֶׁמֶשׁ", "שֶׁלֶג", "כּוֹכָבִים"], "שֶׁמֶשׁ", [], 1, "concrete"),
        multipleChoice(4, 0, 3, "מָה מְכַסֶּה אֶת הַשָּׁמַיִם בְּיוֹם מְעֻנָּן? ☁️", ["עֲנָנִים", "פְּרָחִים", "אֲבָנִים"], "עֲנָנִים", [], 1, "concrete"),
        multipleChoice(4, 0, 4, "מָה לוֹבְשִׁים כְּשֶׁקַּר וְיוֹרֵד גֶּשֶׁם? 🧥", ["מְעִיל", "בֶּגֶד יָם", "כְּפָפוֹת שְׂחִיָּה"], "מְעִיל", [], 1, "concrete"),
      ],
    },
    {
      id: "day-4-section-1",
      title: "אַרְבַּע הָעוֹנוֹת",
      type: "verbal",
      learningGoal: "לְהַכִּיר אֶת אַרְבַּע עוֹנוֹת הַשָּׁנָה וְאֶת מָה שֶׁמְּאַפְיֵן אוֹתָן.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(4, 1, 1, "בְּאֵיזוֹ עוֹנָה הֲכִי חַם וְהוֹלְכִים לַיָּם? 🏖️", ["קַיִץ", "חֹרֶף", "סְתָו"], "קַיִץ", [], 1, "abstract"),
        multipleChoice(4, 1, 2, "בְּאֵיזוֹ עוֹנָה יוֹרֵד הֲכִי הַרְבֵּה גֶּשֶׁם בְּיִשְׂרָאֵל? 🌧️", ["חֹרֶף", "קַיִץ", "אָבִיב"], "חֹרֶף", [], 2, "abstract"),
        multipleChoice(4, 1, 3, "בְּאֵיזוֹ עוֹנָה פּוֹרְחִים הַרְבֵּה פְּרָחִים? 🌷", ["אָבִיב", "חֹרֶף", "סְתָו"], "אָבִיב", [], 2, "abstract"),
        trueFalse(4, 1, 4, "הַאִם בַּקַּיִץ בְּדֶרֶךְ כְּלָל חַם?", true, [], 1, "abstract"),
        trueFalse(4, 1, 5, "הַאִם בַּחֹרֶף בְּדֶרֶךְ כְּלָל חַם מְאוֹד וְיָבֵשׁ?", false, [], 2, "abstract"),
      ],
    },
    {
      id: "day-4-section-2",
      title: "חֲזָרָה",
      type: "review",
      learningGoal: "לַחֲזוֹר עַל מֶזֶג הָאֲוִיר וְעוֹנוֹת הַשָּׁנָה.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(4, 2, 1, "מָה לוֹבְשִׁים בְּיוֹם חַם בַּקַּיִץ? 👕", ["בְּגָדִים קַלִּים", "מְעִיל עָבֶה", "כְּפָפוֹת"], "בְּגָדִים קַלִּים", [], 1, "abstract"),
        trueFalse(4, 2, 2, "הַאִם בְּיוֹם גָּשׁוּם כְּדַאי לָקַחַת מִטְרִיָּה? ☂️", true, [], 1, "abstract"),
        multipleChoice(4, 2, 3, "כַּמָּה עוֹנוֹת יֵשׁ בַּשָּׁנָה?", ["אַרְבַּע", "שְׁתַּיִם", "עֶשֶׂר"], "אַרְבַּע", [], 2, "abstract"),
        trueFalse(4, 2, 4, "הַאִם שֶׁלֶג יוֹרֵד בְּדֶרֶךְ כְּלָל בַּקַּיִץ?", false, [], 2, "abstract"),
        multipleChoice(4, 2, 5, "בְּאֵיזוֹ עוֹנָה הָעֵצִים מַשִּׁירִים עָלִים? 🍂", ["סְתָו", "קַיִץ", "אָבִיב"], "סְתָו", [], 2, "abstract"),
        matchPairs(
          4,
          2,
          6,
          "הַתְאִימוּ כָּל עוֹנָה לְמָה שֶׁמַּתְאִים לָהּ:",
          [
            { left: "קַיִץ", right: "חַם וְיָם" },
            { left: "חֹרֶף", right: "קַר וְגֶשֶׁם" },
            { left: "אָבִיב", right: "פְּרָחִים" },
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
