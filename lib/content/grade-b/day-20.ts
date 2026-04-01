import type { DayConcept } from "../engine/day-builder";

export const concept: DayConcept = {
  dayNumber: 20,
  title: "שָׁלֵם וְחֵלֶק",
  objective: "בְּסוֹף הַיּוֹם הַתַּלְמִיד/ה יִקְשֹׁר בֵּין שְׁלֵם וּבֵין חֲצִי וְרֶבַע בִּתְמוּנָה.",
  mainTags: ["fractions-parts", "comparing"],
  spiralReviewTags: ["division-equal-groups", "patterns"],
  arithmeticPrompt: "כַּמָּה שְׁלִישִׁים יֵשׁ בְּשָׁלֵם אֶחָד?",
  arithmeticAnswer: 3,
  arithmeticMcOptions: ["2", "3", "4"],
  arithmeticMcAnswer: "3",
  languagePrompt: "בִּחְרוּ: חֲצִי מִ-10 זֶה —",
  languageOptions: ["חָמֵשׁ", "שָׁלוֹשׁ", "שֶׁבַע"],
  languageAnswer: "חָמֵשׁ",
  reviewPrompt: "אֱמֶת אוֹ שֶׁקֶר: רֶבַע הוּא אוֹתוֹ דָּבָר כְּ-25 מֵאָה",
  reviewAnswer: false,
  challengePrompt: "כַּמָּה הוּא חֲצִי מִ-16?",
  challengeAnswer: 8,
};
