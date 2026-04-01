import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 26,
  title: "סִימֶטְרְיָה וְצוּרוֹת",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַזְהֶה צִיר סִימֶטְרְיָה פָּשׁוּט.",
  mainTags: ["symmetry-transform", "geometry-shapes"],
  spiralReviewTags: ["addition", "patterns"],
  arithmeticPrompt: "לִרְבוּעַ יֵשׁ בְּדִיּוּק כַּמָּה צְלָעוֹת שָׁווֹת?",
  arithmeticAnswer: 4,
  arithmeticMcOptions: ["3", "4", "5"],
  arithmeticMcAnswer: "4",
  languagePrompt: "בִּחְרוּ: כַּמָּה צִירֵי סִימֶטְרְיָה יֵשׁ לְרִיבּוּעַ?",
  languageOptions: ["4", "2", "6"],
  languageAnswer: "4",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: רִיבּוּעַ דּוֹמֶה לְעַצְמוֹ אַחֲרֵי שִׁיקּוּף",
  reviewAnswer: true,
  challengePrompt: "בַּמָּגֵן הָיוּ 4 שׁוּרוֹת. כָּל שׁוּרָה 10 כּוֹכָבִים. כַּמָּה כּוֹכָבִים?",
  challengeAnswer: 40,
  geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ בְּדִיּוּק 3 צְלָעוֹת?",
  geometryAnswer: "triangle",
};
