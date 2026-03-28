import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 15,
  title: "חִזּוּק: חִיבּוּר וְחִיסּוּר עַד 20",
  objective:
    "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְתַרְגֵּל חִיבּוּר וְחִיסּוּר בִּטְוַח עַד 20 בְּבִטָּחוֹן.",
  mainTags: ["addition", "subtraction"],
  spiralReviewTags: ["place-value", "word-problems", "number-line"],
  arithmeticPrompt: "בַּגַּן הָיוּ 14 יְלָדִים. עוֹד 5 הִצְטָרְפוּ. כַּמָּה יֵשׁ עַכְשָׁיו?",
  arithmeticAnswer: 19,
  arithmeticMcOptions: ["18", "19", "20"],
  arithmeticMcAnswer: "19",
  verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 17",
  verbalAnswer: "שְׁבַע עֶשְׂרֵה",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 12 + 8 = 20",
  reviewAnswer: true,
  challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-3 עַד 13 בִּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת?",
  challengeAnswer: 5,
  geometryPrompt: "אֵיזוֹ צוּרָה אֵין לָהּ פִּנּוֹת?",
  geometryAnswer: "circle",
};
