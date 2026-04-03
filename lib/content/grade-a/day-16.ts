import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 16,
  title: "מְדִידַת אֹרֶךְ בְּסִיסִית",
  objective:
    "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְקַשֵּׁר סְפִירָה וַחֲלוּקָה פְּשׁוּטָה לְמִדַּת אֹרֶךְ (ס״מ) וּלְפָתוֹר מְשִׂימוֹת מְחוֹבֵרוֹת לָאֹרֶךְ.",  teachingSummary:
    "הַיּוֹם נַמְדִּיד אֹרֶךְ: מַתְחִילִים מִקֶּצֶה אֶחָד שֶׁל חֵפֶץ וְסוֹפְרִים סִנטִימֶטְרִים.",
  teachingSteps: [
    "מַצִּיעִים קַו יָשָׁר וּמַצְמִידִים סַרְגֵּל מֵהַתְחָלָה לַסּוֹף.",
    "קוֹרְאִים אֶת הַמִּסְפָּר לְיַד הַסּוֹף בִּזְהִירוּת.",
    "מַשְׁווִים אֹרְכִים: מִי יוֹתֵר אָרֹךְ אוֹ קָצָר.",
  ],

  mainTags: ["measurement-length", "counting"],
  spiralReviewTags: ["addition", "subtraction", "number-recognition"],
  arithmeticPrompt:
    "סַרְגֵּל בָּאֹרֶךְ 10 ס״מ. שָׂמִים אוֹתוֹ 3 פְּעָמִים זֶה אַחַר זֶה בְּקַו יָשָׁר. כַּמָּה ס״מ בַּסַּךְ הַכֹּל?",
  arithmeticAnswer: 30,
  arithmeticMcOptions: ["20", "30", "40"],
  arithmeticMcAnswer: "30",
  languagePrompt: "בִּחְרוּ בִּמִילִים אֶת הַמִּסְפָּר: כַּמָּה ס״מ בִּשְׁלוֹשָׁה סַרְגְּלִים שֶׁל 10 ס״מ כָּל אֶחָד?",
  languageOptions: ["עֶשְׂרִים", "שְׁלוֹשִׁים", "אַרְבָּעִים"],
  languageAnswer: "שְׁלוֹשִׁים",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 15 ס״מ + 15 ס״מ = 30 ס״מ",
  reviewAnswer: true,
  challengePrompt:
    "עַל קַו מִסְפָּרִים לְהַמְחָשָׁה: מִ-0 עַד 30, כָּל קְפִיצָה הִיא 10 יְחִידוֹת. כַּמָּה קְפִיצוֹת עָשִׂינוּ?",
  challengeAnswer: 3,
  geometryPrompt: "אֵיזוֹ צוּרָה נִרְאֵית כְּמוֹ מִסְגֶּרֶת לָרִבּוּעַ?",
  geometryAnswer: "square",
};
