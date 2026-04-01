import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 7,
  title: "כֶּפֶל — 4 וְ-5",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַזְכִּיר טַבְלָאוֹת 4 וְ-5 בִּמְשִׂימוֹת קְצָרוֹת.",
  mainTags: ["multiplication-tables", "multiplication-intro"],
  spiralReviewTags: ["multiplication-tables", "number-line"],
  arithmeticPrompt: "חַשְּׁבוּ 9 + 9 + 9 + 9 (אַרְבַּע פְּעָמִים תֵּשַׁע)",
  arithmeticAnswer: 36,
  arithmeticMcOptions: ["32", "36", "40"],
  arithmeticMcAnswer: "36",
  languagePrompt: "בִּחְרוּ: 4 פְּעָמִים חָמֵשׁ שָׁווֶה לְ-?",
  languageOptions: ["עֶשְׂרִים", "חֲמֵשׁ עֶשְׂרֵה", "עֶשְׂרִים וְחָמֵשׁ"],
  languageAnswer: "עֶשְׂרִים",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 5 × 6 = 30",
  reviewAnswer: true,
  challengePrompt: "בְּכָל שׁוּרָה 5 כִּסְאוֹת. 7 שׁוּרוֹת. כַּמָּה כִּסְאוֹת?",
  challengeAnswer: 35,
};
