import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 14,
  title: "יוֹם סִיכּוּם וְהַטְמָעָה",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְהַפְגִּין מִגְוָן מִיּוֹמוּיוֹת מֵהַשָּׁבוּעַיִם וּלִפְתּוֹר מְשִׂימוֹת מְשֻׁלָּבוֹת בְּ-80% הַצְלָחָה.",
  mainTags: ["addition", "subtraction", "word-problems", "geometry-shapes", "place-value"],
  spiralReviewTags: ["addition", "subtraction", "word-problems", "geometry-shapes", "place-value"],
  arithmeticPrompt: "בַּחֲנוּת יֵשׁ 46 תַּפּוּחִים אֲדֻמִּים וְ-12 יְרֻקִּים. כַּמָּה תַּפּוּחִים יֵשׁ בַּחֲנוּת בַּסַּךְ הַכֹּל?",
  arithmeticAnswer: 58,
  arithmeticMcOptions: ["56", "58", "60"],
  arithmeticMcAnswer: "58",
  languagePrompt: "בִּחְרוּ: אֵיךְ כּוֹתְבִים בְּעִבְרִית אֶת הַמִּסְפָּר 58?",
  languageOptions: ["חֲמִישִּׁים וְשֶׁבַע", "חֲמִישִּׁים וּשְׁמוֹנֶה", "חֲמִישִּׁים וְתֵשַׁע"],
  languageAnswer: "חֲמִישִּׁים וּשְׁמוֹנֶה",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 64 - 20 = 44",
  reviewAnswer: true,
  challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-8 עַד 28 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת שְׁלֵמוֹת עָשִׂינוּ?",
  challengeAnswer: 4,
  geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ בְּדִיּוּק 4 צְלָעוֹת שָׁווֹת?",
  geometryAnswer: "square",
};
