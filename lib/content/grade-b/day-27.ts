import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 27,
  title: "בְּעָיוֹת הַשְׁוָאָה",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַשְׁוֶה כּמוֹת וִיכְתֹּב תְּשׁוּבָה בְּמִילִים.",
  mainTags: ["comparing", "word-problems"],
  spiralReviewTags: ["symmetry-transform", "subtraction"],
  arithmeticPrompt: "לִמְנוֹרָה 90 ס״מ וְלִמְשׁוּלָשׁ 75 ס״מ — כַּמָּה ס״מ הַפַּרשׂ?",
  arithmeticAnswer: 15,
  arithmeticMcOptions: ["10", "15", "25"],
  arithmeticMcAnswer: "15",
  verbalPrompt: "כִּתְבוּ בְּמִסְפָּר: מִי יוֹתֵר — 6 עֲשָׂרוֹת אוֹ 59?",
  verbalAnswer: "60",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 101 גָּדוֹל מִ-99",
  reviewAnswer: true,
  challengePrompt: "שְׁלוֹשָׁה אַרְגָּזִים שָׁווִים. בַּסַּךְ 27 צֶבַעִים. כַּמָּה בְּכָל אַרְגָּז?",
  challengeAnswer: 9,
};
