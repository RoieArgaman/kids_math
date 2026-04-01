import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 10,
  title: "דְּפוּסִים עַד 100",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַשְׁלִים סִדְרוֹת וִיזַהֶה דְּפוּס פָּשׁוּט.",
  mainTags: ["patterns", "number-line"],
  spiralReviewTags: ["fractions-parts", "comparing"],
  arithmeticPrompt: "הַשְׁלִימוּ: 15, 20, 25, __",
  arithmeticAnswer: 30,
  arithmeticMcOptions: ["28", "30", "35"],
  arithmeticMcAnswer: "30",
  languagePrompt: "בִּחְרוּ: אֵיךְ כּוֹתְבִים בִּמִילִים 100?",
  languageOptions: ["מֵאָה", "תִּשְׁעִים", "מֵאָה וְעֶשֶׂר"],
  languageAnswer: "מֵאָה",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: בְּדְּפוּס +7 מִ-14 הַמִּסְפָּר הַבָּא הוּא 20",
  reviewAnswer: false,
  challengePrompt: "עַל קַו מִסְפָּרִים: מִ-50 עַד 70 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת?",
  challengeAnswer: 4,
};
