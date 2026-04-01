import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 6,
  title: "חִיבּוּר וְחִיסּוּר עַד 20",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יוּכַל לִפְתּוֹר תַּרְגִּילֵי חִיבּוּר וְחִיסּוּר מְעוֹרָבִים עַד 20 בְּ-4 מִתּוֹךְ 5 מְשִׂימוֹת.",
  mainTags: ["addition", "subtraction", "number-line"],
  spiralReviewTags: ["comparing", "addition"],
  arithmeticPrompt: "בְּכִיתָּה יֵשׁ 12 בָּנִים וְ-5 בָּנוֹת. כַּמָּה יְלָדִים יֵשׁ בַּסַּךְ הַכֹּל?",
  arithmeticAnswer: 17,
  arithmeticMcOptions: ["16", "17", "18"],
  arithmeticMcAnswer: "17",
  languagePrompt: "בִּחְרוּ: אֵיךְ כּוֹתְבִים בְּעִבְרִית אֶת הַמִּסְפָּר 12?",
  languageOptions: ["אַחַת עֶשְׂרֵה", "שְׁתֵּים עֶשְׂרֵה", "שְׁלוֹשׁ עֶשְׂרֵה"],
  languageAnswer: "שְׁתֵּים עֶשְׂרֵה",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 18 - 7 = 11",
  reviewAnswer: true,
  challengePrompt: "עַל קַו הַמִּסְפָּרִים: מִ-1 עַד 11 בִּקְפִיצוֹת שֶׁל 2. שִׂימוּ לֵב — אֵלּוּ מִסְפָּרִים אי-זוּגִיִּים! כַּמָּה קְפִיצוֹת?",
  challengeAnswer: 5,
};
