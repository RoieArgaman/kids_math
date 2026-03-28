import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 14,
  title: "זְמַן וְשָׁעוֹן",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִקְרָא שָׁעוֹת שָׁלֵמוֹת בְּשָׁעוֹן דִּגּוּטָלִי פָּשׁוּט.",
  mainTags: ["measurement-time", "number-recognition"],
  spiralReviewTags: ["measurement-weight", "patterns"],
  arithmeticPrompt: "שְׁעָתַיִם = כַּמָּה דַּקּוֹת?",
  arithmeticAnswer: 120,
  arithmeticMcOptions: ["60", "90", "120"],
  arithmeticMcAnswer: "120",
  verbalPrompt: "כִּתְבוּ: חֲצִי שָׁעָה = כַּמָּה דַּקּוֹת?",
  verbalAnswer: "שְׁלוֹשִׁים",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: אַחַר הַשָּׁעָה 2 בָּאָה 3",
  reviewAnswer: true,
  challengePrompt: "הִתְחִילוּ בְּ-7 וְהִמְשִׁיכוּ שָׁעָה אַחַת. לְאֵיזוֹ שָׁעָה הִגִּיעוּ? (מספר)",
  challengeAnswer: 8,
};
