import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 29,
  title: "מִבְחָן מְסַכֵּם — כִּיתָּה א׳",
  objective:
    "בְּסוֹף הַמִּבְחָן הַתַּלְמִיד/ה יַרְאֶה שְׁלִיטָה בְּחוֹמֶר שֶׁנִּלְמַד בְּכִיתָּה א׳ — בִּשְׁאֵלוֹת מִבַּנְק שֶׁמִּתְחַלֵּף.",  teachingSummary:
    "מִבְחָן מְסַכֵּם: קִרְאוּ כָּל שְׁאֵלָה פַּעֲמַיִם. אֵין צֹרֶךְ לְמַהֵר — צֹרֶךְ לְהִתְמַקֵּד.",
  teachingSteps: [
    "מַדְלִּיגִים שְׁאֵלָה קָשָׁה וְחוֹזְרִים אֵלֶיהָ אִם נִשְׁאַר זְמַן.",
    "בּוֹדְקִים שֶׁהֶעָנִיתֶם עַל מָה שֶׁהוּא שָׁאַל בִּפְשׁוּט.",
    "נוֹשְׁמִים — טָעוּת אַחַת לֹא מַגְדִּירָה אֶת כֻּלָּכֶם.",
  ],

  mainTags: [
    "counting",
    "number-recognition",
    "number-line",
    "addition",
    "subtraction",
    "comparing",
    "word-problems",
    "geometry-shapes",
    "patterns",
    "place-value",
    "measurement-length",
    "measurement-time",
    "symmetry-transform",
    "gematria-letters",
    "multiplication-intro",
    "number-bonds",
  ],
  spiralReviewTags: ["addition", "subtraction", "counting", "number-recognition", "number-line"],
  arithmeticPrompt: "מִבְחָן מְסַכֵּם: מַתְחִילִים!",
  arithmeticAnswer: 0,
  arithmeticMcOptions: ["0", "1", "2"],
  arithmeticMcAnswer: "0",
  languagePrompt: "בִּחְרוּ בְּמִילִים: 10",
  languageOptions: ["תֵּשַׁע", "עֶשֶׂר", "אַחַת עֶשְׂרֵה"],
  languageAnswer: "עֶשֶׂר",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 10 גָּדוֹל מִ-9",
  reviewAnswer: true,
  challengePrompt: "מִבְחָן מְסַכֵּם: בּוֹחֲרִים שְׁאֵלוֹת מִבַּנְק.",
  challengeAnswer: 0,
  geometryPrompt: "אֵיזוֹ צוּרָה הִיא מְשֻׁלָּשׁ?",
  geometryAnswer: "triangle",
};
