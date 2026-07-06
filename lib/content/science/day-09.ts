import { matchPairs, multipleChoice, trueFalse } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/**
 * Science Day 9 — "כֵּלִים, מַכְשִׁירִים וְהַמְצָאוֹת" (tools, appliances & inventions),
 * Level א׳ (כיתה א׳).
 *
 * 100% Hebrew by construction: only `multipleChoice` / `trueFalse` / `matchPairs`,
 * and every `matchPairs` keeps both sides Hebrew (`leftLang: "he", rightLang: "he"`).
 * Prompts are read aloud by the standard Hebrew TTS path. Emoji are decorative;
 * each answer also carries a Hebrew word so nothing is emoji-only.
 *
 * Curriculum anchor: Israeli MoE "מַדָּע וְטֶכְנוֹלוֹגְיָה" (tools & technology in daily
 * life), aligned with international Grade-1 "engineering & design" (NGSS K-2-ETS1) —
 * recognizing common tools/appliances and the problems simple inventions solved.
 */
export const scienceDay09: WorkbookDay = {
  id: "day-9",
  dayNumber: 9,
  title: "שִׁעוּר 9: כֵּלִים, מַכְשִׁירִים וְהַמְצָאוֹת",
  week: 2,
  objective: "לְהַכִּיר כֵּלִים וּמַכְשִׁירִים נְפוֹצִים וְאֶת הַשִּׁימּוּשׁ שֶׁל כָּל אֶחָד.",
  teachingSummary:
    "הַיּוֹם נַכִּיר כֵּלִים וּמַכְשִׁירִים שֶׁעוֹזְרִים לָנוּ כָּל יוֹם: פַּטִּישׁ דּוֹפֵק מַסְמֵר, מִסְפָּרַיִם חוֹתְכִים, מַבְרֵג מְסוֹבֵב בֹּרֶג. גַּם מַכְשִׁירִים בַּבַּיִת עוֹזְרִים: מְקָרֵר שׁוֹמֵר אֹכֶל קַר, מְנוֹרָה נוֹתֶנֶת אוֹר וּמְכוֹנַת כְּבִיסָה מְכַבֶּסֶת בְּגָדִים.",
  teachingSteps: [
    "חוֹשְׁבִים לְמָה מְשַׁמֵּשׁ כָּל כְּלִי.",
    "בּוֹחֲרִים אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
    "בַּסּוֹף מַתְאִימִים כָּל כְּלִי לַשִּׁימּוּשׁ שֶׁלּוֹ.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-9-section-0",
      title: "חִימּוּם: כֵּלִים וְהַשִּׁימּוּשׁ שֶׁלָּהֶם",
      type: "warmup",
      learningGoal: "לְזַהוֹת לְמָה מְשַׁמֵּשׁ כָּל כְּלִי עֲבוֹדָה.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(9, 0, 1, "לְמָה מְשַׁמֵּשׁ פַּטִּישׁ? 🔨", ["לִדְפֹּק מַסְמֵר", "לֶאֱכֹל מָרָק", "לִשְׁתּוֹת מַיִם"], "לִדְפֹּק מַסְמֵר", [], 1, "concrete"),
        multipleChoice(9, 0, 2, "לְמָה מְשַׁמְּשׁוֹת מִסְפָּרַיִם? ✂️", ["לַחְתֹּךְ", "לִישֹׁן", "לְצַיֵּר"], "לַחְתֹּךְ", [], 1, "concrete"),
        multipleChoice(9, 0, 3, "לְמָה מְשַׁמֵּשׁ מַבְרֵג? 🪛", ["לְסוֹבֵב בֹּרֶג", "לְבַשֵּׁל אֹכֶל", "לָשִׁיר"], "לְסוֹבֵב בֹּרֶג", [], 1, "concrete"),
        multipleChoice(9, 0, 4, "בְּאֵיזֶה כְּלִי מְשַׁמְּשִׁים כְּדֵי לַחְתֹּךְ נְיָר? ✂️", ["מִסְפָּרַיִם", "פַּטִּישׁ", "כַּפִּית"], "מִסְפָּרַיִם", [], 2, "concrete"),
      ],
    },
    {
      id: "day-9-section-1",
      title: "מַכְשִׁירִים בַּבַּיִת וּזְהִירוּת",
      type: "verbal",
      learningGoal: "לְהַכִּיר מַכְשִׁירֵי בַּיִת וּלְהָבִין כְּלָלֵי זְהִירוּת בְּסִיסִיִּים.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(9, 1, 1, "מָה עוֹשֶׂה מְקָרֵר? ❄️", ["שׁוֹמֵר אֹכֶל קַר", "מְחַמֵּם אֶת הַבַּיִת", "נוֹתֵן אוֹר"], "שׁוֹמֵר אֹכֶל קַר", [], 2, "abstract"),
        multipleChoice(9, 1, 2, "מָה עוֹשָׂה מְנוֹרָה? 💡", ["נוֹתֶנֶת אוֹר", "מְכַבֶּסֶת בְּגָדִים", "חוֹתֶכֶת נְיָר"], "נוֹתֶנֶת אוֹר", [], 1, "abstract"),
        multipleChoice(9, 1, 3, "מָה עוֹשָׂה מְכוֹנַת כְּבִיסָה? 🧺", ["מְכַבֶּסֶת בְּגָדִים", "מְבַשֶּׁלֶת אֹכֶל", "נוֹתֶנֶת אוֹר"], "מְכַבֶּסֶת בְּגָדִים", [], 2, "abstract"),
        trueFalse(9, 1, 4, "הַאִם אָסוּר לָגַעַת בְּשֶׁקַע חַשְׁמַל?", true, [], 2, "abstract"),
        trueFalse(9, 1, 5, "הַאִם צְרִיכִים לִהְיוֹת זְהִירִים כְּשֶׁמְּשַׁמְּשִׁים בְּמִסְפָּרַיִם?", true, [], 2, "abstract"),
      ],
    },
    {
      id: "day-9-section-2",
      title: "חֲזָרָה",
      type: "review",
      learningGoal: "לַחֲזוֹר עַל כֵּלִים, מַכְשִׁירִים וְהַמְצָאוֹת.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(9, 2, 1, "בְּאֵיזֶה מַכְשִׁיר שׁוֹמְרִים אֹכֶל קַר וְטָרִי? ❄️", ["מְקָרֵר", "מְנוֹרָה", "פַּטִּישׁ"], "מְקָרֵר", [], 2, "abstract"),
        trueFalse(9, 2, 2, "הַאִם מְנוֹרָה נוֹתֶנֶת לָנוּ אוֹר בַּחֹשֶׁךְ?", true, [], 1, "abstract"),
        multipleChoice(9, 2, 3, "בְּמָה עוֹזֵר לָנוּ הַגַּלְגַּל? 🛞", ["לָנוּעַ וּלְהַסִּיעַ", "לְבַשֵּׁל אֹכֶל", "לִשְׁמֹר אֹכֶל קַר"], "לָנוּעַ וּלְהַסִּיעַ", [], 3, "abstract"),
        trueFalse(9, 2, 4, "הַאִם פַּטִּישׁ מְשַׁמֵּשׁ כְּדֵי לְכַבֵּס בְּגָדִים?", false, [], 2, "abstract"),
        multipleChoice(9, 2, 5, "מָה נוֹתֶנֶת לָנוּ הַמְּנוֹרָה בַּחֹשֶׁךְ? 💡", ["אוֹר", "אֹכֶל", "מַיִם"], "אוֹר", [], 2, "abstract"),
        matchPairs(
          9,
          2,
          6,
          "הַתְאִימוּ כָּל כְּלִי לַשִּׁימּוּשׁ שֶׁלּוֹ:",
          [
            { left: "פַּטִּישׁ", right: "לִדְפֹּק מַסְמֵר" },
            { left: "מִסְפָּרַיִם", right: "לַחְתֹּךְ" },
            { left: "מַבְרֵג", right: "לְסוֹבֵב בֹּרֶג" },
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
