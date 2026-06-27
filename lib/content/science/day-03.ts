import { matchPairs, multipleChoice, trueFalse } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/**
 * Science Day 3 — "צְמָחִים וְחֶלְקֵיהֶם" (plants & their parts), Level א׳.
 *
 * 100% Hebrew with niqqud; only `multipleChoice` / `trueFalse` / `matchPairs`,
 * and every `matchPairs` keeps both sides Hebrew (`leftLang: "he", rightLang: "he"`).
 *
 * Curriculum anchor: Israeli MoE "מערכות ותהליכים ביצורים חיים" (plant structure),
 * aligned with NGSS 1-LS1 / Singapore "diversity" — concrete & observational.
 */
export const scienceDay03: WorkbookDay = {
  id: "day-3",
  dayNumber: 3,
  title: "שִׁעוּר 3: צְמָחִים וְחֶלְקֵיהֶם",
  week: 1,
  objective: "לְהַכִּיר אֶת חֶלְקֵי הַצֶּמַח: שֹׁרֶשׁ, גִּבְעוֹל, עָלֶה וּפֶרַח.",
  teachingSummary:
    "הַיּוֹם נַכִּיר אֶת חֶלְקֵי הַצֶּמַח: הַשֹּׁרֶשׁ שׁוֹתֶה מַיִם מֵהָאֲדָמָה, הַגִּבְעוֹל מַחְזִיק אֶת הַצֶּמַח, הֶעָלֶה יָרֹק וְהַפֶּרַח יָפֶה וְצִבְעוֹנִי.",
  teachingSteps: [
    "מִסְתַּכְּלִים עַל הַצֶּמַח וּמְזַהִים אֶת הַחֲלָקִים.",
    "בּוֹחֲרִים אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
    "בַּסּוֹף מַתְאִימִים כָּל חֵלֶק לַתַּפְקִיד שֶׁלּוֹ.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-3-section-0",
      title: "חִימּוּם: חֶלְקֵי הַצֶּמַח",
      type: "warmup",
      learningGoal: "לְזַהוֹת אֶת חֶלְקֵי הַצֶּמַח הַשּׁוֹנִים.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(3, 0, 1, "אֵיזֶה חֵלֶק שֶׁל הַצֶּמַח שׁוֹתֶה מַיִם מֵהָאֲדָמָה? 🌱", ["הַשֹּׁרֶשׁ", "הַפֶּרַח", "הֶעָלֶה"], "הַשֹּׁרֶשׁ", [], 1, "concrete"),
        multipleChoice(3, 0, 2, "אֵיזֶה חֵלֶק שֶׁל הַצֶּמַח צִבְעוֹנִי וְיָפֶה? 🌸", ["הַפֶּרַח", "הַשֹּׁרֶשׁ", "הַגִּבְעוֹל"], "הַפֶּרַח", [], 1, "concrete"),
        multipleChoice(3, 0, 3, "מָה הַצֶּבַע שֶׁל רֹב הֶעָלִים? 🍃", ["יָרֹק", "כָּחֹל", "שָׁחֹר"], "יָרֹק", [], 1, "concrete"),
        multipleChoice(3, 0, 4, "אֵיזֶה חֵלֶק מַחְזִיק אֶת הַצֶּמַח זָקוּף?", ["הַגִּבְעוֹל", "הַפֶּרַח", "הַשֹּׁרֶשׁ"], "הַגִּבְעוֹל", [], 1, "concrete"),
      ],
    },
    {
      id: "day-3-section-1",
      title: "מָה עוֹשֶׂה כָּל חֵלֶק",
      type: "verbal",
      learningGoal: "לְהָבִין אֶת הַתַּפְקִיד שֶׁל כָּל חֵלֶק בַּצֶּמַח.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(3, 1, 1, "מָה צָרִיךְ הַצֶּמַח כְּדֵי לִגְדֹּל? ☀️💧", ["מַיִם וְשֶׁמֶשׁ", "סֻכָּר וּמֶלַח", "אֲבָנִים"], "מַיִם וְשֶׁמֶשׁ", [], 2, "abstract"),
        multipleChoice(3, 1, 2, "אֵיפֹה נִמְצָא הַשֹּׁרֶשׁ שֶׁל הַצֶּמַח?", ["בְּתוֹךְ הָאֲדָמָה", "עַל הַפֶּרַח", "בָּעֲנָנִים"], "בְּתוֹךְ הָאֲדָמָה", [], 2, "abstract"),
        multipleChoice(3, 1, 3, "מֵאֵיזֶה חֵלֶק שֶׁל הַצֶּמַח מַגִּיעַ לִפְעָמִים פְּרִי? 🍎", ["הַפֶּרַח", "הַשֹּׁרֶשׁ", "הֶעָלֶה"], "הַפֶּרַח", [], 2, "abstract"),
        trueFalse(3, 1, 4, "הַאִם הֶעָלִים שֶׁל רֹב הַצְּמָחִים יְרֻקִּים?", true, [], 1, "abstract"),
        trueFalse(3, 1, 5, "הַאִם הַצֶּמַח יָכוֹל לִגְדֹּל בְּלִי מַיִם בִּכְלָל?", false, [], 2, "abstract"),
      ],
    },
    {
      id: "day-3-section-2",
      title: "חֲזָרָה",
      type: "review",
      learningGoal: "לַחֲזוֹר עַל חֶלְקֵי הַצֶּמַח וְהַתַּפְקִידִים שֶׁלָּהֶם.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(3, 2, 1, "אֵיזֶה חֵלֶק שֶׁל הַצֶּמַח קוֹלֵט מַיִם מֵהָאֲדָמָה?", ["הַשֹּׁרֶשׁ", "הַפֶּרַח", "הֶעָלֶה"], "הַשֹּׁרֶשׁ", [], 1, "abstract"),
        trueFalse(3, 2, 2, "הַאִם הַפֶּרַח הוּא חֵלֶק שֶׁל הַצֶּמַח?", true, [], 1, "abstract"),
        multipleChoice(3, 2, 3, "מָה נוֹתֶנֶת הַשֶּׁמֶשׁ לַצֶּמַח? ☀️", ["אוֹר", "אֲבָנִים", "פְּלַסְטִיק"], "אוֹר", [], 2, "abstract"),
        trueFalse(3, 2, 4, "הַאִם הַשֹּׁרֶשׁ גָּדֵל לְמַעְלָה לְעֵבֶר הַשָּׁמַיִם?", false, [], 2, "abstract"),
        multipleChoice(3, 2, 5, "אֵיזֶה חֵלֶק מַחְזִיק אֶת הֶעָלִים וְאֶת הַפֶּרַח?", ["הַגִּבְעוֹל", "הַשֹּׁרֶשׁ", "הָאֲדָמָה"], "הַגִּבְעוֹל", [], 2, "abstract"),
        matchPairs(
          3,
          2,
          6,
          "הַתְאִימוּ כָּל חֵלֶק שֶׁל הַצֶּמַח לַתַּפְקִיד שֶׁלּוֹ:",
          [
            { left: "שֹׁרֶשׁ", right: "שׁוֹתֶה מַיִם" },
            { left: "גִּבְעוֹל", right: "מַחְזִיק אֶת הַצֶּמַח" },
            { left: "פֶּרַח", right: "צִבְעוֹנִי וְיָפֶה" },
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
