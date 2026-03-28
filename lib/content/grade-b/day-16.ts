import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 16,
  title: "צוּרוֹת וְזָווִיּוֹת",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יַזְכִּיר מְצוּלָבִים וּרְבוּעִים בְּשָׂפָה.",
  mainTags: ["geometry-shapes", "symmetry-transform"],
  spiralReviewTags: ["geometry-solids", "comparing"],
  arithmeticPrompt: "לִמְשֻׁלָּשׁ יֵשׁ בְּדִיּוּק כַּמָּה צְלָעוֹת?",
  arithmeticAnswer: 3,
  arithmeticMcOptions: ["2", "3", "4"],
  arithmeticMcAnswer: "3",
  verbalPrompt: "כִּתְבוּ בִּמִילִים: 8",
  verbalAnswer: "שְׁמוֹנֶה",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: רִיבּוּעַ הוּא סוּג שֶׁל מַלְבֵּן",
  reviewAnswer: true,
  challengePrompt: "בְּמַטְרִיצָה 3×3 — כַּמָּה רִיבּוּעִים קְטַנִּים?",
  challengeAnswer: 9,
  geometryPrompt: "אֵיזוֹ צוּרָה אֵין לָהּ צְלָעוֹת יְשָׁרוֹת?",
  geometryAnswer: "circle",
};
