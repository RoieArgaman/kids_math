import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 25,
  title: "מִסְפָּרִים עַד 100",
  objective:
    "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִזְהֶה עֲשָׂרוֹת וַאֲחָדוֹת בִּמִסְפָּרִים עַד 100.",
  mainTags: ["place-value", "number-recognition"],
  spiralReviewTags: ["comparing", "patterns"],
  arithmeticPrompt: "בַּמִּסְפָּר 73 כַּמָּה עֲשָׂרוֹת יֵשׁ?",
  arithmeticAnswer: 7,
  arithmeticMcOptions: ["3", "7", "73"],
  arithmeticMcAnswer: "7",
  languagePrompt: "בִּחְרוּ בִּמִילִים: 90",
  languageOptions: ["שְׁמוֹנִים", "תִּשְׁעִים", "מֵאָה"],
  languageAnswer: "תִּשְׁעִים",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: בַּמִּסְפָּר 88 יֵשׁ 8 אֲחָדוֹת",
  reviewAnswer: true,
  challengePrompt: "עַל קַו מִסְפָּרִים: מִ-60 עַד 80 בִּקְפִיצוֹת שֶׁל 5. כַּמָּה קְפִיצוֹת?",
  challengeAnswer: 4,
  geometryPrompt: "אֵיזוֹ צוּרָה אֲרוּכָּה (כְּמוֹ דֶּלֶת) וְיֵשׁ לָהּ 4 צְלָעוֹת?",
  geometryAnswer: "rectangle",
};
