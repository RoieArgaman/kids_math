import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 17,
  title: "תִרְגּוּל: אֹרֶךְ וְחִיבּוּר ס״מ",
  objective:
    "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִתְרַגֵּל בְּחִיבּוּר אֹרְכִים בְּס״מ וְיִקְשֹׁר לִסְפִירָה.",
  mainTags: ["measurement-length", "addition"],
  spiralReviewTags: ["measurement-length", "counting"],
  arithmeticPrompt: "קִטְעַי ס״מ: אֶחָד בְּאֹרֶךְ 4 ס״מ וְעוֹד אֶחָד 5 ס״מ. כַּמָּה ס״מ בַּסַּךְ?",
  arithmeticAnswer: 9,
  arithmeticMcOptions: ["8", "9", "10"],
  arithmeticMcAnswer: "9",
  verbalPrompt: "כִּתְבוּ בִּמִילִים: כַּמָּה ס״מ בִּשְׁנֵי סַרְגְּלִים שֶׁל 6 ס״מ כָּל אֶחָד?",
  verbalAnswer: "שְׁתֵּים עֶשְׂרֵה",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 10 ס״מ + 10 ס״מ = 20 ס״מ",
  reviewAnswer: true,
  challengePrompt: "שְׁלוֹשָׁה קְטַעִים שֶׁל 3 ס״מ זֶה אַחַר זֶה — כַּמָּה ס״מ בַּסַּךְ?",
  challengeAnswer: 9,
  geometryPrompt: "אֵיזוֹ צוּרָה נִרְאֵית עֲגֻלָּה וְאֵין לָהּ פִּנּוֹת?",
  geometryAnswer: "circle",
};
