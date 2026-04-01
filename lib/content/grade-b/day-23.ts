import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 23,
  title: "קַו מִסְפָּרִים עַד 100",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַזְחִיל קְפִיצוֹת וְהֶפְרְשִׁים עַל קַו.",
  mainTags: ["number-line", "patterns"],
  spiralReviewTags: ["word-problems", "place-value"],
  arithmeticPrompt: "מִ-40 עַד 55 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת?",
  arithmeticAnswer: 3,
  arithmeticMcOptions: ["2", "3", "4"],
  arithmeticMcAnswer: "3",
  languagePrompt: "בִּחְרוּ: אֵיךְ כּוֹתְבִים בִּמִילִים 95?",
  languageOptions: ["תִּשְׁעִים וְחָמֵשׁ", "תִּשְׁעִים וְשֵׁשׁ", "שְׁמוֹנִים וְחָמֵשׁ"],
  languageAnswer: "תִּשְׁעִים וְחָמֵשׁ",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 100 בָּא אַחֲרֵי 99",
  reviewAnswer: true,
  challengePrompt: "הִתְחִילוּ בְ-12 וְהִמְשִׁיכוּ בִּקְפִיצוֹת שֶׁל 8 עַד לְפָחוֹת 60. הַמִּסְפָּר הַבָּא אַחֲרֵי 12 הוּא __",
  challengeAnswer: 20,
};
