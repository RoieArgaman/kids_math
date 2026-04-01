import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 8,
  title: "צוּרוֹת וְגוּפִים בְּסִיסִיִּים",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְזַהוֹת עִיגּוּל, רִיבּוּעַ, מְשֻׁלָּשׁ וּמַלְבֵּן וּלְתָאֵר תְּכוּנָה אַחַת שֶׁל כָּל צוּרָה בְּ-80% הַצְלָחָה.",
  mainTags: ["geometry-shapes", "comparing"],
  spiralReviewTags: ["word-problems", "addition"],
  arithmeticPrompt: "לְכָל מְשֻׁלָּשׁ יֵשׁ 3 צְלָעוֹת. אִם יֵשׁ לָנוּ שְׁנֵי מְשֻׁלָּשִׁים, כַּמָּה צְלָעוֹת יֵשׁ בַּסַּךְ הַכֹּל?",
  arithmeticAnswer: 6,
  arithmeticMcOptions: ["5", "6", "7"],
  arithmeticMcAnswer: "6",
  languagePrompt: "בִּחְרוּ: אֵיךְ כּוֹתְבִים בְּעִבְרִית אֶת הַמִּסְפָּר 6?",
  languageOptions: ["חָמֵשׁ", "שֵׁשׁ", "שֶׁבַע"],
  languageAnswer: "שֵׁשׁ",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: לְכָל מַלְבֵּן יֵשׁ תָּמִיד בְּדִיּוּק 4 צְלָעוֹת",
  reviewAnswer: true,
  challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-4 עַד 14 בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת עָשִׂינוּ?",
  challengeAnswer: 5,
  geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ בְּדִיּוּק 3 צְלָעוֹת?",
  geometryAnswer: "triangle",
};
