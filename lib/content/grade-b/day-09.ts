import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 9,
  title: "חֲצִי וְרֶבַע",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַזְהֶה חֲצִי וְרֶבַע בְּדִמּוּי פָּשׁוּט.",
  mainTags: ["fractions-parts", "comparing"],
  spiralReviewTags: ["division-equal-groups", "geometry-shapes"],
  arithmeticPrompt: "פִּיצָה אַחַת — חָתְכוּ לְ-2 חֲצָאִים שָׁווִים. כַּמָּה חֲצָאִים?",
  arithmeticAnswer: 2,
  arithmeticMcOptions: ["1", "2", "4"],
  arithmeticMcAnswer: "2",
  languagePrompt: "בִּחְרוּ: כַּמָּה רְבָעִים בְּשָׁלֵם אֶחָד?",
  languageOptions: ["אַרְבַּע", "שְׁנַיִם", "שָׁלוֹשׁ"],
  languageAnswer: "אַרְבַּע",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: חֲצִי מִשָׁלֵם גָּדוֹל מֵרֶבַע מִמֶּנּוּ",
  reviewAnswer: true,
  challengePrompt: "יֵשׁ 4 כִּיסִים וּבְכָל כִּיס 3 אֲבָנִים. כַּמָּה בַּסַּךְ?",
  challengeAnswer: 12,
  geometryPrompt: "אֵיזוֹ צוּרָה נִיתָן לְחַלֵּק לִשְׁנֵי חֲצָאִים שָׁווִים בְּקִפּוּל?",
  geometryAnswer: "circle",
};
