import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 3,
  title: "חִיסּוּר עַד 100 בְּלִי נְשִׂיאָה",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַחְסִיר תַּרְגִּילִים עַד 100 בְּלִי נְשִׂיאָה.",
  mainTags: ["subtraction", "addition"],
  spiralReviewTags: ["addition", "place-value"],
  arithmeticPrompt: "חַשְּׁבוּ 86 - 42",
  arithmeticAnswer: 44,
  arithmeticMcOptions: ["43", "44", "45"],
  arithmeticMcAnswer: "44",
  languagePrompt: "בִּחְרוּ: אֵיךְ כּוֹתְבִים בִּמִילִים 90?",
  languageOptions: ["תִּשְׁעִים", "שְׁמוֹנִים", "מֵאָה"],
  languageAnswer: "תִּשְׁעִים",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 70 - 20 = 40",
  reviewAnswer: false,
  challengePrompt: "הָיוּ 95 דַּפִּים. הִשְׁתַּמְּשׁוּ בְ-52. כַּמָּה נִשְׁאֲרוּ?",
  challengeAnswer: 43,
};
