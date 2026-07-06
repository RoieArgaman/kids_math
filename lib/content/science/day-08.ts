import { matchPairs, multipleChoice, trueFalse } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/**
 * Science Day 8 — "כּוֹחוֹת וּתְנוּעָה" (forces & motion), Level א׳ (כיתה א׳).
 *
 * 100% Hebrew by construction: only `multipleChoice` / `trueFalse` / `matchPairs`,
 * and every `matchPairs` keeps both sides Hebrew (`leftLang: "he", rightLang: "he"`).
 * Prompts are read aloud by the standard Hebrew TTS path. Emoji are decorative;
 * each answer also carries a Hebrew word so nothing is emoji-only.
 *
 * Curriculum anchor: Israeli MoE "חוֹמָרִים, כּוֹחוֹת וְאֶנֶרְגְּיָה" (forces & motion),
 * aligned with international Grade-1 "pushes & pulls" (NGSS K-PS2) — concrete,
 * observational push/pull, gravity, and friction.
 */
export const scienceDay08: WorkbookDay = {
  id: "day-8",
  dayNumber: 8,
  title: "שִׁעוּר 8: כּוֹחוֹת וּתְנוּעָה",
  week: 2,
  objective: "לְהַבְחִין בֵּין דְּחִיפָה לִמְשִׁיכָה וּלְהַכִּיר אֶת כֹּחַ הַכֹּבֶד וְאֶת הַחִכּוּךְ.",
  teachingSummary:
    "הַיּוֹם נִלְמַד עַל כּוֹחוֹת: כְּשֶׁדּוֹחֲפִים אָנוּ מַרְחִיקִים דָּבָר מֵאִתָּנוּ, וּכְשֶׁמּוֹשְׁכִים אָנוּ מְקָרְבִים אוֹתוֹ אֵלֵינוּ. כֹּחַ הַכֹּבֶד מוֹשֵׁךְ דְּבָרִים לְמַטָּה, וְהַחִכּוּךְ עוֹצֵר אוֹתָנוּ עַל מִשְׁטָח מְחֻסְפָּס.",
  teachingSteps: [
    "חוֹשְׁבִים אִם הַפְּעֻלָּה הִיא דְּחִיפָה אוֹ מְשִׁיכָה.",
    "בּוֹחֲרִים אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
    "בַּסּוֹף מַתְאִימִים כָּל פְּעֻלָּה לַכֹּחַ שֶׁלָּהּ.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-8-section-0",
      title: "חִימּוּם: דּוֹחֲפִים וּמוֹשְׁכִים",
      type: "warmup",
      learningGoal: "לְזַהוֹת מָתַי דּוֹחֲפִים וּמָתַי מוֹשְׁכִים, וּמָה קוֹרֶה כְּשֶׁדָּבָר נוֹפֵל.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(8, 0, 1, "כְּשֶׁמַּרְחִיקִים עֲגָלָה מֵאִתָּנוּ בַּיָּדַיִם, מָה עוֹשִׂים? 🛒", ["דּוֹחֲפִים", "מוֹשְׁכִים", "אוֹכְלִים"], "דּוֹחֲפִים", [], 1, "concrete"),
        multipleChoice(8, 0, 2, "כְּשֶׁמְּקָרְבִים חֶבֶל אֵלֵינוּ בַּיָּדַיִם, מָה עוֹשִׂים? 🪢", ["מוֹשְׁכִים", "דּוֹחֲפִים", "יְשֵׁנִים"], "מוֹשְׁכִים", [], 1, "concrete"),
        multipleChoice(8, 0, 3, "לְאָן נוֹפֵל כַּדּוּר שֶׁמַּפִּילִים מֵהַיָּד? ⚽", ["לְמַטָּה", "לְמַעְלָה", "לְצַד"], "לְמַטָּה", [], 1, "concrete"),
        multipleChoice(8, 0, 4, "כְּשֶׁפּוֹתְחִים דֶּלֶת וְדוֹחֲפִים אוֹתָהּ, אֵיזֶה כֹּחַ מַפְעִילִים? 🚪", ["דְּחִיפָה", "מְשִׁיכָה", "רֵיחַ"], "דְּחִיפָה", [], 2, "concrete"),
      ],
    },
    {
      id: "day-8-section-1",
      title: "כֹּחַ הַכֹּבֶד וְהַחִכּוּךְ",
      type: "verbal",
      learningGoal: "לְהָבִין שֶׁכֹּחַ הַכֹּבֶד מוֹשֵׁךְ לְמַטָּה וְשֶׁהַחִכּוּךְ עוֹצֵר תְּנוּעָה.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(8, 1, 1, "לְאָן מוֹשֵׁךְ כֹּחַ הַכֹּבֶד אֶת הַדְּבָרִים?", ["לְמַטָּה", "לְמַעְלָה", "הַצִּדָּה"], "לְמַטָּה", [], 2, "abstract"),
        multipleChoice(8, 1, 2, "עַל אֵיזֶה מִשְׁטָח גּוֹלְשִׁים מַהֵר יוֹתֵר?", ["מִשְׁטָח חָלָק", "מִשְׁטָח מְחֻסְפָּס", "מִשְׁטָח דָּבִיק"], "מִשְׁטָח חָלָק", [], 2, "abstract"),
        multipleChoice(8, 1, 3, "מָה קוֹרֶה כְּשֶׁגּוֹלְשִׁים עַל מִשְׁטָח מְחֻסְפָּס?", ["נֶעֱצָרִים מַהֵר", "מַגְבִּירִים מְהִירוּת", "עָפִים לְמַעְלָה"], "נֶעֱצָרִים מַהֵר", [], 2, "abstract"),
        multipleChoice(8, 1, 4, "כְּשֶׁמְּקָרְבִים מְגֵרָה אֵלֵינוּ וּפוֹתְחִים אוֹתָהּ, מָה עוֹשִׂים?", ["מוֹשְׁכִים", "דּוֹחֲפִים", "מְנַגְּנִים"], "מוֹשְׁכִים", [], 2, "abstract"),
        trueFalse(8, 1, 5, "הַאִם כֹּחַ הַכֹּבֶד מוֹשֵׁךְ דְּבָרִים לְמַטָּה?", true, [], 1, "abstract"),
      ],
    },
    {
      id: "day-8-section-2",
      title: "חֲזָרָה",
      type: "review",
      learningGoal: "לַחֲזוֹר עַל דְּחִיפָה, מְשִׁיכָה, כֹּחַ הַכֹּבֶד וְהַחִכּוּךְ.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(8, 2, 1, "כְּשֶׁדּוֹחֲפִים עֲגָלָה, לְאָן הִיא זָזָה? 🛒", ["מֵאִתָּנוּ וְהָלְאָה", "אֵלֵינוּ", "כְּלָפֵי מַעְלָה"], "מֵאִתָּנוּ וְהָלְאָה", [], 2, "abstract"),
        trueFalse(8, 2, 2, "הַאִם מוֹשְׁכִים חֶבֶל כְּדֵי לְקָרֵב אוֹתוֹ אֵלֵינוּ?", true, [], 1, "abstract"),
        multipleChoice(8, 2, 3, "עַל מַגְלֵשָׁה חֲלָקָה מָה קוֹרֶה לָנוּ? 🛝", ["מַחְלִיקִים מַהֵר יוֹתֵר", "נִתְקָעִים בַּמָּקוֹם", "עוֹלִים לְמַעְלָה"], "מַחְלִיקִים מַהֵר יוֹתֵר", [], 2, "abstract"),
        trueFalse(8, 2, 4, "הַאִם כֹּחַ הַכֹּבֶד מוֹשֵׁךְ אוֹתָנוּ לְמַעְלָה לַשָּׁמַיִם?", false, [], 2, "abstract"),
        multipleChoice(8, 2, 5, "אֵיזֶה כֹּחַ עוֹצֵר אוֹתָנוּ עַל מִשְׁטָח מְחֻסְפָּס?", ["הַחִכּוּךְ", "כֹּחַ הַכֹּבֶד", "הָרֵיחַ"], "הַחִכּוּךְ", [], 3, "abstract"),
        matchPairs(
          8,
          2,
          6,
          "הַתְאִימוּ כָּל פְּעֻלָּה לַכֹּחַ שֶׁלָּהּ:",
          [
            { left: "דְּחִיפַת עֲגָלָה", right: "דְּחִיפָה" },
            { left: "מְשִׁיכַת חֶבֶל", right: "מְשִׁיכָה" },
            { left: "נְפִילַת תַּפּוּחַ", right: "כֹּחַ הַכֹּבֶד" },
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
