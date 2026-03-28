import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 24,
  title: "עֶרֶךְ מָקוֹם וְהַרְחָבָה",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַפְרִיד עֲשָׂרוֹת וַאֲחָדוֹת וִיחַבֵּר בְּמִסְפָּרִים עַד 100.",
  mainTags: ["place-value", "addition"],
  spiralReviewTags: ["number-line", "multiplication-tables"],
  arithmeticPrompt: "חַשְּׁבוּ 56 + 38",
  arithmeticAnswer: 94,
  arithmeticMcOptions: ["84", "94", "95"],
  arithmeticMcAnswer: "94",
  verbalPrompt: "כִּתְבוּ: בַּמִּסְפָּר 81 הָאֶחָד הַשְּׂמָאלִי מַצִּיג __",
  verbalAnswer: "עֲשָׂרוֹת",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 90 + 9 = 99",
  reviewAnswer: true,
  challengePrompt: "בַּכִּיתָּה 100 סְפָרִים. 37 הֵם בְּעִבְרִית. כַּמָּה לֹא בְּעִבְרִית?",
  challengeAnswer: 63,
};
