import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 6,
  title: "כֶּפֶל כַּחִזּוּר — 2 וְ-3",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְתַרְגֵּל כֶּפֶל 2 וְ-3 כַּחִיבּוּר חוֹזֵר.",
  mainTags: ["multiplication-tables", "multiplication-intro"],
  spiralReviewTags: ["addition", "patterns"],
  arithmeticPrompt: "חַשְּׁבוּ 7 + 7 + 7 (שָׁלוֹשׁ פְּעָמִים שִׁבְעָה)",
  arithmeticAnswer: 21,
  arithmeticMcOptions: ["14", "21", "24"],
  arithmeticMcAnswer: "21",
  languagePrompt: "בִּחְרוּ: 5 פְּעָמִים 2 שָׁווֶה לְ-?",
  languageOptions: ["עֶשֶׂר", "שְׁמוֹנֶה", "שְׁנֵים עָשָׂר"],
  languageAnswer: "עֶשֶׂר",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 3 × 4 = 12",
  reviewAnswer: true,
  challengePrompt: "בְּכָל קַעֲרָה 8 תַּפּוּחִים. 3 קְעָרוֹת. כַּמָּה תַּפּוּחִים?",
  challengeAnswer: 24,
};
