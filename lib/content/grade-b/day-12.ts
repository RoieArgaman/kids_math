import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 12,
  title: "שֶׁטַח — רִיבּוּעִים יְחִידָה",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְסַפֵּר רִיבּוּעֵי יְחִידָה בִּשְׁבִיל פָּשׁוּט.",
  mainTags: ["measurement-area", "multiplication-intro"],
  spiralReviewTags: ["measurement-length", "geometry-shapes"],
  arithmeticPrompt: "בְּרִשְׁתּוֹת 2 שׁוּרוֹת וְ-4 עֲמוּדִים — כַּמָּה רִיבּוּעִים?",
  arithmeticAnswer: 8,
  arithmeticMcOptions: ["6", "8", "10"],
  arithmeticMcAnswer: "8",
  languagePrompt: "בִּחְרוּ: שֶׁטַח מוֹדָדִים בְּרִיבּוּעֵי יְחִידָה קְטַנִּים — נָכוֹן?",
  languageOptions: ["כֵּן", "לֹא", "אוּלַי"],
  languageAnswer: "כֵּן",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: רִיבּוּעַ גָּדוֹל יָכוֹל לְהִבָּנוֹת מֵרִיבּוּעִים קְטַנִּים",
  reviewAnswer: true,
  challengePrompt: "מַלְבֵּן: אֹרֶךְ 30 ס״מ וְרֹחַב 9 ס״מ. חַשְּׁבוּ הַקֵּף: 30 + 30 + 9 + 9",
  challengeAnswer: 78,
  geometryPrompt: "אֵיזוֹ צוּרָה לְכָל הַצְּלָעוֹת שָׁווֹת?",
  geometryAnswer: "square",
};
