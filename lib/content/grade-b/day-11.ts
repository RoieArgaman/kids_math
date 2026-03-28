import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 11,
  title: "מִדִּידַת אֹרֶךְ",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְסַכֵּם אֹרְכִים בְּס״מ פָּשׁוּט.",
  mainTags: ["measurement-length", "addition"],
  spiralReviewTags: ["patterns", "place-value"],
  arithmeticPrompt: "קֶפֶץ אָרֹךְ 24 ס״מ וְעוֹד 15 ס״מ. כַּמָּה ס״מ בַּסַּךְ?",
  arithmeticAnswer: 39,
  arithmeticMcOptions: ["37", "39", "41"],
  arithmeticMcAnswer: "39",
  verbalPrompt: "כִּתְבוּ: אֵיזוֹ יְחִידָה מַתְאִימָה לְאֹרֶךְ דֶּף?",
  verbalAnswer: "ס״מ",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 1 מֶטֶר = 10 ס״מ",
  reviewAnswer: false,
  challengePrompt: "שְׁנֵי קְטָעִים: אֶחָד 30 ס״מ וְשֵׁנִי 45 ס״מ. כַּמָּה בַּסַּךְ?",
  challengeAnswer: 75,
};
