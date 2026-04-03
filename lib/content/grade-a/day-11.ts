import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 11,
  title: "חִיבּוּר בַּעֲשָׂרוֹת",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְחַבֵּר עֲשָׂרוֹת שְׁלֵמוֹת (לְמָשָׁל 30 + 20) בְּ-4 מִתּוֹךְ 5 מְשִׂימוֹת.",  teachingSummary:
    "הַיּוֹם נַחֲזִיק חִיבּוּר בַּעֲשָׂרוֹת: מְאַחֲדִים עֲשָׂרוֹת וַאֲחָדוֹת בִּשְׁלָבִים.",
  teachingSteps: [
    "מְסַדְּרִים אֶת הַמִּסְפָּרִים לְפִי עֲמֻדּוֹת.",
    "קוֹדֶם מְחַבְּרִים אֶת הָאֲחָדוֹת, אַחַר כָּךְ אֶת הָעֲשָׂרוֹת.",
    "אִם יֵשׁ עֲשָׂרָה אֲחָדוֹת — מַחְלִיפִים לְעֲשָׂרָה בַּעֲמֻדָּה הַבָּאָה.",
  ],

  mainTags: ["addition", "place-value"],
  spiralReviewTags: ["place-value", "patterns"],
  arithmeticPrompt: "לְרוֹנִי יֵשׁ 30 מַדְבֵּקוֹת, לְמֵיַי יֵשׁ 20. כַּמָּה מַדְבֵּקוֹת יֵשׁ לָהֶם יַחַד?",
  arithmeticAnswer: 50,
  arithmeticMcOptions: ["40", "50", "60"],
  arithmeticMcAnswer: "50",
  languagePrompt: "בִּחְרוּ: אֵיךְ כּוֹתְבִים בְּעִבְרִית אֶת הַמִּסְפָּר 50?",
  languageOptions: ["אַרְבָּעִים", "חֲמִישִּׁים", "שִׁשִּׁים"],
  languageAnswer: "חֲמִישִּׁים",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 40 + 10 = 60",
  reviewAnswer: false,
  challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-0 עַד 20 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת עָשִׂינוּ?",
  challengeAnswer: 4,
};
