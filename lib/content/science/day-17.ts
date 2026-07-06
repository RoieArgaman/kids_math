import { matchPairs, multipleChoice, trueFalse } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/**
 * Science Day 17 — "קְהִילָּה וּשְׁמִירַת הַסְּבִיבָה" (community & environmental
 * conservation), Level ב׳ (כיתה ב׳).
 *
 * 100% Hebrew with niqqud; only `multipleChoice` / `trueFalse` / `matchPairs`,
 * with `matchPairs` kept Hebrew on both sides (`leftLang: "he", rightLang: "he"`).
 * Prompts are read aloud by the standard Hebrew TTS path. Emoji are decorative;
 * each answer also carries a Hebrew word so nothing is emoji-only.
 *
 * Curriculum anchor: Israeli MoE "אדם וסביבה" (community, geography & the
 * environment), aligned with NGSS 2-ESS "Earth and Human Activity" — reading a
 * simple map, community helpers, and cause→effect of protecting the environment.
 */
export const scienceDay17: WorkbookDay = {
  id: "day-17",
  dayNumber: 17,
  title: "שִׁעוּר 17: קְהִילָּה וּשְׁמִירַת הַסְּבִיבָה",
  week: 4,
  objective:
    "לִקְרֹא מַפָּה פְּשׁוּטָה, לְקַשֵּׁר בֵּין מִקְצוֹעוֹת לַתּוֹעֶלֶת לַקְּהִילָּה, וּלְהָבִין מָה קוֹרֶה כְּשֶׁשּׁוֹמְרִים אוֹ פּוֹגְעִים בַּסְּבִיבָה.",
  teachingSummary:
    "הַיּוֹם נִלְמַד שֶׁמַּפָּה עוֹזֶרֶת לָנוּ לִמְצֹא אֶת הַדֶּרֶךְ, שֶׁלְּכָל בַּעַל מִקְצוֹעַ יֵשׁ תּוֹעֶלֶת לַקְּהִילָּה, וְשֶׁחָשׁוּב לִשְׁמֹר עַל הַסְּבִיבָה כְּדֵי שֶׁלַּחַיּוֹת וְלַצְּמָחִים יִהְיֶה טוֹב.",
  teachingSteps: [
    "לוֹמְדִים אֵיךְ מַפָּה עוֹזֶרֶת לִמְצֹא אֶת הַדֶּרֶךְ.",
    "מְקַשְּׁרִים כָּל מִקְצוֹעַ לַתּוֹעֶלֶת שֶׁלּוֹ לַקְּהִילָּה.",
    "בַּסּוֹף חוֹשְׁבִים מָה קוֹרֶה כְּשֶׁשּׁוֹמְרִים עַל הַסְּבִיבָה.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-17-section-0",
      title: "חִימּוּם: מַפָּה וְקְהִילָּה",
      type: "warmup",
      learningGoal: "לְזַהוֹת אֵיךְ מַפָּה עוֹזֶרֶת לָנוּ וּמִי עוֹזֵר בַּקְּהִילָּה.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(17, 0, 1, "בְּמָה מַפָּה עוֹזֶרֶת לָנוּ? 🗺️", ["לִמְצֹא אֶת הַדֶּרֶךְ", "לֶאֱכֹל אֲרוּחָה", "לִישֹׁן בַּלַּיְלָה"], "לִמְצֹא אֶת הַדֶּרֶךְ", [], 1, "concrete"),
        multipleChoice(17, 0, 2, "אֵיזֶה סִימָן עַל הַמַּפָּה מַרְאֶה לָנוּ אֶת הַיָּם? 🌊", ["צֶבַע כָּחֹל", "צֶבַע אָדֹם", "צֶבַע צָהֹב"], "צֶבַע כָּחֹל", [], 1, "concrete"),
        multipleChoice(17, 0, 3, "מִי מְכַבֶּה שְׂרֵפוֹת וְעוֹזֵר לַקְּהִילָּה? 🚒", ["הַכַּבַּאי", "הַסַּפָּר", "הַצַּיָּר"], "הַכַּבַּאי", [], 1, "concrete"),
        multipleChoice(17, 0, 4, "מִי מְרַפֵּא אֲנָשִׁים חוֹלִים בַּקְּהִילָּה? 🩺", ["הָרוֹפֵא", "הַנַּהָג", "הַשַּׁחְקָן"], "הָרוֹפֵא", [], 1, "concrete"),
      ],
    },
    {
      id: "day-17-section-1",
      title: "מִקְצוֹעַ וְתוֹעֶלֶת לַקְּהִילָּה",
      type: "verbal",
      learningGoal: "לְהָבִין אֵיזוֹ תּוֹעֶלֶת מֵבִיא כָּל בַּעַל מִקְצוֹעַ לַקְּהִילָּה.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(17, 1, 1, "מָה עוֹשֶׂה חַקְלַאי לְמַעַן הַקְּהִילָּה? 🌾", ["מְגַדֵּל אֹכֶל", "מְלַמֵּד יְלָדִים", "מְכַבֶּה שְׂרֵפוֹת"], "מְגַדֵּל אֹכֶל", [], 2, "abstract"),
        multipleChoice(17, 1, 2, "מָה עוֹשֶׂה רוֹפֵא לְמַעַן הַקְּהִילָּה? 🩺", ["מְרַפֵּא חוֹלִים", "מְגַדֵּל אֹכֶל", "בּוֹנֶה בָּתִּים"], "מְרַפֵּא חוֹלִים", [], 2, "abstract"),
        multipleChoice(17, 1, 3, "מָה עוֹשֶׂה מוֹרֶה לְמַעַן הַקְּהִילָּה? 📚", ["מְלַמֵּד יְלָדִים", "מְכַבֶּה שְׂרֵפוֹת", "מְרַפֵּא חוֹלִים"], "מְלַמֵּד יְלָדִים", [], 2, "abstract"),
        trueFalse(17, 1, 4, "הַאִם חַקְלַאי מְגַדֵּל אֹכֶל בִּשְׁבִיל הַקְּהִילָּה?", true, [], 1, "abstract"),
        trueFalse(17, 1, 5, "הַאִם מוֹרֶה מְרַפֵּא אֲנָשִׁים חוֹלִים בְּבֵית הַחוֹלִים?", false, [], 2, "abstract"),
      ],
    },
    {
      id: "day-17-section-2",
      title: "חֲזָרָה",
      type: "review",
      learningGoal: "לַחֲזוֹר עַל תּוֹעֶלֶת הַקְּהִילָּה וְעַל שְׁמִירַת הַסְּבִיבָה.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(17, 2, 1, "מָה יִקְרֶה לַדָּגִים אִם נִזְרֹק זֶבֶל לַיָּם? 🐟", ["הֵם יִיפָּגְעוּ", "הֵם יִגְדְּלוּ יוֹתֵר", "הֵם יִהְיוּ שְׂמֵחִים"], "הֵם יִיפָּגְעוּ", [], 2, "abstract"),
        trueFalse(17, 2, 2, "הַאִם חָשׁוּב לִשְׁמֹר עַל הַסְּבִיבָה הַנְּקִיָּה?", true, [], 1, "abstract"),
        multipleChoice(17, 2, 3, "מָה יִקְרֶה לַחַיּוֹת וְלַצְּמָחִים אִם לֹא נִשְׁמֹר עַל הַסְּבִיבָה? 🌍", ["יִהְיֶה לָהֶם קָשֶׁה לִחְיוֹת", "יִהְיֶה לָהֶם נָעִים יוֹתֵר", "הֵם יִגְדְּלוּ מַהֵר"], "יִהְיֶה לָהֶם קָשֶׁה לִחְיוֹת", [], 3, "abstract"),
        multipleChoice(17, 2, 4, "מָה אֶפְשָׁר לַעֲשׂוֹת כְּדֵי לַעֲזֹר לַסְּבִיבָה? ♻️", ["לְמַחְזֵר וְלִסְגֹּר אֶת הַבֶּרֶז", "לְהַשְׁאִיר אֶת הָאוֹר דָּלוּק", "לִזְרֹק זֶבֶל בָּרְחוֹב"], "לְמַחְזֵר וְלִסְגֹּר אֶת הַבֶּרֶז", [], 2, "abstract"),
        trueFalse(17, 2, 5, "הַאִם זְרִיקַת זֶבֶל לַיָּם עוֹזֶרֶת לַסְּבִיבָה?", false, [], 2, "abstract"),
        matchPairs(
          17,
          2,
          6,
          "הַתְאִימוּ כָּל מִקְצוֹעַ לַתּוֹעֶלֶת שֶׁלּוֹ לַקְּהִילָּה:",
          [
            { left: "חַקְלַאי", right: "מְגַדֵּל אֹכֶל" },
            { left: "רוֹפֵא", right: "מְרַפֵּא חוֹלִים" },
            { left: "כַּבַּאי", right: "מְכַבֶּה שְׂרֵפוֹת" },
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
