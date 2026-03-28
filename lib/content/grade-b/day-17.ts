import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 17,
  title: "בְּעָיוֹת מִילּוּלִיּוֹת",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִזְהֶה חִיבּוּר אוֹ חִיסּוּר בִּבְעִיָּה בְּשָׁלָב אֶחָד.",
  mainTags: ["word-problems", "addition", "subtraction"],
  spiralReviewTags: ["geometry-shapes", "place-value"],
  arithmeticPrompt: "לְנוֹעַם הָיוּ 48 מַדְבֵּקוֹת. נָתְנָה 15 לְאַח. כַּמָּה נִשְׁאֲרוּ?",
  arithmeticAnswer: 33,
  arithmeticMcOptions: ["31", "33", "35"],
  arithmeticMcAnswer: "33",
  verbalPrompt: "כִּתְבוּ: מָה עוֹשִׂים כְּשֶׁ«נִלְקְחוּ» בְּבְעִיָּה?",
  verbalAnswer: "מַחְסִירִים",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: בְּעִיָּה יְכוֹלָה לִהְיוֹת גַּם חִיבּוּר וְגַם חִיסּוּר בִּשְׁנֵי שְׁלָבִים",
  reviewAnswer: true,
  challengePrompt: "בַּחֲנוּת נִמְכְּרוּ 27 עִטְרוֹת וְעוֹד 18. כַּמָּה בַּסַּךְ?",
  challengeAnswer: 45,
};
