import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 8,
  title: "חִלּוּק לִשְׁתֵּי קְבוּצוֹת שָׁווֹת",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יְבִין חִלּוּק כְּחִלּוּק שָׁוֶה לִשְׁתַּיִם.",
  mainTags: ["division-equal-groups", "multiplication-intro"],
  spiralReviewTags: ["multiplication-tables", "word-problems"],
  arithmeticPrompt: "16 סְפָרִים חִלְּקוּ לִשְׁתֵּי מִדָּפִים שָׁווִים. כַּמָּה בְּכָל מִדָּף?",
  arithmeticAnswer: 8,
  arithmeticMcOptions: ["6", "8", "10"],
  arithmeticMcAnswer: "8",
  verbalPrompt: "כִּתְבוּ: מְחַלְּקִים 12 לְ-3 קְבוּצוֹת שָׁווֹת — כַּמָּה בְּכָל קְבוּצָה?",
  verbalAnswer: "אַרְבַּע",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: אִם חִילְּקוּ 18 לִשְׁתַּיִם שָׁווֹת — מְקַבְּלִים 9",
  reviewAnswer: true,
  challengePrompt: "20 בָּלוֹנִים בִּשְׁתֵּי צְבָעִים בִּכְמִיוּת שָׁוָה. כַּמָּה מִכָּל צֶבַע?",
  challengeAnswer: 10,
};
