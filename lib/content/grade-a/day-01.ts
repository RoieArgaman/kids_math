import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 1,
  title: "מוֹנִים עַד 5",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִסְפֹּר אוֹבְיֶקְטִים עַד 5 וּלְזַהוֹת אֶת הַכַּמּוּת הַנְּכוֹנָה בְּ-5 מִתּוֹךְ 6 מְשִׂימוֹת.",
  teachingSummary:
    "הַיּוֹם נִתְרַגֵּל לִסְפֹּר עַד 5 בִּשְׁקָט וּבְסֵדֶר: קוֹדֶם מַבִּינִים אֶת הַשְּׁאֵלָה, אַחַר כָּךְ סוֹפְרִים וּבוֹדְקִים.",
  teachingSteps: [
    "מַזְכִּירִים: לְכָל כַּמּוּת יֵשׁ שֵׁם וְיֵשׁ מָקוֹם עַל קַו הַמִּסְפָּרִים.",
    "כְּשֶׁמּוֹסִיפִים חֶפְצִים — סוֹפְרִים שׁוּב מֵהַהַתְחָלָה עַד הַסּוֹף.",
    "אִם קָשֶׁה — אֶפְשָׁר לְסַפֵּר בְּאֶצְבָּעוֹת אוֹ לְצַיֵּר עִגּוּלִים קְטַנִּים.",
  ],
  mainTags: ["counting", "number-recognition"],
  spiralReviewTags: ["counting"],
  arithmeticPrompt: "בְּסַל יֵשׁ 2 תַּפּוּחִים. אִמָּא הוֹסִיפָה עוֹד תַּפּוּחַ. כַּמָּה תַּפּוּחִים יֵשׁ עַכְשָׁיו?",
  arithmeticAnswer: 3,
  arithmeticMcOptions: ["2", "3", "4"],
  arithmeticMcAnswer: "3",
  languagePrompt: "בִּחְרוּ: אֵיךְ כּוֹתְבִים בְּעִבְרִית אֶת הַמִּסְפָּר 4?",
  languageOptions: ["שָׁלוֹשׁ", "אַרְבַּע", "חָמֵשׁ"],
  languageAnswer: "אַרְבַּע",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 5 גָּדוֹל מִ-2",
  reviewAnswer: true,
  challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-1 עַד 5, כָּל פַּעַם צַעַד אֶחָד קָדִימָה. כַּמָּה צְעָדִים עָשִׂינוּ?",
  challengeAnswer: 4,
  geometryPrompt: "אֵיזוֹ צוּרָה הִיא עִיגּוּל?",
  geometryAnswer: "circle",
};
