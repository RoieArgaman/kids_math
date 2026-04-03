import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 4,
  title: "חִיסּוּר עַד 10",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִפְתּוֹר תַּרְגִּילֵי חִיסּוּר עַד 10 בְּ-4 מִתּוֹךְ 5 מְשִׂימוֹת.",  teachingSummary:
    "הַיּוֹם נִלְמַד חִיסּוּר עַד 10: לִקַּחַת חֵלֶק מִכַּמּוּת גְּדוֹלָה יוֹתֵר וְלִמְצֹא מָה נִשְׁאַר.",
  teachingSteps: [
    "קוֹרְאִים: כַּמָּה הָיָה בְּהַתְחָלָה וְכַּמָּה 'יָצָא' אוֹ 'נֶעֱלַם'.",
    "מַצְיָרִים קַו מִסְפָּרִים אוֹ מְחַסְרִים בְּשָׁקֶט צַעַד אַחַר צַעַד.",
    "בּוֹדְקִים שֶׁהַתּוֹצָאָה קְטַנָּה אוֹ שְׁוָה לְמָה שֶׁהָיָה בַּהַתְחָלָה.",
  ],

  mainTags: ["subtraction", "addition"],
  spiralReviewTags: ["addition", "number-line"],
  arithmeticPrompt: "הָיוּ 9 בָּלוֹנִים בַּמְּסִיבָּה. פָּרְחוּ 4. כַּמָּה בָּלוֹנִים נִשְׁאֲרוּ?",
  arithmeticAnswer: 5,
  arithmeticMcOptions: ["4", "5", "6"],
  arithmeticMcAnswer: "5",
  languagePrompt: "בִּחְרוּ: אֵיךְ כּוֹתְבִים בְּעִבְרִית אֶת הַמִּסְפָּר 5?",
  languageOptions: ["אַרְבַּע", "חָמֵשׁ", "שֵׁשׁ"],
  languageAnswer: "חָמֵשׁ",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 10 - 3 = 8",
  reviewAnswer: false,
  challengePrompt: "עַל קַו הַמִּסְפָּרִים: מַתְחִילִים בְּ-10 וְיוֹרְדִים בְּ-2 עַד 2. כַּמָּה דִּלּוּגִים לְאָחוֹר עָשִׂינוּ?",
  challengeAnswer: 4,
};
