import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 9,
  title: "דְּפוּסִים, זוּגִי וְאִי-זוּגִי",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְהַשְׁלִים סִדְרוֹת מִסְפָּרִיּוֹת וּלְזַהוֹת מִסְפָּרִים זוּגִיִּים וְאִי-זוּגִיִּים עַד 20 בְּ-4 מִתּוֹךְ 5 מְשִׂימוֹת.",
  mainTags: ["patterns", "number-line"],
  spiralReviewTags: ["geometry-shapes", "word-problems"],
  arithmeticPrompt: "הַשְׁלִימוּ אֶת הַסִּדְרָה הַזּוּגִית: 2, 4, 6, __",
  arithmeticAnswer: 8,
  arithmeticMcOptions: ["7", "8", "10"],
  arithmeticMcAnswer: "8",
  languagePrompt: "בִּחְרוּ: אֵיךְ כּוֹתְבִים בְּעִבְרִית אֶת הַמִּסְפָּר 14?",
  languageOptions: ["שְׁלוֹשׁ עֶשְׂרֵה", "אַרְבַּע עֶשְׂרֵה", "חֲמֵשׁ עֶשְׂרֵה"],
  languageAnswer: "אַרְבַּע עֶשְׂרֵה",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: הַמִּסְפָּר 6 הוּא זוּגִי (אֶפְשָׁר לְחַלְּקוֹ לִשְׁתֵּי קְבוּצוֹת שָׁווֹת)",
  reviewAnswer: true,
  challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-5 עַד 15 בִּקְפִיצוֹת שֶׁל 5. שִׂימוּ לֵב — אֵלּוּ מִסְפָּרִים אִי-זוּגִיִּים! כַּמָּה קְפִיצוֹת?",
  challengeAnswer: 2,
};
