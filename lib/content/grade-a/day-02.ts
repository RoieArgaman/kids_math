import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 2,
  title: "מוֹנִים עַד 10",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִסְפֹּר, לִקְרֹא וְלִכְתּוֹב מִסְפָּרִים 0–10 בְּ-80% הַצְלָחָה.",
  mainTags: ["counting", "number-recognition", "addition"],
  spiralReviewTags: ["counting", "number-recognition"],
  arithmeticPrompt: "בְּקֻפְסָּה הָיוּ 4 כַּדּוּרִים. הוֹסַפְנוּ עוֹד 2 כַּדּוּרִים. כַּמָּה כַּדּוּרִים יֵשׁ עַכְשָׁיו בַּקֻּפְסָּה?",
  arithmeticAnswer: 6,
  arithmeticMcOptions: ["5", "6", "7"],
  arithmeticMcAnswer: "6",
  languagePrompt: "בִּחְרוּ: אֵיךְ כּוֹתְבִים בְּעִבְרִית אֶת הַמִּסְפָּר 7?",
  languageOptions: ["שֵׁשׁ", "שֶׁבַע", "שְׁמוֹנֶה"],
  languageAnswer: "שֶׁבַע",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 3 קָטָן מִ-9",
  reviewAnswer: true,
  challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-0 עַד 10, קוֹפְצִים בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת עוֹשִׂים?",
  challengeAnswer: 5,
  geometryPrompt: "אֵיזוֹ צוּרָה הִיא רִיבּוּעַ?",
  geometryAnswer: "square",
};
