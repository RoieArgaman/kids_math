import { matchPairs, multipleChoice, trueFalse } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/**
 * Science Day 10 — "הַסְּבִיבָה שֶׁלָּנוּ — אֲנָשִׁים וּשְׁמִירָה" (our community & conservation),
 * Level א׳ (כיתה א׳).
 *
 * 100% Hebrew with niqqud; only `multipleChoice` / `trueFalse` / `matchPairs`, with
 * `matchPairs` kept Hebrew on both sides (`leftLang: "he", rightLang: "he"`). Emoji are
 * decorative; every answer also carries a Hebrew word so nothing is emoji-only.
 *
 * Curriculum anchor: Israeli MoE "מדע וטכנולוגיה בחברה" (community, professions, transport,
 * national symbols) and "שמירה על הסביבה" (saving resources & sorting waste), Grade-1 level.
 */
export const scienceDay10: WorkbookDay = {
  id: "day-10",
  dayNumber: 10,
  title: "שִׁעוּר 10: הַסְּבִיבָה שֶׁלָּנוּ — אֲנָשִׁים וּשְׁמִירָה",
  week: 2,
  objective:
    "לְהַכִּיר בַּעֲלֵי מִקְצוֹעַ בַּקְּהִלָּה, כְּלֵי תַּחְבּוּרָה, סֵמֶל שֶׁל יִשְׂרָאֵל, וְדַרְכֵי שְׁמִירָה עַל הַסְּבִיבָה.",
  teachingSummary:
    "הַיּוֹם נַכִּיר אֲנָשִׁים שֶׁעוֹזְרִים לָנוּ בַּקְּהִלָּה, נִלְמַד אֵיךְ נוֹסְעִים בַּיַּבָּשָׁה, בַּיָּם וּבָאֲוִיר, נַכִּיר אֶת דֶּגֶל יִשְׂרָאֵל, וְנִלְמַד אֵיךְ שׁוֹמְרִים עַל הַסְּבִיבָה — חוֹסְכִים מַיִם וְחַשְׁמַל וּמְמַיְּנִים אֶת הַזֶּבֶל.",
  teachingSteps: [
    "חוֹשְׁבִים מִי עוֹזֵר לָנוּ בַּקְּהִלָּה.",
    "בּוֹחֲרִים אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
    "בַּסּוֹף מַתְאִימִים כָּל כְּלִי תַּחְבּוּרָה לַמָּקוֹם שֶׁלּוֹ.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-10-section-0",
      title: "חִימּוּם: בַּעֲלֵי מִקְצוֹעַ בַּקְּהִלָּה",
      type: "warmup",
      learningGoal: "לְזַהוֹת מִי עוֹזֵר לָנוּ בַּקְּהִלָּה וּמָה הוּא עוֹשֶׂה.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(10, 0, 1, "מִי מְרַפֵּא חוֹלִים? 🩺", ["רוֹפֵא", "כַּבַּאי", "שׁוֹטֵר"], "רוֹפֵא", [], 1, "concrete"),
        multipleChoice(10, 0, 2, "מִי מְכַבֶּה שְׂרֵפוֹת? 🚒", ["כַּבַּאי", "רוֹפֵא", "טַבָּח"], "כַּבַּאי", [], 1, "concrete"),
        multipleChoice(10, 0, 3, "מִי שׁוֹמֵר עַל הַסֵּדֶר בָּרְחוֹב? 👮", ["שׁוֹטֵר", "כַּבַּאי", "רוֹפֵא"], "שׁוֹטֵר", [], 1, "concrete"),
        multipleChoice(10, 0, 4, "אֶל מִי הוֹלְכִים כְּשֶׁכּוֹאֵב לָנוּ הַבֶּטֶן? 🤒", ["רוֹפֵא", "שׁוֹטֵר", "כַּבַּאי"], "רוֹפֵא", [], 2, "concrete"),
      ],
    },
    {
      id: "day-10-section-1",
      title: "תַּחְבּוּרָה, סֵמֶל וּשְׁמִירָה",
      type: "verbal",
      learningGoal: "לְהָבִין אֵיפֹה נוֹסְעִים כְּלֵי תַּחְבּוּרָה וְאֵיךְ חוֹסְכִים מַיִם וְחַשְׁמַל.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(10, 1, 1, "אֵיפֹה נוֹסַעַת מְכוֹנִית? 🚗", ["בַּיַּבָּשָׁה", "בַּיָּם", "בָּאֲוִיר"], "בַּיַּבָּשָׁה", [], 2, "abstract"),
        multipleChoice(10, 1, 2, "אֵיפֹה מַפְלִיגָה אֳנִיָּה? 🚢", ["בַּיָּם", "בַּיַּבָּשָׁה", "בָּאֲוִיר"], "בַּיָּם", [], 2, "abstract"),
        multipleChoice(10, 1, 3, "אֵיזֶה צֶבַע יֵשׁ לְדֶגֶל יִשְׂרָאֵל? 🇮🇱", ["כָּחֹל וְלָבָן", "אָדֹם וְיָרֹק", "צָהֹב וְשָׁחֹר"], "כָּחֹל וְלָבָן", [], 2, "abstract"),
        trueFalse(10, 1, 4, "הַאִם סְגִירַת הַבֶּרֶז חוֹסֶכֶת מַיִם? 💧", true, [], 1, "abstract"),
        trueFalse(10, 1, 5, "הַאִם כִּיבּוּי הָאוֹר חוֹסֵךְ חַשְׁמַל? 💡", true, [], 2, "abstract"),
      ],
    },
    {
      id: "day-10-section-2",
      title: "חֲזָרָה",
      type: "review",
      learningGoal: "לַחֲזוֹר עַל שְׁמִירָה עַל הַסְּבִיבָה וְעַל כְּלֵי הַתַּחְבּוּרָה.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(10, 2, 1, "בְּאֵיזֶה פַּח מְמַיְּנִים נְיָר? 📄", ["פַּח הַנְּיָר", "פַּח הַזְּכוּכִית", "פַּח הָאֹכֶל"], "פַּח הַנְּיָר", [], 2, "abstract"),
        trueFalse(10, 2, 2, "הַאִם עָשָׁן מְזַהֵם אֶת הָאֲוִיר? 🏭", true, [], 2, "abstract"),
        trueFalse(10, 2, 3, "הַאִם זֶבֶל מְלַכְלֵךְ אֶת הַיָּם? 🌊", true, [], 2, "abstract"),
        multipleChoice(10, 2, 4, "מָה הֵם הַסְּמָלִים שֶׁל מְדִינַת יִשְׂרָאֵל? 🇮🇱", ["דֶּגֶל וְסֵמֶל", "עֻגָּה וְכַדּוּר", "מְכוֹנִית וְאֳנִיָּה"], "דֶּגֶל וְסֵמֶל", [], 2, "abstract"),
        multipleChoice(10, 2, 5, "מָה כְּדַאי לַעֲשׂוֹת כְּדֵי לִשְׁמֹר עַל הַסְּבִיבָה? 🌍", ["לְמַיֵּן זֶבֶל", "לְלַכְלֵךְ בַּיָּם", "לְהַשְׁאִיר בֶּרֶז פָּתוּחַ"], "לְמַיֵּן זֶבֶל", [], 3, "abstract"),
        matchPairs(
          10,
          2,
          6,
          "הַתְאִימוּ כָּל כְּלִי תַּחְבּוּרָה לַמָּקוֹם שֶׁלּוֹ:",
          [
            { left: "מְכוֹנִית", right: "יַבָּשָׁה" },
            { left: "אֳנִיָּה", right: "יָם" },
            { left: "מָטוֹס", right: "אֲוִיר" },
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
