import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 4,
  title: "חִיבּוּר עִם נְשִׂיאָה פְּשׁוּטָה",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְבִין נְשִׂיאָה לַעֲשָׂרָה וִיחַבֵּר (לְמָשָׁל 47 + 6).",
  mainTags: ["addition", "number-bonds"],
  spiralReviewTags: ["subtraction", "place-value"],
  arithmeticPrompt: "חַשְּׁבוּ 58 + 7",
  arithmeticAnswer: 65,
  arithmeticMcOptions: ["64", "65", "66"],
  arithmeticMcAnswer: "65",
  verbalPrompt: "כִּתְבוּ בִּמִילִים: 65",
  verbalAnswer: "שִׁשִּׁים וְחָמֵשׁ",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 39 + 5 = 44",
  reviewAnswer: true,
  challengePrompt: "בְּאַרְגָּז 28 אֲבָנִים. הוֹסִיפוּ 14. כַּמָּה עַכְשָׁיו?",
  challengeAnswer: 42,
  geometryPrompt: "אֵיזוֹ צוּרָה כָּל הַצְּלָעוֹת שָׁווֹת וְיֵשׁ 4 זָווִיּוֹת יְשָׁרוֹת?",
  geometryAnswer: "square",
};
