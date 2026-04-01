import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 2,
  title: "חִיבּוּר עַד 100 בְּלִי נְשִׂיאָה",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְחַבֵּר תַּרְגִּילִים עַד 100 בְּלִי נְשִׂיאָה בְּדִיּוּק טוֹב.",
  mainTags: ["addition", "place-value"],
  spiralReviewTags: ["comparing", "number-line"],
  arithmeticPrompt: "חַשְּׁבוּ 42 + 35",
  arithmeticAnswer: 77,
  arithmeticMcOptions: ["67", "77", "87"],
  arithmeticMcAnswer: "77",
  languagePrompt: "בִּחְרוּ: אֵיךְ כּוֹתְבִים בִּמִילִים 77?",
  languageOptions: ["שִׁבְעִים וְשִׁבְעָה", "שִׁבְעִים וְשִׁשָּׁה", "שְׁמוֹנִים וְשִׁבְעָה"],
  languageAnswer: "שִׁבְעִים וְשִׁבְעָה",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 54 + 23 = 77",
  reviewAnswer: true,
  challengePrompt: "יֵשׁ 56 מַדְבֵּקוֹת וְעוֹד 31. כַּמָּה בַּסַּךְ?",
  challengeAnswer: 87,
  geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ 3 צְלָעוֹת?",
  geometryAnswer: "triangle",
};
