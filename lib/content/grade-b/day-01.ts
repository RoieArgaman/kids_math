import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 1,
  title: "מִסְפָּרִים וְהַשְׁוָאָה עַד 100",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַזְהֶה עֲשָׂרוֹת וַאֲחָדוֹת וְיַשְׁוֶה מִסְפָּרִים עַד 99.",
  mainTags: ["place-value", "comparing"],
  spiralReviewTags: ["number-recognition", "number-line"],
  arithmeticPrompt: "בַּמִּסְפָּר 47 — כַּמָּה עֲשָׂרוֹת יֵשׁ?",
  arithmeticAnswer: 4,
  arithmeticMcOptions: ["4", "7", "47"],
  arithmeticMcAnswer: "4",
  verbalPrompt: "כִּתְבוּ בִּמִילִים: 63",
  verbalAnswer: "שִׁשִּׁים וְשָׁלוֹשׁ",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 58 גָּדוֹל מִ-85",
  reviewAnswer: false,
  challengePrompt: "עַל קַו מִסְפָּרִים: מִ-20 עַד 40 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת?",
  challengeAnswer: 4,
  geometryPrompt: "אֵיזוֹ צוּרָה הִיא מַלְבֵּן?",
  geometryAnswer: "rectangle",
};
