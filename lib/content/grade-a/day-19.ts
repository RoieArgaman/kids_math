import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 19,
  title: "הַזָּזָה וְשִׁיקּוּף",
  objective:
    "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְהַבְדִּיל בֵּין הַזָּזָה (בְּלִי סִיבּוּב) לְבֵין שִׁיקּוּף, וְלִזְהוֹת צוּרָה סִימֶטְרִית שֶׁנִּשְׁאֶרֶת דּוֹמָה אַחֲרֵי שִׁיקּוּף אוֹפְקִי.",
  mainTags: ["symmetry-transform", "geometry-shapes"],
  spiralReviewTags: ["measurement-time", "number-recognition"],
  arithmeticPrompt:
    "עַל קַו מִסְפָּרִים מִסְפָּרִים נְקֻדּוֹת: מִ-5 עוֹבְרִים שְׁנֵי מָקוֹמוֹת יָמִינָה. בְּאֵיזֶה מִסְפָּר נֶעֱצְרִים?",
  arithmeticAnswer: 7,
  arithmeticMcOptions: ["6", "7", "8"],
  arithmeticMcAnswer: "7",
  languagePrompt:
    "לְרִיבּוּעַ יֵשׁ אַרְבַּע צְלָעוֹת שָׁווֹת. אַחֲרֵי שִׁיקּוּף אוֹפְקִי — עוֹדֶנּוּ רִיבּוּעַ? בִּחְרוּ: כֵּן אוֹ לֹא.",
  languageOptions: ["כן", "לא", "אולי"],
  languageAnswer: "כן",
  reviewPrompt:
    "אֱמֶת אוֹ שֶׁקֶר: הַזָּזָה לְצַד הִיא תָּמִיד מְשַׁנָּה אֶת גֹּדֶל הַצוּרָה",
  reviewAnswer: false,
  challengePrompt:
    "בְּרֶצֶף הַמִּסְפָּרִים: 4, 5, 6, 7 — מַזִּיזִים אֶת הָרִיבּוּעַ שֶׁעַל 6 שְׁנֵי מָקוֹמוֹת יָמִינָה. עַל אֵיזֶה מִסְפָּר הוּא עַכְשָׁיו?",
  challengeAnswer: 8,
  geometryPrompt:
    "אֵיזוֹ צוּרָה נִשְׁאֶרֶת 'אוֹתָהּ צוּרָה' (דּוֹמָה לְעַצְמָהּ) אַחֲרֵי שִׁיקּוּף אוֹפְקִי?",
  geometryAnswer: "square",
};
