import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 4,
  title: "חִיסּוּר עַד 10",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִפְתּוֹר תַּרְגִּילֵי חִיסּוּר עַד 10 בְּ-4 מִתּוֹךְ 5 מְשִׂימוֹת.",
  mainTags: ["subtraction", "addition"],
  spiralReviewTags: ["addition", "number-line"],
  arithmeticPrompt: "הָיוּ 9 בָּלוֹנִים בַּמְּסִיבָּה. פָּרְחוּ 4. כַּמָּה בָּלוֹנִים נִשְׁאֲרוּ?",
  arithmeticAnswer: 5,
  arithmeticMcOptions: ["4", "5", "6"],
  arithmeticMcAnswer: "5",
  verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 5",
  verbalAnswer: "חָמֵשׁ",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 10 - 3 = 8",
  reviewAnswer: false,
  challengePrompt: "עַל קַו הַמִּסְפָּרִים: מַתְחִילִים בְּ-10 וְיוֹרְדִים בְּ-2 עַד 2. כַּמָּה דִּלּוּגִים לְאָחוֹר עָשִׂינוּ?",
  challengeAnswer: 4,
};
