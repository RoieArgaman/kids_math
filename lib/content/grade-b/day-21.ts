import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 21,
  title: "כֶּסֶף פָּשׁוּט (שְׁקָלִים)",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְחַבֵּר סְכוּמִים קְטַנּוֹת בְּמַטְבֵּעוֹת.",
  mainTags: ["money-shekel", "addition"],
  spiralReviewTags: ["fractions-parts", "word-problems"],
  arithmeticPrompt: "מַטְבֵּעַ 10 שְׁקָלִים וְעוֹד מַטְבֵּעַ 10 וְעוֹד 5 — כַּמָּה בַּסַּךְ?",
  arithmeticAnswer: 25,
  arithmeticMcOptions: ["20", "25", "30"],
  arithmeticMcAnswer: "25",
  languagePrompt: "בִּחְרוּ: אֵיךְ לְשַׁלֵּם 12 שְׁקָלִים בְּמַטְבֵּעוֹת?",
  languageOptions: ["עֲשָׂרָה וּשְׁנַיִם", "חָמֵשׁ וְשֶׁבַע", "שְׁנֵים עָשָׂר וְאֶחָד"],
  languageAnswer: "עֲשָׂרָה וּשְׁנַיִם",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 5 + 5 + 1 + 1 = 12",
  reviewAnswer: true,
  challengePrompt: "מַחִיר מֹחַ 18 שְׁקָלִים. שִׁילְּמוּ 20. כַּמָּה עוֹדֵף?",
  challengeAnswer: 2,
};
