import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 12,
  title: "חִיסּוּר בַּעֲשָׂרוֹת",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְהַחְסִיר עֲשָׂרוֹת שְׁלֵמוֹת (לְמָשָׁל 70 - 30) בְּ-80% הַצְלָחָה.",  teachingSummary:
    "הַיּוֹם נַחֲזִיק חִיסּוּר בַּעֲשָׂרוֹת: מַחְסְרִים בְּזֶהֶרֶת מֵעֲשָׂרוֹת וַאֲחָדוֹת.",
  teachingSteps: [
    "מוֹדְדִים אִם יֵשׁ מַסְפִּיק לַהַחְסָרָה בָּאֲחָדוֹת.",
    "אִם לֹא — 'פּוֹרְקִים' עֲשָׂרָה מִמַּטָּה לְמַעְלָה.",
    "בּוֹדְקִים בְּחִיבּוּר הֶפֶךְ קָטָן אוֹ עַל קַו מִסְפָּרִים.",
  ],

  mainTags: ["subtraction", "place-value"],
  spiralReviewTags: ["addition", "place-value"],
  arithmeticPrompt: "בְּסַל הָיוּ 70 תַּפּוּזִים. מָכְרוּ 30. כַּמָּה תַּפּוּזִים נִשְׁאֲרוּ בַּסַּל?",
  arithmeticAnswer: 40,
  arithmeticMcOptions: ["30", "40", "50"],
  arithmeticMcAnswer: "40",
  languagePrompt: "בִּחְרוּ: אֵיךְ כּוֹתְבִים בְּעִבְרִית אֶת הַמִּסְפָּר 40?",
  languageOptions: ["שְׁלוֹשִׁים", "אַרְבָּעִים", "חֲמִישִּׁים"],
  languageAnswer: "אַרְבָּעִים",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 90 - 40 = 50",
  reviewAnswer: true,
  challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-50 יוֹרְדִים לְ-20 בִּקְפִיצוֹת שֶׁל 5 לְאָחוֹר. כַּמָּה קְפִיצוֹת עָשִׂינוּ?",
  challengeAnswer: 6,
};
