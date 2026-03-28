import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 22,
  title: "בְּעִיָּה בִּשְׁנֵי שְׁלָבִים",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִפְתֹּר בְּעִיָּה שֶׁדּוֹרֶשֶׁת שְׁנֵי צְעָדִים.",
  mainTags: ["word-problems", "addition", "subtraction"],
  spiralReviewTags: ["money-shekel", "number-line"],
  arithmeticPrompt: "בַּגַּן 60 יְלָדִים. 15 יָצְאוּ וְאַחַר כָּךְ חָזְרוּ 8. כַּמָּה עַכְשָׁיו?",
  arithmeticAnswer: 53,
  arithmeticMcOptions: ["51", "53", "57"],
  arithmeticMcAnswer: "53",
  verbalPrompt: "כִּתְבוּ: בְּאֵיזֶה צְעַד לִפְעָמִים מַחְסִירִים וְאַחַר כָּךְ מוֹסִיפִים?",
  verbalAnswer: "קוֹדֶם מַחְסִירִים אַחַר כָּךְ מוֹסִיפִים",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 40 + 10 - 5 = 45",
  reviewAnswer: true,
  challengePrompt: "דֶּפִי צִבְעוֹן: 3 חֲבִילוֹת שֶׁל 8 וְעוֹד 12 דָּפִים. כַּמָּה דָּפִים?",
  challengeAnswer: 36,
};
