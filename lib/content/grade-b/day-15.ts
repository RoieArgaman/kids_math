import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 15,
  title: "גּוּפִים בַּמֶּרְחָב",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַזְהֶה קוּבִּיָּה, תִּיבָה וְכַד בְּדִמּוּי.",
  mainTags: ["geometry-solids", "geometry-shapes"],
  spiralReviewTags: ["measurement-time", "geometry-shapes"],
  arithmeticPrompt: "לְקוּבִּיָּה יֵשׁ בְּדִיּוּק 6 פָּנִים. כַּמָּה פָּנִים?",
  arithmeticAnswer: 6,
  arithmeticMcOptions: ["4", "6", "8"],
  arithmeticMcAnswer: "6",
  languagePrompt: "בִּחְרוּ: לְאֵיזֶה גּוּף יֵשׁ עִגּוּל פּוֹתַחַת וְכִיסּוּי עָגֹל?",
  languageOptions: ["כַּד", "קוּבִּיָּה", "תִּיבָה"],
  languageAnswer: "כַּד",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: לְתִיבָה מְאֻרֶכֶת יֵשׁ תָּמִיד 12 צְלָעוֹת",
  reviewAnswer: false,
  challengePrompt: "קוּבִּיָּה וְעוֹד קוּבִּיָּה — כַּמָּה קוֹדְקוֹדִים (פִינוֹת) לְרֹב יֵשׁ לִשְׁנֵיהֶם בַּסַּךְ?",
  challengeAnswer: 16,
};
