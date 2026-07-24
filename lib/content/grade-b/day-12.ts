import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 12,
  title: "שֶׁטַח — רִיבּוּעֵי יְחִידָה",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִסְפֹּר רִיבּוּעֵי יְחִידָה בְּצוּרָה פְּשׁוּטָה.",
  mainTags: ["measurement-area", "multiplication-intro"],
  spiralReviewTags: ["measurement-length", "geometry-shapes"],
  arithmeticPrompt: "בְּרֶשֶׁת שֶׁל 2 שׁוּרוֹת וְ-4 טוּרִים — כַּמָּה רִיבּוּעִים?",
  arithmeticAnswer: 8,
  arithmeticMcOptions: ["6", "8", "10"],
  arithmeticMcAnswer: "8",
  languagePrompt: "בַּחֲרוּ: מוֹדְדִים שֶׁטַח בְּרִיבּוּעֵי יְחִידָה קְטַנִּים — נָכוֹן?",
  languageOptions: ["כֵּן", "לֹא", "אוּלַי"],
  languageAnswer: "כֵּן",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: רִיבּוּעַ גָּדוֹל יָכוֹל לְהִבָּנוֹת מֵרִיבּוּעִים קְטַנִּים",
  reviewAnswer: true,
  challengePrompt: "מַלְבֵּן: אֹרֶךְ 30 ס״מ וְרֹחַב 9 ס״מ. חַשְּׁבוּ הַקֵּף: 30 + 30 + 9 + 9",
  challengeAnswer: 78,
  geometryPrompt: "אֵיזוֹ צוּרָה שֶׁכָּל צְלָעוֹתֶיהָ שָׁווֹת?",
  geometryAnswer: "square",
};
