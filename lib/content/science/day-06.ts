import { matchPairs, multipleChoice, trueFalse } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/**
 * Science Day 6 — "קְבוּצוֹת בַּעֲלֵי הַחַיִּים" (animal groups & sorting), Level א׳ (כיתה א׳).
 *
 * 100% Hebrew by construction: only `multipleChoice` / `trueFalse` / `matchPairs`,
 * with every `matchPairs` kept Hebrew on both sides (`leftLang: "he", rightLang: "he"`).
 * Emoji are decorative; each answer also carries a Hebrew word so nothing is emoji-only.
 *
 * Curriculum anchor: Israeli MoE "מערכות ותהליכים ביצורים חיים" (עולם החי) — sorting
 * animals into groups by habitat and diet, aligned with NGSS 1-LS3 / Grade-1 life science.
 */
export const scienceDay06: WorkbookDay = {
  id: "day-6",
  dayNumber: 6,
  title: "שִׁעוּר 6: קְבוּצוֹת בַּעֲלֵי הַחַיִּים",
  week: 2,
  objective: "לְזַהוֹת קְבוּצוֹת שֶׁל בַּעֲלֵי חַיִּים וּלְמַיֵּן אוֹתָם לְפִי בֵּית הַגִּדּוּל וְהַמָּזוֹן.",
  teachingSummary:
    "הַיּוֹם נִלְמַד שֶׁבַּעֲלֵי הַחַיִּים מִתְחַלְּקִים לִקְבוּצוֹת: יוֹנְקִים, עוֹפוֹת, זוֹחֲלִים, דּוּ-חַיִּים, דָּגִים וַחֲרָקִים. נִלְמַד גַּם אֵיפֹה הֵם חַיִּים וּמָה הֵם אוֹכְלִים.",
  teachingSteps: [
    "מִסְתַּכְּלִים עַל בַּעַל הַחַיִּים וְחוֹשְׁבִים לְאֵיזוֹ קְבוּצָה הוּא שַׁיָּךְ.",
    "בּוֹחֲרִים אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
    "בַּסּוֹף מַתְאִימִים כָּל חַיָּה לַקְּבוּצָה שֶׁלָּהּ.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-6-section-0",
      title: "חִימּוּם: לְאֵיזוֹ קְבוּצָה?",
      type: "warmup",
      learningGoal: "לְזַהוֹת אִם חַיָּה הִיא יוֹנֵק, עוֹף אוֹ דָּג.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(6, 0, 1, "לְאֵיזוֹ קְבוּצָה שַׁיָּךְ הַכֶּלֶב? 🐶", ["יוֹנֵק", "עוֹף", "דָּג"], "יוֹנֵק", [], 1, "concrete"),
        multipleChoice(6, 0, 2, "לְאֵיזוֹ קְבוּצָה שַׁיָּךְ הַדָּג? 🐟", ["דָּג", "עוֹף", "יוֹנֵק"], "דָּג", [], 1, "concrete"),
        multipleChoice(6, 0, 3, "לְאֵיזוֹ קְבוּצָה שַׁיֶּכֶת הַיּוֹנָה? 🕊️", ["עוֹף", "דָּג", "יוֹנֵק"], "עוֹף", [], 1, "concrete"),
        multipleChoice(6, 0, 4, "לְאֵיזוֹ קְבוּצָה שַׁיֶּכֶת הַפָּרָה? 🐄", ["יוֹנֵק", "עוֹף", "דָּג"], "יוֹנֵק", [], 1, "concrete"),
      ],
    },
    {
      id: "day-6-section-1",
      title: "בֵּית הַגִּדּוּל וְהַמָּזוֹן",
      type: "verbal",
      learningGoal: "לְהָבִין אֵיפֹה חַיּוֹת חַיּוֹת וּמָה הֵן אוֹכְלוֹת.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(6, 1, 1, "לְאֵיזוֹ קְבוּצָה שַׁיָּךְ הַנָּחָשׁ? 🐍", ["זוֹחֵל", "עוֹף", "יוֹנֵק"], "זוֹחֵל", [], 2, "abstract"),
        multipleChoice(6, 1, 2, "לְאֵיזוֹ קְבוּצָה שַׁיֶּכֶת הַדְּבוֹרָה? 🐝", ["חֶרֶק", "דָּג", "זוֹחֵל"], "חֶרֶק", [], 2, "abstract"),
        multipleChoice(6, 1, 3, "מָה אוֹכֵל הָאַרְיֵה? 🦁", ["בָּשָׂר", "עֵשֶׂב", "אֲבָנִים"], "בָּשָׂר", [], 2, "abstract"),
        multipleChoice(6, 1, 4, "אֵיפֹה חַי הַדָּג? 🐠", ["בַּמַּיִם", "בַּיַּבָּשָׁה", "בָּאֲוִיר"], "בַּמַּיִם", [], 1, "abstract"),
        multipleChoice(6, 1, 5, "אֵיפֹה חַיָּה הַצְּפַרְדֵּעַ? 🐸", ["גַּם בַּמַּיִם וְגַם בַּיַּבָּשָׁה", "רַק בָּאֲוִיר", "רַק בַּמִּדְבָּר"], "גַּם בַּמַּיִם וְגַם בַּיַּבָּשָׁה", [], 2, "abstract"),
      ],
    },
    {
      id: "day-6-section-2",
      title: "חֲזָרָה",
      type: "review",
      learningGoal: "לַחֲזוֹר עַל קְבוּצוֹת בַּעֲלֵי הַחַיִּים.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(6, 2, 1, "אֵיזֶה בַּעַל חַיִּים אוֹפְיָינִי לַמִּדְבָּר בְּיִשְׂרָאֵל? 🐪", ["הַגָּמָל", "הַדָּג", "הַצְּפַרְדֵּעַ"], "הַגָּמָל", [], 2, "abstract"),
        trueFalse(6, 2, 2, "הַאִם הַפָּרָה אוֹכֶלֶת עֵשֶׂב?", true, [], 1, "abstract"),
        multipleChoice(6, 2, 3, "מָה אוֹכֶלֶת הַפָּרָה? 🐄", ["עֵשֶׂב", "בָּשָׂר", "אֲבָנִים"], "עֵשֶׂב", [], 1, "abstract"),
        trueFalse(6, 2, 4, "הַאִם הַנָּחָשׁ הוּא זוֹחֵל?", true, [], 2, "abstract"),
        trueFalse(6, 2, 5, "הַאִם הַדָּג חַי בָּאֲוִיר?", false, [], 2, "abstract"),
        matchPairs(
          6,
          2,
          6,
          "הַתְאִימוּ כָּל חַיָּה לַקְּבוּצָה שֶׁלָּהּ:",
          [
            { left: "נָחָשׁ", right: "זוֹחֲלִים" },
            { left: "דְּבוֹרָה", right: "חֲרָקִים" },
            { left: "נֶשֶׁר", right: "עוֹפוֹת" },
          ],
          [],
          3,
          "abstract",
          { leftLang: "he", rightLang: "he" },
        ),
      ],
    },
  ],
};
