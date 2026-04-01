import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 18,
  title: "תִּרְגּוּל כֶּפֶל",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְחַזֵּק כֶּפֶל קָצָר בְּחִשּׁוּב רְצִיף.",
  mainTags: ["multiplication-tables", "number-bonds"],
  spiralReviewTags: ["word-problems", "division-equal-groups"],
  arithmeticPrompt: "חַשְּׁבוּ 8 × 4",
  arithmeticAnswer: 32,
  arithmeticMcOptions: ["28", "32", "36"],
  arithmeticMcAnswer: "32",
  languagePrompt: "בִּחְרוּ: מָה הַתּוֹצָאָה שֶׁל 10 × 3?",
  languageOptions: ["שְׁלוֹשִׁים", "עֶשְׂרִים", "אַרְבָּעִים"],
  languageAnswer: "שְׁלוֹשִׁים",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 7 × 2 = 7 + 7",
  reviewAnswer: true,
  challengePrompt: "בְּכָל קֻפְסָה 6 טושִׁים. 9 קֻפְסָאוֹת. כַּמָּה טושִׁים?",
  challengeAnswer: 54,
};
