import { matchPairs, multipleChoice, trueFalse } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/**
 * Science Day 1 — "החושים החמישה" (The five senses), Level א׳ (כיתה א׳).
 *
 * 100% Hebrew by construction: only `multipleChoice` / `trueFalse` / `matchPairs`
 * (no `listen_choose` / `letter_tiles`, which route to the English TTS voice), and
 * every `matchPairs` keeps both sides Hebrew (`leftLang: "he", rightLang: "he"`).
 * Prompts are read aloud by the standard Hebrew TTS path. Emoji are decorative;
 * each answer also carries a Hebrew word so nothing is emoji-only.
 *
 * Curriculum anchor: Israeli MoE "מערכות ותהליכים ביצורים חיים" (the human body /
 * senses), aligned with international Grade-1 "structure & function of organisms"
 * (NGSS 1-LS1) and Sachunterricht "Körper und Gesundheit".
 */
export const scienceDay01: WorkbookDay = {
  id: "day-1",
  dayNumber: 1,
  title: "שִׁעוּר 1: חֲמֵשֶׁת הַחוּשִׁים",
  week: 1,
  objective: "לְהַכִּיר אֶת חֲמֵשֶׁת הַחוּשִׁים וְאֶת הָאֵיבָר שֶׁאַחְרָאִי עַל כָּל חוּשׁ.",
  teachingSummary:
    "הַיּוֹם נַכִּיר אֵיךְ אֲנַחְנוּ מַרְגִּישִׁים אֶת הָעוֹלָם: רוֹאִים בָּעֵינַיִם, שׁוֹמְעִים בָּאָזְנַיִם, מְרִיחִים בָּאַף, טוֹעֲמִים בַּלָּשׁוֹן וְנוֹגְעִים בַּיָּדַיִם.",
  teachingSteps: [
    "קוֹרְאִים אֶת הַשְּׁאֵלָה וּמַקְשִׁיבִים לָהּ.",
    "בּוֹחֲרִים אֶת הַתְּשׁוּבָה הַמַּתְאִימָה.",
    "בַּסּוֹף מַתְאִימִים כָּל חוּשׁ לָאֵיבָר שֶׁלּוֹ.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-1-section-0",
      title: "חִימּוּם: הַחוּשִׁים שֶׁלָּנוּ",
      type: "warmup",
      learningGoal: "לְזַהוֹת אֶת הָאֵיבָר שֶׁמַּתְאִים לְכָל חוּשׁ.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(1, 0, 1, "בְּאֵיזֶה אֵיבָר אֲנַחְנוּ רוֹאִים? 👁️", ["הָעֵינַיִם", "הָאָזְנַיִם", "הָאַף"], "הָעֵינַיִם", [], 1, "concrete"),
        multipleChoice(1, 0, 2, "בְּאֵיזֶה אֵיבָר אֲנַחְנוּ שׁוֹמְעִים? 👂", ["הָאָזְנַיִם", "הָעֵינַיִם", "הַיָּדַיִם"], "הָאָזְנַיִם", [], 1, "concrete"),
        multipleChoice(1, 0, 3, "בְּאֵיזֶה אֵיבָר אֲנַחְנוּ מְרִיחִים? 👃", ["הָאַף", "הַפֶּה", "הָרֶגֶל"], "הָאַף", [], 1, "concrete"),
        multipleChoice(1, 0, 4, "בְּאֵיזֶה אֵיבָר אֲנַחְנוּ טוֹעֲמִים? 👅", ["הַלָּשׁוֹן", "הָאֹזֶן", "הָעַיִן"], "הַלָּשׁוֹן", [], 1, "concrete"),
      ],
    },
    {
      id: "day-1-section-1",
      title: "אֵיךְ אֲנַחְנוּ מַרְגִּישִׁים אֶת הָעוֹלָם",
      type: "verbal",
      learningGoal: "לְהָבִין בְּאֵיזֶה חוּשׁ מִשְׁתַּמְּשִׁים בְּמַצָּבִים שׁוֹנִים.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(1, 1, 1, "כַּמָּה חוּשִׁים יֵשׁ לָנוּ?", ["חֲמִשָּׁה", "שְׁנַיִם", "עֲשָׂרָה"], "חֲמִשָּׁה", [], 1, "abstract"),
        multipleChoice(1, 1, 2, "בְּאֵיזֶה חוּשׁ נִשְׁתַּמֵּשׁ כְּדֵי לָדַעַת אִם הַמָּרָק חַם? 🖐️", ["הַמִּשּׁוּשׁ", "הָרְאִיָּה", "הַשְּׁמִיעָה"], "הַמִּשּׁוּשׁ", [], 2, "abstract"),
        multipleChoice(1, 1, 3, "אֵיזֶה חוּשׁ עוֹזֵר לָנוּ לֵהָנוֹת מֵרֵיחַ שֶׁל פְּרָחִים? 🌸", ["הָרֵיחַ", "הַטַּעַם", "הַשְּׁמִיעָה"], "הָרֵיחַ", [], 2, "abstract"),
        trueFalse(1, 1, 4, "הַאִם בָּעֵינַיִם אֲנַחְנוּ רוֹאִים?", true, [], 1, "abstract"),
        trueFalse(1, 1, 5, "הַאִם בָּאָזְנַיִם אֲנַחְנוּ טוֹעֲמִים אֹכֶל?", false, [], 2, "abstract"),
      ],
    },
    {
      id: "day-1-section-2",
      title: "חֲזָרָה",
      type: "review",
      learningGoal: "לַחֲזוֹר עַל הַחוּשִׁים וְהָאֵיבָרִים שֶׁל הַיּוֹם.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(1, 2, 1, "בְּאֵיזֶה חוּשׁ שׁוֹמְעִים מוּזִיקָה? 🎵", ["הַשְּׁמִיעָה", "הָרְאִיָּה", "הַטַּעַם"], "הַשְּׁמִיעָה", [], 1, "abstract"),
        trueFalse(1, 2, 2, "הַאִם הַלָּשׁוֹן עוֹזֶרֶת לָנוּ לִטְעֹם?", true, [], 1, "abstract"),
        multipleChoice(1, 2, 3, "בְּאֵיזֶה אֵיבָר נִגַּע כְּדֵי לָדַעַת אִם מַשֶּׁהוּ רַךְ אוֹ קָשֶׁה? 🖐️", ["הַיָּדַיִם", "הָאַף", "הָעֵינַיִם"], "הַיָּדַיִם", [], 2, "abstract"),
        trueFalse(1, 2, 4, "הַאִם יֵשׁ לָנוּ שִׁבְעָה חוּשִׁים?", false, [], 2, "abstract"),
        multipleChoice(1, 2, 5, "אֵיזֶה חוּשׁ עוֹזֵר לָנוּ לָדַעַת שֶׁהָעוּגָה מְתוּקָה? 🍰", ["הַטַּעַם", "הַשְּׁמִיעָה", "הָרְאִיָּה"], "הַטַּעַם", [], 2, "abstract"),
        matchPairs(
          1,
          2,
          6,
          "הַתְאִימוּ כָּל חוּשׁ לָאֵיבָר שֶׁלּוֹ:",
          [
            { left: "רְאִיָּה", right: "עַיִן" },
            { left: "שְׁמִיעָה", right: "אֹזֶן" },
            { left: "רֵיחַ", right: "אַף" },
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
