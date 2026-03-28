import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 13,
  title: "מִשְׁקָל פָּשׁוּט",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַשְׁוֶה וִיסַכֵּם מִשְׁקָלִים בִּקְ״ג פָּשׁוּט.",
  mainTags: ["measurement-weight", "comparing"],
  spiralReviewTags: ["measurement-area", "addition"],
  arithmeticPrompt: "חֲבִילָה 3 ק״ג וְחֲבִילָה 5 ק״ג — מִי כָּבֶד יוֹתֵר? כִּתְבוּ אֶת הַמִּסְפָּר הַכָּבֶד.",
  arithmeticAnswer: 5,
  arithmeticMcOptions: ["3", "5", "8"],
  arithmeticMcAnswer: "5",
  verbalPrompt: "כִּתְבוּ: 2 ק״ג וְעוֹד 2 ק״ג — כַּמָּה ק״ג?",
  verbalAnswer: "אַרְבַּע",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: ק״ג מִשְׁתַּמֵּשׁ לִמְשׁקָל",
  reviewAnswer: true,
  challengePrompt: "3 קֻפְסָאוֹת שׁוֹקְלוֹת 4 ק״ג כָּל אַחַת. כַּמָּה ק״ג בַּסַּךְ?",
  challengeAnswer: 12,
};
