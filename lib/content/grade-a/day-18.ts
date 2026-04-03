import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 18,
  title: "זְמַן וְשָׁעוֹן פָּשׁוּט",
  objective:
    "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִקְרֹא שָׁעָה שְׁלֵמָה בַּשָּׁעוֹן, לְהוֹסִיף שָׁעָה אַחַת בְּמוֹדֵל פָּשׁוּט, וּלְקַשֵּׁר לִמְסַפֵּר שָׁעוֹת.",  teachingSummary:
    "הַיּוֹם נַעֲבֹד עִם זְמַן וְשָׁעוֹן: מַזְהִים מַחְוָנִים וּמַחְשִׁיבִים הֶפְרֵשֵׁי זְמַן קְצָרִים.",
  teachingSteps: [
    "קוֹדֶם קוֹרְאִים אֶת הַשָּׁעָה הַמְּדֻיֶּקֶת.",
    "מַחְשִׁיבִים קִדּוּם אוֹ אָחוֹר בְּדַקּוֹת קְטַנּוֹת.",
    "בּוֹדְקִים שֶׁהַתּוֹצָאָה סְבִירָה לַיּוֹם.",
  ],

  mainTags: ["measurement-time", "number-recognition"],
  spiralReviewTags: ["measurement-length", "counting"],
  arithmeticPrompt:
    "הַשָּׁעוֹן מַרְאֶה אֶת הַשָּׁעָה אַרְבַּע. עוֹבֵר זְמַן שֶׁל שָׁעָה אַחַת. כַּמָּה הַשָּׁעָה עַכְשָׁיו?",
  arithmeticAnswer: 5,
  arithmeticMcOptions: ["4", "5", "6"],
  arithmeticMcAnswer: "5",
  languagePrompt: "בִּחְרוּ בִּמִילִים: אֵיזוֹ שָׁעָה הִיא כְּשֶׁהַמַּחְצֵבֶת מַצִּיגָה 7 (בְּשָׁעוֹת שְׁלֵמוֹת בִּלְבַד)?",
  languageOptions: ["שֵׁשׁ", "שֶׁבַע", "שְׁמוֹנֶה"],
  languageAnswer: "שֶׁבַע",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: לְ-60 דַּקּוֹת קוֹרְאִים שָׁעָה אַחַת",
  reviewAnswer: true,
  challengePrompt:
    "עַל קַו מִסְפָּרִים: מִ-3 עַד 9, כָּל צַעַד הוּא שָׁעָה אַחַת קָדִימָה. כַּמָּה צְעָדִים עָשִׂינוּ?",
  challengeAnswer: 6,
};
