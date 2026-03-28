import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 19,
  title: "חִלּוּק לִשְׁלוֹשׁ קְבוּצוֹת",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְחַלֵּק כַּמּוּת לִשְׁלוֹשׁ קְבוּצוֹת שָׁווֹת (בְּתוֹךְ טַבִּית הַכֶּפֶל).",
  mainTags: ["division-equal-groups", "multiplication-tables"],
  spiralReviewTags: ["multiplication-tables", "fractions-parts"],
  arithmeticPrompt: "21 דָּגִימוֹת חִילְּקוּ לִשָׁלוֹשׁ קְבוּצוֹת שָׁווֹת. כַּמָּה בְּכָל קְבוּצָה?",
  arithmeticAnswer: 7,
  arithmeticMcOptions: ["6", "7", "8"],
  arithmeticMcAnswer: "7",
  verbalPrompt: "כִּתְבוּ: אִם 3 × 5 = 15, מָה 15 חִלּוּק לִשְׁלוֹשׁ?",
  verbalAnswer: "חָמֵשׁ",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 12 חִלּוּק לִשְׁלוֹשׁ שָׁוֶה לְ-4",
  reviewAnswer: true,
  challengePrompt: "תּוֹקְפִים 6 שׁוּרוֹת בִּכְתִיבָה. בְּכָל שׁוּרָה 7 אוֹתִיּוֹת. כַּמָּה אוֹתִיּוֹת?",
  challengeAnswer: 42,
};
