import { matchPairs, multipleChoice, trueFalse } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/**
 * Science Day 5 — "יוֹם וָלַיְלָה, שֶׁמֶשׁ וְיָרֵחַ" (day/night, sun & moon), Level א׳.
 *
 * 100% Hebrew with niqqud; only `multipleChoice` / `trueFalse` / `matchPairs`,
 * and every `matchPairs` keeps both sides Hebrew (`leftLang: "he", rightLang: "he"`).
 *
 * Curriculum anchor: Israeli MoE "כדור הארץ והיקום" (sky patterns, day/night),
 * aligned with NGSS 1-ESS1 / Germany Sachunterricht "astronomische Themen".
 */
export const scienceDay05: WorkbookDay = {
  id: "day-5",
  dayNumber: 5,
  title: "שִׁעוּר 5: יוֹם וָלַיְלָה, שֶׁמֶשׁ וְיָרֵחַ",
  week: 1,
  objective: "לְהָבִין מָה רוֹאִים בַּשָּׁמַיִם בַּיּוֹם וּבַלַּיְלָה, וּלְהַכִּיר אֶת הַשֶּׁמֶשׁ וְהַיָּרֵחַ.",
  teachingSummary:
    "הַיּוֹם נִלְמַד שֶׁבַּיּוֹם הַשֶּׁמֶשׁ מְאִירָה וְיֵשׁ אוֹר, וּבַלַּיְלָה רוֹאִים אֶת הַיָּרֵחַ וְאֶת הַכּוֹכָבִים וְחָשׁוּךְ יוֹתֵר.",
  teachingSteps: [
    "חוֹשְׁבִים מָה רוֹאִים בַּשָּׁמַיִם בַּיּוֹם וּבַלַּיְלָה.",
    "בּוֹחֲרִים אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
    "בַּסּוֹף מַתְאִימִים כָּל דָּבָר לַיּוֹם אוֹ לַלַּיְלָה.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-5-section-0",
      title: "חִימּוּם: בַּיּוֹם וּבַלַּיְלָה",
      type: "warmup",
      learningGoal: "לְזַהוֹת מָה רוֹאִים בַּשָּׁמַיִם בַּיּוֹם וּבַלַּיְלָה.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(5, 0, 1, "מָה מְאִירָה אֶת הַשָּׁמַיִם בַּיּוֹם? ☀️", ["הַשֶּׁמֶשׁ", "הַיָּרֵחַ", "הַכּוֹכָבִים"], "הַשֶּׁמֶשׁ", [], 1, "concrete"),
        multipleChoice(5, 0, 2, "מָה רוֹאִים בַּשָּׁמַיִם בַּלַּיְלָה? 🌙", ["הַיָּרֵחַ", "הַשֶּׁמֶשׁ", "הָעֲנָנִים"], "הַיָּרֵחַ", [], 1, "concrete"),
        multipleChoice(5, 0, 3, "מָתַי אֲנַחְנוּ בְּדֶרֶךְ כְּלָל הוֹלְכִים לִישֹׁן? 😴", ["בַּלַּיְלָה", "בַּבֹּקֶר", "בַּצָּהֳרַיִם"], "בַּלַּיְלָה", [], 1, "concrete"),
        multipleChoice(5, 0, 4, "מָה זוֹרְחוֹת בַּשָּׁמַיִם בַּלַּיְלָה? ⭐", ["כּוֹכָבִים", "פְּרָחִים", "דָּגִים"], "כּוֹכָבִים", [], 1, "concrete"),
      ],
    },
    {
      id: "day-5-section-1",
      title: "הַשֶּׁמֶשׁ וְהַיָּרֵחַ",
      type: "verbal",
      learningGoal: "לְהָבִין מָה הַשֶּׁמֶשׁ נוֹתֶנֶת לָנוּ וּמָה קוֹרֶה בַּלַּיְלָה.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(5, 1, 1, "מָה נוֹתֶנֶת לָנוּ הַשֶּׁמֶשׁ? ☀️", ["אוֹר וְחֹם", "גֶּשֶׁם", "שֶׁלֶג"], "אוֹר וְחֹם", [], 1, "abstract"),
        multipleChoice(5, 1, 2, "מָתַי בְּדֶרֶךְ כְּלָל קַמִּים וְהוֹלְכִים לְבֵית הַסֵּפֶר? 🎒", ["בַּבֹּקֶר", "בַּלַּיְלָה", "בַּחֲצוֹת"], "בַּבֹּקֶר", [], 1, "abstract"),
        multipleChoice(5, 1, 3, "אֵיךְ הַשָּׁמַיִם בַּלַּיְלָה לְעֻמַּת הַיּוֹם?", ["חֲשׁוּכִים יוֹתֵר", "מוּאָרִים יוֹתֵר", "אוֹתוֹ דָּבָר"], "חֲשׁוּכִים יוֹתֵר", [], 2, "abstract"),
        trueFalse(5, 1, 4, "הַאִם בַּיּוֹם הַשֶּׁמֶשׁ מְאִירָה?", true, [], 1, "abstract"),
        trueFalse(5, 1, 5, "הַאִם רוֹאִים אֶת הַשֶּׁמֶשׁ בְּאֶמְצַע הַלַּיְלָה?", false, [], 2, "abstract"),
      ],
    },
    {
      id: "day-5-section-2",
      title: "חֲזָרָה",
      type: "review",
      learningGoal: "לַחֲזוֹר עַל הַיּוֹם וְהַלַּיְלָה, הַשֶּׁמֶשׁ וְהַיָּרֵחַ.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(5, 2, 1, "מָתַי חַם יוֹתֵר בַּחוּץ בְּדֶרֶךְ כְּלָל?", ["בַּיּוֹם", "בַּלַּיְלָה", "אַף פַּעַם"], "בַּיּוֹם", [], 1, "abstract"),
        trueFalse(5, 2, 2, "הַאִם הַיָּרֵחַ נִרְאֶה בְּדֶרֶךְ כְּלָל בַּלַּיְלָה?", true, [], 1, "abstract"),
        multipleChoice(5, 2, 3, "מָה הֲכִי גְּדוֹלָה וּמְאִירָה בַּיּוֹם? ☀️", ["הַשֶּׁמֶשׁ", "עָנָן", "צִפּוֹר"], "הַשֶּׁמֶשׁ", [], 2, "abstract"),
        trueFalse(5, 2, 4, "הַאִם בַּלַּיְלָה בְּדֶרֶךְ כְּלָל מוּאָר כְּמוֹ בַּיּוֹם?", false, [], 2, "abstract"),
        multipleChoice(5, 2, 5, "מָה עוֹזֵר לָנוּ לִרְאוֹת כְּשֶׁחָשׁוּךְ בַּבַּיִת? 💡", ["מְנוֹרָה", "כָּרִית", "כַּף"], "מְנוֹרָה", [], 2, "abstract"),
        matchPairs(
          5,
          2,
          6,
          "הַתְאִימוּ כָּל דָּבָר לַתֵּאוּר שֶׁלּוֹ:",
          [
            { left: "שֶׁמֶשׁ", right: "מְאִירָה וּמְחַמֶּמֶת בַּיּוֹם" },
            { left: "יָרֵחַ", right: "נִרְאֶה בַּלַּיְלָה" },
            { left: "כּוֹכָבִים", right: "נְקֻדּוֹת אוֹר בַּשָּׁמַיִם" },
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
