import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 27,
  title: "בְּעָיוֹת מִילּוּלִיּוֹת מְשֻׁלָּבוֹת",
  objective:
    "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִקְרַא בְּעָיָה בִּשְׁנֵי שְׁלָבִים פְּשׁוּטִים וְיִפְתֹּר.",
  mainTags: ["word-problems", "addition", "subtraction"],
  spiralReviewTags: ["place-value", "number-line"],
  arithmeticPrompt: "בַּגַּן הָיוּ 16 כַּדּוּרִים. 7 נִלְקְחוּ, וְאַחַר כָּךְ הוּבְאוּ עוֹד 5. כַּמָּה כַּדּוּרִים יֵשׁ עַכְשָׁיו?",
  arithmeticAnswer: 14,
  arithmeticMcOptions: ["13", "14", "15"],
  arithmeticMcAnswer: "14",
  verbalPrompt:
    "כְּשֶׁכָּתוּב 'נִשְׁאֲרוּ' אַחֲרֵי שֶׁיֹּדְעִים כַּמָּה הָיוּ בַּהַתְחָלָה — כִּתְבוּ: חִיבּוּר אוֹ חִיסּוּר.",
  verbalAnswer: "חִיסּוּר",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 20 + 10 - 5 = 25",
  reviewAnswer: true,
  challengePrompt: "נַעַר קִבֵּל 9 מַדְבֵּקוֹת, הִפְסִיד 4, וְקִבֵּל עוֹד 6. כַּמָּה יֵשׁ לוֹ עַכְשָׁיו?",
  challengeAnswer: 11,
  geometryPrompt: "אֵיזוֹ צוּרָה לְרֹב יֵשׁ לָהּ 4 צְלָעוֹת?",
  geometryAnswer: "rectangle",
};
