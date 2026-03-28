import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 28,
  title: "סִיכּוּם לִפְנֵי הַמִּבְחָן",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַרְגִּישׁ בִּטָּחוֹן בְּחִיבּוּר, חִיסּוּר, כֶּפֶל, חִלּוּק בָּסִיסִי וּבְעָיוֹת.",
  mainTags: ["word-problems", "multiplication-tables", "place-value"],
  spiralReviewTags: ["comparing", "fractions-parts", "measurement-length"],
  arithmeticPrompt: "חַשְּׁבוּ 4 × 7 + 15",
  arithmeticAnswer: 43,
  arithmeticMcOptions: ["41", "43", "45"],
  arithmeticMcAnswer: "43",
  verbalPrompt: "כִּתְבוּ בִּמִילִים: 50",
  verbalAnswer: "חֲמִישִּׁים",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: 100 - 1 = 99",
  reviewAnswer: true,
  challengePrompt: "מַחִיר שְׁנֵי חֲבִילוֹת: חַשְּׁבוּ 29 + 29",
  challengeAnswer: 58,
  geometryPrompt: "אֵיזוֹ צוּרָה פָּשׁוּטָה מְתַאֶרֶת «שָׁלֵם סביב»?",
  geometryAnswer: "circle",
};
