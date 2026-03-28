import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 20,
  title: "צוּרוֹת וּמְצוּלָעִים — חֲזָרָה",
  objective:
    "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְזַהֶה צוּרוֹת וִיסְפּוֹר צְלָעוֹת בִּפְעִילוּיוֹת קְצָרוֹת.",
  mainTags: ["geometry-shapes", "comparing"],
  spiralReviewTags: ["symmetry-transform", "number-recognition"],
  arithmeticPrompt: "לִשְׁנֵי רִיבּוּעִים יֵשׁ בִּיחַד כַּמָּה צְלָעוֹת?",
  arithmeticAnswer: 8,
  arithmeticMcOptions: ["6", "8", "10"],
  arithmeticMcAnswer: "8",
  verbalPrompt: "כִּתְבוּ בְּמִילָה אַחַת: כַּמָּה צְלָעוֹת לִמְשֻׁלָּשׁ?",
  verbalAnswer: "שָׁלוֹשׁ",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: לְמַלְבֵּן יֵשׁ תָּמִיד 4 צְלָעוֹת",
  reviewAnswer: true,
  challengePrompt: "סִדְרָה: 10, 20, 30, __ — כִּתְבוּ אֶת הַמִּסְפָּר הַבָּא.",
  challengeAnswer: 40,
  geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ בְּדִיּוּק 3 צְלָעוֹת?",
  geometryAnswer: "triangle",
};
