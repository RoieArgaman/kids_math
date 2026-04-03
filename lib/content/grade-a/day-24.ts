import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 24,
  title: "מִסְפָּרִים עַד 50",
  objective:
    "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַשְׁוֶה וִיקַרְאָה מִסְפָּרִים בִּטְוַח עַד 50.",  teachingSummary:
    "מִסְפָּרִים עַד 50: קוֹרְאִים, מַשְׁווִים וּמְמַקְּמִים עַל קַו מִסְפָּרִים.",
  teachingSteps: [
    "קוֹרְאִים עֲשָׂרוֹת וְאַחַר כָּךְ אֲחָדוֹת.",
    "מַשְׁווִים מִי קָרוֹב יוֹתֵר לַעֲשָׂרָה הַבָּאָה.",
    "מַזִּיזִים בְּקְפִיצוֹת קְטַנּוֹת כְּשֶׁצָּרִיךְ.",
  ],

  mainTags: ["number-recognition", "comparing"],
  spiralReviewTags: ["place-value", "patterns"],
  arithmeticPrompt: "אֵיזֶה גָּדוֹל יוֹתֵר: 47 אוֹ 39? כִּתְבוּ אֶת הַגָּדוֹל.",
  arithmeticAnswer: 47,
  arithmeticMcOptions: ["39", "47", "שָׁווִים"],
  arithmeticMcAnswer: "47",
  languagePrompt: "בִּחְרוּ בִּמִילִים אֶת הַמִּסְפָּר: 44",
  languageOptions: ["אַרְבָּעִים וּשְׁתַּיִם", "אַרְבָּעִים וְאַרְבַּע", "אַרְבָּעִים וְשֵׁשׁ"],
  languageAnswer: "אַרְבָּעִים וְאַרְבַּע",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 50 גָּדוֹל מִ-49",
  reviewAnswer: true,
  challengePrompt: "הַשְׁלִימוּ: 40, 42, 44, __",
  challengeAnswer: 46,
  geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ 4 פִּנּוֹת יְשָׁרוֹת וְכָל הַצְלָעוֹת שָׁווֹת?",
  geometryAnswer: "square",
};
