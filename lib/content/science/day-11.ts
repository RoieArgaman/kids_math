import { matchPairs, multipleChoice, trueFalse } from "@/lib/content/engine/exercise-factories";
import type { WorkbookDay } from "@/lib/types";

/**
 * Science Day 11 — "מַחֲזוֹר הַחַיִּים שֶׁל הַצֶּמַח" (plant life cycle), Level ב׳ (כיתה ב׳).
 *
 * First lesson of the Level ב׳ scaffold. 100% Hebrew with niqqud; only
 * `multipleChoice` / `trueFalse` / `matchPairs`, with `matchPairs` kept Hebrew on
 * both sides (`leftLang: "he", rightLang: "he"`).
 *
 * Curriculum anchor: Israeli MoE "מערכות ותהליכים ביצורים חיים" (life cycles),
 * aligned with NGSS 2-LS — simple ordered stages, concrete & observational.
 */
export const scienceDay11: WorkbookDay = {
  id: "day-11",
  dayNumber: 11,
  title: "שִׁעוּר 11: מַחֲזוֹר הַחַיִּים שֶׁל הַצֶּמַח",
  week: 3,
  objective: "לְהָבִין אֶת הַשְּׁלָבִים שֶׁבָּהֶם צֶמַח גָּדֵל מִזֶּרַע עַד פֶּרַח.",
  teachingSummary:
    "הַיּוֹם נִלְמַד אֵיךְ צֶמַח גָּדֵל: קֹדֶם זוֹרְעִים זֶרַע בָּאֲדָמָה, הוּא מְקַבֵּל מַיִם וְשֶׁמֶשׁ, נַבָּט קָטָן יוֹצֵא, וְאַחַר כָּךְ הַצֶּמַח גָּדֵל וּמוֹצִיא פֶּרַח.",
  teachingSteps: [
    "חוֹשְׁבִים מָה צָרִיךְ זֶרַע כְּדֵי לִנְבֹּט.",
    "בּוֹחֲרִים אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
    "בַּסּוֹף מְסַדְּרִים אֶת שְׁלָבֵי הַגְּדִילָה.",
  ],
  spiralReviewTags: [],
  unlockThresholdPercent: 100,
  sections: [
    {
      id: "day-11-section-0",
      title: "חִימּוּם: מִזֶּרַע לְצֶמַח",
      type: "warmup",
      learningGoal: "לְזַהוֹת אֶת הַשָּׁלָב הָרִאשׁוֹן בַּגְּדִילָה שֶׁל צֶמַח.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(11, 0, 1, "מִמָּה מַתְחִיל לִגְדֹּל צֶמַח חָדָשׁ? 🌱", ["מִזֶּרַע", "מֵאֶבֶן", "מִפְּלַסְטִיק"], "מִזֶּרַע", [], 1, "concrete"),
        multipleChoice(11, 0, 2, "אֵיפֹה זוֹרְעִים אֶת הַזֶּרַע?", ["בָּאֲדָמָה", "בָּאֲוִיר", "בָּאֵשׁ"], "בָּאֲדָמָה", [], 1, "concrete"),
        multipleChoice(11, 0, 3, "מָה צָרִיךְ הַזֶּרַע כְּדֵי לִנְבֹּט? 💧☀️", ["מַיִם וְשֶׁמֶשׁ", "סֻכָּר", "אֲבָנִים"], "מַיִם וְשֶׁמֶשׁ", [], 1, "concrete"),
        multipleChoice(11, 0, 4, "אֵיךְ קוֹרְאִים לַצֶּמַח הַקָּטָן שֶׁיּוֹצֵא מֵהַזֶּרַע? 🌱", ["נֶבֶט", "פְּרִי", "שֹׁרֶשׁ בִּלְבַד"], "נֶבֶט", [], 2, "concrete"),
      ],
    },
    {
      id: "day-11-section-1",
      title: "שְׁלָבֵי הַגְּדִילָה",
      type: "verbal",
      learningGoal: "לְהָבִין אֶת הַסֵּדֶר שֶׁל שְׁלָבֵי הַגְּדִילָה.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(11, 1, 1, "מָה קוֹרֶה אַחֲרֵי שֶׁהַזֶּרַע נוֹבֵט?", ["צוֹמֵחַ נֶבֶט קָטָן", "הַזֶּרַע נֶעֱלָם", "נִהְיֶה אֶבֶן"], "צוֹמֵחַ נֶבֶט קָטָן", [], 2, "abstract"),
        multipleChoice(11, 1, 2, "מָה מוֹצִיא הַצֶּמַח כְּשֶׁהוּא גָּדֵל וּמִתְחַזֵּק? 🌸", ["פֶּרַח", "אֶבֶן", "בַּרְזֶל"], "פֶּרַח", [], 1, "abstract"),
        multipleChoice(11, 1, 3, "אֵיזֶה חֵלֶק יוֹצֵא רִאשׁוֹן וְקוֹלֵט מַיִם מֵהָאֲדָמָה?", ["הַשֹּׁרֶשׁ", "הַפֶּרַח", "הַפְּרִי"], "הַשֹּׁרֶשׁ", [], 2, "abstract"),
        trueFalse(11, 1, 4, "הַאִם זֶרַע צָרִיךְ מַיִם כְּדֵי לִנְבֹּט?", true, [], 1, "abstract"),
        trueFalse(11, 1, 5, "הַאִם צֶמַח גָּדֵל מִפֶּרַח לְזֶרַע וְאָז נֶעֱלָם מִיָּד?", false, [], 2, "abstract"),
      ],
    },
    {
      id: "day-11-section-2",
      title: "חֲזָרָה",
      type: "review",
      learningGoal: "לַחֲזוֹר עַל מַחֲזוֹר הַחַיִּים שֶׁל הַצֶּמַח.",
      prerequisiteSkillTags: [],
      exercises: [
        multipleChoice(11, 2, 1, "מָה הַשָּׁלָב הָרִאשׁוֹן בַּגְּדִילָה שֶׁל צֶמַח?", ["זֶרַע", "פֶּרַח", "פְּרִי"], "זֶרַע", [], 1, "abstract"),
        trueFalse(11, 2, 2, "הַאִם צֶמַח צָרִיךְ שֶׁמֶשׁ כְּדֵי לִגְדֹּל?", true, [], 1, "abstract"),
        multipleChoice(11, 2, 3, "מָה צָרִיךְ לָתֵת לַצֶּמַח כָּל יוֹם כְּדֵי שֶׁיִּגְדַּל? 💧", ["מַיִם", "חוֹל", "פְּלַסְטִיק"], "מַיִם", [], 1, "abstract"),
        trueFalse(11, 2, 4, "הַאִם נֶבֶט הוּא צֶמַח קָטָן שֶׁיָּצָא מֵהַזֶּרַע?", true, [], 2, "abstract"),
        multipleChoice(11, 2, 5, "מָה מוֹפִיעַ בַּסּוֹף, אַחֲרֵי הַנֶּבֶט וְהֶעָלִים? 🌸", ["פֶּרַח", "אֶבֶן", "עָנָן"], "פֶּרַח", [], 2, "abstract"),
        matchPairs(
          11,
          2,
          6,
          "הַתְאִימוּ כָּל שָׁלָב לַתֵּאוּר שֶׁלּוֹ:",
          [
            { left: "זֶרַע", right: "הַהַתְחָלָה בָּאֲדָמָה" },
            { left: "נֶבֶט", right: "צֶמַח קָטָן רִאשׁוֹן" },
            { left: "פֶּרַח", right: "מוֹפִיעַ בַּסּוֹף" },
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
