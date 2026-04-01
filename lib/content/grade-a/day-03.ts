import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 3,
  title: "חִיבּוּר עַד 10",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִפְתּוֹר תַּרְגִּילֵי חִיבּוּר עַד 10 בְּ-4 מִתּוֹךְ 5 מְשִׂימוֹת.",
  mainTags: ["addition", "number-line"],
  spiralReviewTags: ["counting", "number-recognition"],
  arithmeticPrompt: "בְּמִגְרָשׁ שִׂיחֲקוּ 5 יְלָדִים. הִצְטָרְפוּ עוֹד 3. כַּמָּה יְלָדִים שִׂיחֲקוּ בַּסַּךְ הַכֹּל?",
  arithmeticAnswer: 8,
  arithmeticMcOptions: ["7", "8", "9"],
  arithmeticMcAnswer: "8",
  languagePrompt: "בִּחְרוּ: אֵיךְ כּוֹתְבִים בְּעִבְרִית אֶת הַמִּסְפָּר 8?",
  languageOptions: ["שֶׁבַע", "שְׁמוֹנֶה", "תֵּשַׁע"],
  languageAnswer: "שְׁמוֹנֶה",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 6 + 1 = 7",
  reviewAnswer: true,
  challengePrompt: "עַל קַו הַמִּסְפָּרִים: מַתְחִילִים בְּ-2 וּמְדַלְּגִים בְּ-2 עַד 10. כַּמָּה דִּלּוּגִים עָשִׂינוּ?",
  challengeAnswer: 4,
};
