import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 5,
  title: "הַשְׁוָאַת מִסְפָּרִים",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לְהַשְׁווֹת זוּגוֹת מִסְפָּרִים עַד 20 וּלְזַהוֹת מִי גָּדוֹל, מִי קָטָן וּמִי שָׁוֶה בְּ-80% הַצְלָחָה.",
  mainTags: ["comparing", "number-recognition"],
  spiralReviewTags: ["addition", "subtraction"],
  arithmeticPrompt: "אֵיזֶה מִסְפָּר גָּדוֹל יוֹתֵר: 14 אוֹ 11? כִּתְבוּ אֶת הַמִּסְפָּר הַגָּדוֹל.",
  arithmeticAnswer: 14,
  arithmeticMcOptions: ["14", "11", "שָׁוִים"],
  arithmeticMcAnswer: "14",
  verbalPrompt: "כִּתְבוּ בְּעִבְרִית אֶת הַמִּסְפָּר: 10",
  verbalAnswer: "עֶשֶׂר",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 9 גָּדוֹל מִ-13",
  reviewAnswer: false,
  challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-6 עַד 16 בִּקְפִיצוֹת שֶׁל 2. שִׂימוּ לֵב — הַמִּסְפָּרִים שֶׁנּוֹגְעִים הֵם זוּגִיִּים! כַּמָּה קְפִיצוֹת?",
  challengeAnswer: 5,
};
