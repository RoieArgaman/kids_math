import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 10,
  title: "עֵרֶךְ הַמָּקוֹם בַּעֲשָׂרוֹת",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְזַהוֹת אֶת מִסְפַּר הָעֲשָׂרוֹת וְהָאֲחָדוֹת בְּכָל מִסְפָּר עַד 99 בְּ-80% הַצְלָחָה.",
  mainTags: ["place-value", "number-recognition"],
  spiralReviewTags: ["patterns", "subtraction"],
  arithmeticPrompt: "בְּכִיתָּה יֵשׁ 34 יְלָדִים. הַמּוֹרָה אוֹמֶרֶת: 34 = 3 עֲשָׂרוֹת + 4 אֲחָדוֹת. כַּמָּה עֲשָׂרוֹת יֵשׁ בַּמִּסְפָּר 34?",
  arithmeticAnswer: 3,
  arithmeticMcOptions: ["3", "4", "7"],
  arithmeticMcAnswer: "3",
  verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 20",
  verbalAnswer: "עֶשְׂרִים",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: בַּמִּסְפָּר 52 יֵשׁ 5 עֲשָׂרוֹת וּ-2 אֲחָדוֹת",
  reviewAnswer: true,
  challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-10 עַד 30 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת עָשִׂינוּ?",
  challengeAnswer: 4,
};
