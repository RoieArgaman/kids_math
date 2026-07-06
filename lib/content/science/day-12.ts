import { matchPairs, multipleChoice, trueFalse } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/**
 * Science Day 12 — "מַחְזוֹרֵי חַיִּים וַהֲגַנָּה עַצְמִית" (life cycles & self-defense),
 * Level ב׳ (כיתה ב׳), advanced.
 *
 * 100% Hebrew with niqqud; only `multipleChoice` / `trueFalse` / `matchPairs`, with
 * `matchPairs` kept Hebrew on both sides (`leftLang: "he", rightLang: "he"`). Emoji are
 * decorative; every answer also carries a Hebrew word so nothing is emoji-only.
 *
 * Curriculum anchor: Israeli MoE "עולם החי" (the animal world) — full life cycles
 * (butterfly, frog), animal self-defense strategies, and comparing two animals.
 */
export const scienceDay12: WorkbookDay = {
  id: "day-12",
  dayNumber: 12,
  title: "שִׁעוּר 12: מַחְזוֹרֵי חַיִּים וַהֲגַנָּה עַצְמִית",
  week: 4,
  objective:
    "לְסַדֵּר מַחְזוֹרֵי חַיִּים שְׁלֵמִים, לְהַתְאִים חַיּוֹת לְאֶמְצַעֵי הֲגַנָּה, וּלְהַשְׁווֹת בֵּין שְׁתֵּי חַיּוֹת.",
  teachingSummary:
    "הַיּוֹם נִלְמַד אֵיךְ פַּרְפָּר גָּדֵל: בֵּיצָה, זַחַל, גֹּלֶם וְאָז פַּרְפָּר, וְאֵיךְ צְפַרְדֵּעַ גְּדֵלָה: בֵּיצָה, רֹאשָׁן וְאָז צְפַרְדֵּעַ. נַכִּיר גַּם אֵיךְ חַיּוֹת מִתְגּוֹנְנוֹת מֵאוֹיְבִים, וְנַשְׁוֶה בֵּין כֶּלֶב לִזְאֵב.",
  teachingSteps: [
    "חוֹשְׁבִים עַל הַסֵּדֶר שֶׁל שְׁלָבֵי הַגְּדִילָה.",
    "בּוֹחֲרִים אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
    "בַּסּוֹף מַתְאִימִים כָּל חַיָּה לְאֶמְצַעִי הַהֲגַנָּה שֶׁלָּהּ.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-12-section-0",
      title: "חִימּוּם: מַחְזוֹר הַחַיִּים שֶׁל הַפַּרְפָּר",
      type: "warmup",
      learningGoal: "לְזַהוֹת אֶת סֵדֶר הַשְּׁלָבִים בַּגְּדִילָה שֶׁל פַּרְפָּר.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(12, 0, 1, "מָה בָּא רִאשׁוֹן בַּמַּחְזוֹר שֶׁל הַפַּרְפָּר? 🦋", ["בֵּיצָה", "פַּרְפָּר", "גֹּלֶם"], "בֵּיצָה", [], 1, "concrete"),
        multipleChoice(12, 0, 2, "מָה יוֹצֵא מֵהַבֵּיצָה? 🐛", ["זַחַל", "פַּרְפָּר", "גֹּלֶם"], "זַחַל", [], 1, "concrete"),
        multipleChoice(12, 0, 3, "לְמָה הוֹפֵךְ הַגֹּלֶם? 🦋", ["פַּרְפָּר", "בֵּיצָה", "זַחַל"], "פַּרְפָּר", [], 1, "concrete"),
        multipleChoice(12, 0, 4, "מָה בָּא אַחֲרֵי הַזַּחַל? 🐛", ["גֹּלֶם", "בֵּיצָה", "פַּרְפָּר"], "גֹּלֶם", [], 2, "concrete"),
      ],
    },
    {
      id: "day-12-section-1",
      title: "מַחְזוֹר הַחַיִּים שֶׁל הַצְּפַרְדֵּעַ",
      type: "verbal",
      learningGoal: "לְהָבִין אֶת סֵדֶר הַשְּׁלָבִים בַּגְּדִילָה שֶׁל צְפַרְדֵּעַ.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(12, 1, 1, "מָה בָּא רִאשׁוֹן בַּמַּחְזוֹר שֶׁל הַצְּפַרְדֵּעַ? 🐸", ["בֵּיצָה", "צְפַרְדֵּעַ", "רֹאשָׁן"], "בֵּיצָה", [], 2, "abstract"),
        multipleChoice(12, 1, 2, "מָה יוֹצֵא מֵהַבֵּיצָה שֶׁל הַצְּפַרְדֵּעַ? 🐸", ["רֹאשָׁן", "פַּרְפָּר", "צְפַרְדֵּעַ"], "רֹאשָׁן", [], 2, "abstract"),
        multipleChoice(12, 1, 3, "הָרֹאשָׁן חַי בַּ...? 💧", ["מַיִם", "אֲוִיר", "אֵשׁ"], "מַיִם", [], 2, "abstract"),
        multipleChoice(12, 1, 4, "לְמָה הוֹפֵךְ הָרֹאשָׁן בַּסּוֹף? 🐸", ["צְפַרְדֵּעַ", "בֵּיצָה", "פַּרְפָּר"], "צְפַרְדֵּעַ", [], 2, "abstract"),
        trueFalse(12, 1, 5, "הַאִם הָרֹאשָׁן הוֹפֵךְ לִצְפַרְדֵּעַ?", true, [], 2, "abstract"),
      ],
    },
    {
      id: "day-12-section-2",
      title: "חֲזָרָה",
      type: "review",
      learningGoal: "לַחֲזוֹר עַל הֲגַנָּה עַצְמִית שֶׁל חַיּוֹת וְעַל הַשְׁוָואָה בֵּין חַיּוֹת.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(12, 2, 1, "אֵיךְ מִתְגּוֹנֵן הַקִּפּוֹד מֵאוֹיְבִים? 🦔", ["בְּקוֹצִים", "בִּמְהִירוּת", "בְּהַסְוָואָה"], "בְּקוֹצִים", [], 2, "abstract"),
        multipleChoice(12, 2, 2, "אֵיךְ מִסְתַּתֶּרֶת הַזִּקִּית מֵאוֹיְבִים? 🦎", ["מְשַׁנָּה צֶבַע", "רָצָה מַהֵר", "בְּקוֹצִים"], "מְשַׁנָּה צֶבַע", [], 3, "abstract"),
        multipleChoice(12, 2, 3, "אֵיךְ בּוֹרֵחַ הַצְּבִי מֵאוֹיְבִים? 🦌", ["רָץ מַהֵר", "מְשַׁנֶּה צֶבַע", "בְּקוֹצִים"], "רָץ מַהֵר", [], 2, "abstract"),
        trueFalse(12, 2, 4, "הַאִם כֶּלֶב הוּא חַיַּת בַּיִת וּזְאֵב הוּא חַיַּת בָּר? 🐕🐺", true, [], 2, "abstract"),
        multipleChoice(12, 2, 5, "מָה דּוֹמֶה בֵּין כֶּלֶב לִזְאֵב? 🐕", ["שְׁנֵיהֶם יוֹנְקִים", "שְׁנֵיהֶם עָפִים", "שְׁנֵיהֶם דָּגִים"], "שְׁנֵיהֶם יוֹנְקִים", [], 3, "abstract"),
        matchPairs(
          12,
          2,
          6,
          "הַתְאִימוּ כָּל חַיָּה לְאֶמְצַעִי הַהֲגַנָּה שֶׁלָּהּ:",
          [
            { left: "קִפּוֹד", right: "קוֹצִים" },
            { left: "זִקִּית", right: "הַסְוָואָה" },
            { left: "צְבִי", right: "מְהִירוּת" },
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
