import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 5,
  title: "חִיסּוּר עִם נְשִׂיאָה פְּשׁוּטָה",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַחְסִיר עִם פֵּרוּק לַעֲשָׂרָה (לְמָשָׁל 53 - 7).",
  mainTags: ["subtraction", "number-bonds"],
  spiralReviewTags: ["addition", "number-line"],
  arithmeticPrompt: "חַשְּׁבוּ 61 - 8",
  arithmeticAnswer: 53,
  arithmeticMcOptions: ["52", "53", "54"],
  arithmeticMcAnswer: "53",
  verbalPrompt: "כִּתְבוּ: מָה עוֹשִׂים קוֹדֶם כְּשֶׁאֵין מַסְפִּיק אֲחָדוֹת לְהַחְסִיר?",
  verbalAnswer: "פּוֹרְקִים עֲשָׂרָה",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 44 - 6 = 48",
  reviewAnswer: false,
  challengePrompt: "בַּגַּן 73 יְלָדִים. 9 יָצְאוּ. כַּמָּה נִשְׁאֲרוּ?",
  challengeAnswer: 64,
};
