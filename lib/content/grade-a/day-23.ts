import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 23,
  title: "קִשְׁרֵי מִסְפָּר לְ-10",
  objective:
    "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְמָצֵא זוּגוֹת שֶׁמִּשְׁלִימִים לַ-10, לִפְתּוֹר חִסֵּר קָטָן בְּחִבּוּר עַד 10, וּלְשַׁנֵּן צִירוּפִים נִפְרָצִים.",  teachingSummary:
    "קִשְׁרֵי מִסְפָּר לְ-10: שְׁנֵי חֲלָקִים שֶׁמִּתְחַבְּרִים לַעֲשָׂרָה.",
  teachingSteps: [
    "מְחַפְּשִׂים אֶת הַחֶסֶר כְּדֵי לְהַשְׁלִים ל-10.",
    "מוֹדְדִים עַל אֶצְבָּעוֹת אוֹ עַל מַעֲרֶכֶת עֲשָׂרָה.",
    "בּוֹדְקִים: חֵלֶק א' + חֵלֶק ב' = 10.",
  ],

  mainTags: ["number-bonds", "addition"],
  spiralReviewTags: ["multiplication-intro", "subtraction"],
  arithmeticPrompt: "כַּמָּה צָרִיךְ לְהוֹסִיף לְ-7 כְּדֵי לְהַגִּיעַ לְ-10?",
  arithmeticAnswer: 3,
  arithmeticMcOptions: ["2", "3", "4"],
  arithmeticMcAnswer: "3",
  languagePrompt: "בִּחְרוּ בִּמִילִים אֶת הַמִּסְפָּר שֶׁמִּשְׁלִים אֶת 4 לְ-10:",
  languageOptions: ["חָמֵשׁ", "שִׁשָּׁה", "שֶׁבַע"],
  languageAnswer: "שִׁשָּׁה",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 9 + 1 = 10",
  reviewAnswer: true,
  challengePrompt:
    "עַל קַו מִסְפָּרִים: מִ-10 חוֹזְרִים לְ-0 בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת עָשִׂינוּ?",
  challengeAnswer: 5,
  geometryPrompt: "אֵיזוֹ צוּרָה מַזְכִּירָה עִגּוּל חָלָק שֶׁאֵין לוֹ פִּנּוֹת?",
  geometryAnswer: "circle",
};
