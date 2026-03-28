import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 28,
  title: "סִיכּוּם לִפְנֵי הַמִּבְחָן",
  objective:
    "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַרְגִּישׁ בִּטָּחוֹן בְּחִיבּוּר, חִיסּוּר, מִסְפָּרִים עַד 100 וּבְעָיוֹת קְצָרוֹת.",
  mainTags: ["addition", "subtraction", "word-problems", "place-value"],
  spiralReviewTags: ["geometry-shapes", "measurement-length", "patterns", "number-line"],
  arithmeticPrompt: "חֲנוּת מָכְרָה 35 עוּגִיּוֹת בַּבֹּקֶר וְ-40 נוֹסָפוֹת בַּמָּשֵׁךְ הַיּוֹם. כַּמָּה בַּסַּךְ?",
  arithmeticAnswer: 75,
  arithmeticMcOptions: ["65", "75", "85"],
  arithmeticMcAnswer: "75",
  verbalPrompt: "כִּתְבוּ בִּמִילִים: 65",
  verbalAnswer: "שִׁשִּׁים וְחָמֵשׁ",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 10 עֲשָׂרוֹת הֵן 100",
  reviewAnswer: true,
  challengePrompt: "מִ-100 יוֹרְדִים 25 וְאַחַר כָּךְ עוֹד 15. כַּמָּה נִשְׁאַר?",
  challengeAnswer: 60,
  geometryPrompt: "אֵיזוֹ צוּרָה מַזְכִּירָה טְבַעַת?",
  geometryAnswer: "circle",
};
