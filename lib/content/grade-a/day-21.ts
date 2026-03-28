import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 21,
  title: "גִּימַטְרְיָה — אוֹתִיּוֹת א'–י'",
  objective:
    "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְהַקְצוֹת עֶרֶךְ מִסְפָּרִי לְאוֹתִיּוֹת א'–י', לְחַבֵּר עֶרְכֵי אוֹתִיּוֹת קְטַנִּים, וּלְכַתּוֹב שֵׁמוֹת מִסְפָּרִים בַּעֲבֵרִית.",
  mainTags: ["gematria-letters", "number-recognition"],
  spiralReviewTags: ["geometry-shapes", "addition"],
  arithmeticPrompt:
    "בְּגִימַטְרְיָה פָּשׁוּטָה: חַשְּׁבוּ א (1) + ג (3)",
  arithmeticAnswer: 4,
  arithmeticMcOptions: ["3", "4", "5"],
  arithmeticMcAnswer: "4",
  verbalPrompt: "כִּתְבוּ בִּמִילִים אֶת הַמִּסְפָּר שֶׁל הָאוֹת ח (8):",
  verbalAnswer: "שְׁמוֹנֶה",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: בְּגִימַטְרְיָה, הָאוֹת י (10) גְּדוֹלָה מִן הָאוֹת ח (8)",
  reviewAnswer: true,
  challengePrompt:
    "חַשְּׁבוּ ב' (2) + ה' (5) + ג' (3)",
  challengeAnswer: 10,
  geometryPrompt: "אֵיזוֹ צוּרָה מוּזְכֶּרֶת לְעִתִּים בְּמוֹפַע שְׁלוֹשָׁה קְצָווֹת?",
  geometryAnswer: "triangle",
};
