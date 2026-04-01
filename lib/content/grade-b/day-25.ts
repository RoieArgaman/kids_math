import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 25,
  title: "חִיבּוּר וְחִיסּוּר מְעוֹרָב",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִתְרַגֵּל בִּרְצִיפוּת בִּשְׁנֵי סוּגֵי פְּעוּלוֹת.",
  mainTags: ["addition", "subtraction", "place-value"],
  spiralReviewTags: ["place-value", "comparing"],
  arithmeticPrompt: "חַשְּׁבוּ 73 - 28",
  arithmeticAnswer: 45,
  arithmeticMcOptions: ["43", "45", "47"],
  arithmeticMcAnswer: "45",
  languagePrompt: "בִּחְרוּ: מַהוּ הַמִּסְפָּר הַקָּטָן מִבֵּין 88 וִ-91?",
  languageOptions: ["שְׁמוֹנִים וּשְׁמוֹנָה", "תִּשְׁעִים וְאַחַת", "שְׁמוֹנִים וְתֵשַׁע"],
  languageAnswer: "שְׁמוֹנִים וּשְׁמוֹנָה",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 50 - 25 + 10 = 35",
  reviewAnswer: true,
  challengePrompt: "בְּרִשְׁתָּה 7 שׁוּרוֹת וִ-8 בְּכָל שׁוּרָה. נִמְצְאוּ 20 רִיקִים. כַּמָּה מָלְאוּ?",
  challengeAnswer: 36,
  geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ בְּדִיּוּק 3 צְלָעוֹת יְשָׁרוֹת?",
  geometryAnswer: "triangle",
};
