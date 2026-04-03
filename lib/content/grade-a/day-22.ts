import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 22,
  title: "כֶּפֶל כַּחֲזָרַת חִיבּוּר",
  objective:
    "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְהַבִּיעַ כֶּפֶל קָטָן (לְמָשָׁל 3×4) כְּחִיבּוּר חוֹזֵר וּלִפְתּוֹר בְּמִסְפָּרִים קְטַנִּים.",  teachingSummary:
    "כֶּפֶל כַּחֲזָרַת חִיבּוּר שָׁוֶה: קְבוּצוֹת שָׁווֹת שֶׁל אוֹבְיֶקְטִים.",
  teachingSteps: [
    "מְזַהִים כַּמָּה קְבוּצוֹת זֶהֶה וְכַמָּה בְּכָל קְבוּצָה.",
    "מְחַבְּרִים חִיבּוּר חוֹזֵר אוֹ מִסְפָּר כֶּפֶל קָצָר.",
    "בּוֹדְקִים בִּצְיּוּר: הַאִם כִּיסֵינוּ אֶת הַכֹּל.",
  ],

  mainTags: ["multiplication-intro", "addition"],
  spiralReviewTags: ["patterns", "gematria-letters"],
  arithmeticPrompt:
    'חַשְּׁבוּ 4 + 4 + 4 (כְּלוֹמַר "שָׁלוֹשׁ פְּעָמִים אַרְבַּע")',
  arithmeticAnswer: 12,
  arithmeticMcOptions: ["10", "11", "12"],
  arithmeticMcAnswer: "12",
  languagePrompt:
    "בִּחְרוּ בִּמִילִים אֶת הַתּוֹצָאָה: 5 + 5 + 5 + 5 (אַרְבַּע פְּעָמִים חָמֵשׁ):",
  languageOptions: ["חֲמֵשׁ עֶשְׂרֵה", "עֶשְׂרִים", "עֶשְׂרִים וַחֲמֵשׁ"],
  languageAnswer: "עֶשְׂרִים",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 2 × 6 שָׁוֶה לְ 6 + 6",
  reviewAnswer: true,
  challengePrompt:
    "עַל קַו מִסְפָּרִים: מִתְחִילִים בְּ-0 וְקוֹפְצִים בְּ-4 חָמֵשׁ פְּעָמִים. עַל אֵיזֶה מִסְפָּר נֶעֱצְרִים?",
  challengeAnswer: 20,
  geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ אַרְבַּע צְלָעוֹת שָׁווֹת וְאַרְבַּע פִּנּוֹת יְשָׁרוֹת?",
  geometryAnswer: "square",
};
