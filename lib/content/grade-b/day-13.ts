import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 13,
  title: "מִשְׁקָל פָּשׁוּט",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַשְׁוֶה וִיסַכֵּם מִשְׁקָלִים בִּקְ״ג פָּשׁוּט.",
  mainTags: ["measurement-weight", "comparing"],
  spiralReviewTags: ["measurement-area", "addition"],
  arithmeticPrompt: "חֲבִילָה שֶׁל 3 ק״ג וַחֲבִילָה שֶׁל 5 ק״ג — מִי כְּבֵדָה יוֹתֵר? כִּתְבוּ אֶת הַמִּסְפָּר הַגָּדוֹל יוֹתֵר.",
  arithmeticAnswer: 5,
  arithmeticMcOptions: ["3", "5", "8"],
  arithmeticMcAnswer: "5",
  languagePrompt: "בַּחֲרוּ: 2 ק״ג וְעוֹד 2 ק״ג — כַּמָּה ק״ג?",
  languageOptions: ["אַרְבַּע", "שְׁנַיִם", "שֵׁשׁ"],
  languageAnswer: "אַרְבַּע",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: מוֹדְדִים מִשְׁקָל בְּק״ג",
  reviewAnswer: true,
  challengePrompt: "3 קֻפְסָאוֹת שׁוֹקְלוֹת 4 ק״ג כָּל אַחַת. כַּמָּה ק״ג בַּסַּךְ?",
  challengeAnswer: 12,
};
