import { matchPairs, multipleChoice, trueFalse } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/**
 * Science Day 7 — "חֳמָרִים וּתְכוּנוֹתֵיהֶם" (materials & properties), Level א׳ (כיתה א׳).
 *
 * 100% Hebrew by construction: only `multipleChoice` / `trueFalse` / `matchPairs`,
 * with every `matchPairs` kept Hebrew on both sides (`leftLang: "he", rightLang: "he"`).
 * Emoji are decorative; each answer also carries a Hebrew word so nothing is emoji-only.
 *
 * Curriculum anchor: Israeli MoE "חומרים" — sorting materials by properties and the
 * three states of matter, aligned with NGSS 2-PS1 / Grade-1 physical science.
 */
export const scienceDay07: WorkbookDay = {
  id: "day-7",
  dayNumber: 7,
  title: "שִׁעוּר 7: חֳמָרִים וּתְכוּנוֹתֵיהֶם",
  week: 2,
  objective: "לְמַיֵּן חֳמָרִים לְפִי תְּכוּנוֹתֵיהֶם וּלְהַכִּיר אֶת שְׁלוֹשֶׁת מַצְּבֵי הַצְּבִירָה.",
  teachingSummary:
    "הַיּוֹם נִלְמַד עַל חֳמָרִים: יֵשׁ חֳמָרִים קָשִׁים וְרַכִּים, כְּבֵדִים וְקַלִּים. נַכִּיר שְׁלוֹשָׁה מַצְּבֵי צְבִירָה: מוּצָק, נוֹזֵל וְגָז.",
  teachingSteps: [
    "מִסְתַּכְּלִים עַל הַחֹמֶר וְחוֹשְׁבִים עַל הַתְּכוּנָה שֶׁלּוֹ.",
    "בּוֹחֲרִים אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
    "בַּסּוֹף מַתְאִימִים כָּל חֹמֶר לְמַצַּב הַצְּבִירָה שֶׁלּוֹ.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-7-section-0",
      title: "חִימּוּם: קָשֶׁה וְרַךְ, כָּבֵד וְקַל",
      type: "warmup",
      learningGoal: "לְזַהוֹת תְּכוּנוֹת פְּשׁוּטוֹת שֶׁל חֳמָרִים.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(7, 0, 1, "הָאֶבֶן הִיא חֹמֶר... 🪨", ["קָשֶׁה", "רַךְ", "נוֹזֵל"], "קָשֶׁה", [], 1, "concrete"),
        multipleChoice(7, 0, 2, "הַכָּרִית הִיא... 🛏️", ["רַכָּה", "קָשָׁה", "כְּבֵדָה מְאוֹד"], "רַכָּה", [], 1, "concrete"),
        multipleChoice(7, 0, 3, "הַפִּיל הוּא בַּעַל חַיִּים... 🐘", ["כָּבֵד", "קַל", "רַךְ"], "כָּבֵד", [], 1, "concrete"),
        multipleChoice(7, 0, 4, "הַנּוֹצָה הִיא... 🪶", ["קַלָּה", "כְּבֵדָה", "קָשָׁה"], "קַלָּה", [], 1, "concrete"),
      ],
    },
    {
      id: "day-7-section-1",
      title: "מַצְּבֵי הַצְּבִירָה",
      type: "verbal",
      learningGoal: "לְהַכִּיר מוּצָק, נוֹזֵל וְגָז וּתְכוּנוֹת שֶׁל חֳמָרִים.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(7, 1, 1, "בְּאֵיזֶה מַצַּב צְבִירָה נִמְצָאִים הָאֶבֶן וְהַקֶּרַח? 🧊", ["מוּצָק", "נוֹזֵל", "גָּז"], "מוּצָק", [], 2, "abstract"),
        multipleChoice(7, 1, 2, "בְּאֵיזֶה מַצַּב צְבִירָה נִמְצָאִים הַמַּיִם? 💧", ["נוֹזֵל", "מוּצָק", "גָּז"], "נוֹזֵל", [], 2, "abstract"),
        multipleChoice(7, 1, 3, "בְּאֵיזֶה מַצַּב צְבִירָה נִמְצָא הָאֲוִיר? 💨", ["גָּז", "נוֹזֵל", "מוּצָק"], "גָּז", [], 2, "abstract"),
        multipleChoice(7, 1, 4, "מָה קוֹרֶה לְחֲתִיכַת עֵץ שֶׁשָּׂמִים בַּמַּיִם? 🪵", ["צָפָה", "שׁוֹקַעַת", "נֶעֱלֶמֶת"], "צָפָה", [], 2, "abstract"),
        multipleChoice(7, 1, 5, "דֶּרֶךְ אֵיזֶה חֹמֶר אֶפְשָׁר לִרְאוֹת? 🪟", ["זְכוּכִית שְׁקוּפָה", "קִיר אָטוּם", "עֵץ עָבֶה"], "זְכוּכִית שְׁקוּפָה", [], 2, "abstract"),
      ],
    },
    {
      id: "day-7-section-2",
      title: "חֲזָרָה",
      type: "review",
      learningGoal: "לַחֲזוֹר עַל חֳמָרִים וּמַצְּבֵי צְבִירָה.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(7, 2, 1, "בְּאֵיזֶה פַּח זוֹרְקִים בַּקְבּוּק פְּלַסְטִיק? ♻️", ["פַּח פְּלַסְטִיק", "פַּח נְיָר", "פַּח זְכוּכִית"], "פַּח פְּלַסְטִיק", [], 2, "abstract"),
        trueFalse(7, 2, 2, "הַאִם הָאֶבֶן שׁוֹקַעַת בַּמַּיִם?", true, [], 1, "abstract"),
        multipleChoice(7, 2, 3, "בְּאֵיזֶה פַּח זוֹרְקִים עִתּוֹן יָשָׁן מִנְּיָר? 📰", ["פַּח נְיָר", "פַּח פְּלַסְטִיק", "פַּח מַתֶּכֶת"], "פַּח נְיָר", [], 2, "abstract"),
        trueFalse(7, 2, 4, "הַאִם הַזְּכוּכִית הִיא חֹמֶר שָׁקוּף שֶׁאֶפְשָׁר לִרְאוֹת דַּרְכּוֹ?", true, [], 2, "abstract"),
        trueFalse(7, 2, 5, "הַאִם הַמַּיִם הֵם חֹמֶר מוּצָק?", false, [], 2, "abstract"),
        matchPairs(
          7,
          2,
          6,
          "הַתְאִימוּ כָּל חֹמֶר לְמַצַּב הַצְּבִירָה שֶׁלּוֹ:",
          [
            { left: "קֶרַח", right: "מוּצָק" },
            { left: "מַיִם", right: "נוֹזֵל" },
            { left: "אֲוִיר", right: "גָּז" },
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
