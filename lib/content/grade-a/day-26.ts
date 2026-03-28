import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 26,
  title: "סִיכּוּם הַשְׁלָמָה",
  objective:
    "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִשַׁזֵּר רַעֲיוֹנוֹת מֵהַחֹמֶר שֶׁנִּלְמַד — מִדִּידָה, זְמַן, סִימֶטְרְיָה, גִּימַטְרְיָה, כֶּפֶל כַּחִיבּוּר חוֹזֵר וּקְשָׁרִים לַ-10.",
  mainTags: [
    "measurement-length",
    "measurement-time",
    "symmetry-transform",
    "gematria-letters",
    "multiplication-intro",
    "number-bonds",
  ],
  spiralReviewTags: ["place-value", "word-problems", "geometry-shapes", "patterns"],
  arithmeticPrompt:
    "שְׁנֵי קֻפְסָאוֹת שְׁקֵנִים: אָרְכָּן שֶׁל כָּל אַחַת 8 ס״מ וְהֵן מְסוּדָּרוֹת זוֹ אָחֲרֵי זוֹ בְּקַו. כַּמָּה ס״מ בַּסַּךְ הַכֹּל?",
  arithmeticAnswer: 16,
  arithmeticMcOptions: ["14", "16", "18"],
  arithmeticMcAnswer: "16",
  verbalPrompt:
    "כִּתְבוּ בִּמִילִים: כַּמָּה צָרִיךְ לְהַחְסִיר מִ-18 כְּדֵי לְהַגִּיעַ לְ-10?",
  verbalAnswer: "שְׁמוֹנֶה",
  reviewPrompt:
    "אֱמֶת אוֹ שֶׁקֶר: רִיבּוּעַ נִשְׁאָר דּוֹמֶה לְעַצְמוֹ אַחֲרֵי שִׁיקּוּף אוֹפְקִי",
  reviewAnswer: true,
  challengePrompt:
    "גִּימַטְרְיָה: חַשְּׁבוּ ד (4) + ו (6), וְאָז הַחְסִירוּ 3. מָה הַמִּסְפָּר הַסּוֹפִי?",
  challengeAnswer: 7,
  geometryPrompt: "אֵיזוֹ צוּרָה יֵשׁ לָהּ שָׁלוֹשׁ צְלָעוֹת?",
  geometryAnswer: "triangle",
};
