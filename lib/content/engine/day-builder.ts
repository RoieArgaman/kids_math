import type { DifficultyLevel, Section, WorkbookDay } from "@/lib/types";

import {
  type DayConcept,
  multipleChoice,
  numberInput,
  numberLineJump,
  shapeChoice,
  toDayId,
  toSectionId,
  trueFalse,
} from "./exercise-factories";
import { buildExpandedExercisesForDay } from "./expanded-days";
import { buildExpandedExercisesForEarlyDays } from "./expanded-early";
import { buildProgressiveConceptFocusSection } from "./progressive-focus";
import { buildSpiralWarmupExercises } from "./warmup-generator";

export type { DayConcept };

export type BuildDaySectionOptions = {
  simpleSections: boolean;
  /** כיתה ב׳ (וימים < 29): אחרי חימום — מקטע מושג היום מורחב שנבנה רק מ־DayConcept */
  progressiveConceptFocus?: boolean;
};

export function buildDayFromConcepts(
  allConcepts: DayConcept[],
  concept: DayConcept,
  options: BuildDaySectionOptions,
): WorkbookDay {
  const { simpleSections, progressiveConceptFocus } = options;
  const dayDifficulty = Math.min(5, Math.ceil(concept.dayNumber / 3)) as DifficultyLevel;
  const week = concept.dayNumber >= 29 ? 5 : Math.min(4, Math.ceil(concept.dayNumber / 7));
  const priorConcepts = allConcepts.filter(
    (c) => c.dayNumber < concept.dayNumber && c.dayNumber >= concept.dayNumber - 3,
  );

  const defaultSections: Section[] = [
    {
      id: toSectionId(concept.dayNumber, 1),
      title: "חִימּוּם וַחֲזָרַת סְפִּירָלָה",
      type: "warmup",
      learningGoal: "לְהִיזָּכֵר בְּנוֹשְׂאִים מִיָּמִים קוֹדְמִים בְּ-3–4 תַּרְגּוּלִים קְצָרִים.",
      prerequisiteSkillTags: concept.spiralReviewTags,
      exercises: buildSpiralWarmupExercises(concept, priorConcepts, dayDifficulty),
    },
    {
      id: toSectionId(concept.dayNumber, 2),
      title: "מוּשָׂג הַיּוֹם - מִתְנַסִּים",
      type: "arithmetic",
      learningGoal: "לְהָבִין אֶת מוּשַׂג הַיּוֹם בְּמַעֲבָר מִמּוּחָשִׁי, לְיִיצּוּגִי, וּלְסִמְלִי.",
      prerequisiteSkillTags: concept.mainTags,
      example: {
        title: "דֻּגְמָה פְּתוּרָה",
        prompt: concept.arithmeticPrompt,
        steps: [
          "קוֹרְאִים אֶת הַשְּׁאֵלָה וּמְזַהִים מָה יָדוּעַ.",
          "בוֹחֲרִים דֶּרֶךְ פְּתִירָה מַתְאִימָה (סְפִירָה, קַו מִסְפָּרִים אוֹ פֵּרוּק).",
          `פּוֹתְרִים שָׁלָב אַחַר שָׁלָב וּמְקַבְּלִים: ${concept.arithmeticAnswer}.`,
          "בּוֹדְקִים שֶׁהַתְּשׁוּבָה הַגְיוֹנִית לְפִי הַשְּׁאֵלָה.",
        ],
        takeaway: "רַעְיוֹן מֶרְכָּזִי: פּוֹתְרִים בִּשְׁלָבִים קְצָרִים וּבוֹדְקִים אֶת הַתּוֹצָאָה.",
      },
      exercises: [
        numberInput(
          concept.dayNumber,
          2,
          1,
          concept.arithmeticPrompt,
          concept.arithmeticAnswer,
          concept.mainTags,
          dayDifficulty,
          "concrete",
        ),
        multipleChoice(
          concept.dayNumber,
          2,
          2,
          "בַּחֲרוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
          concept.arithmeticMcOptions,
          concept.arithmeticMcAnswer,
          concept.mainTags,
          dayDifficulty,
          "pictorial",
        ),
        numberLineJump(
          concept.dayNumber,
          2,
          3,
          concept.dayNumber <= 8
            ? "הַשְׁלִימוּ קְפִיצוֹת עַל קַו הַמִּסְפָּרִים."
            : "הַשְׁלִימוּ קְפִיצוֹת עַל קַו הַמִּסְפָּרִים: מִ-0 עַד 20 בִּקְפִיצוֹת שֶׁל 2.",
          concept.dayNumber <= 5 ? 0 : concept.dayNumber <= 8 ? concept.dayNumber : 0,
          concept.dayNumber <= 8 ? 10 : 20,
          concept.dayNumber <= 8 ? 1 : 2,
          concept.dayNumber <= 8 ? 10 - (concept.dayNumber <= 5 ? 0 : concept.dayNumber) : 10,
          ["number-line", ...concept.mainTags],
          dayDifficulty,
          "abstract",
        ),
      ],
    },
    {
      id: toSectionId(concept.dayNumber, 3),
      title: concept.geometryPrompt ? "שָׂפָה מָתֵמָטִית וְצוּרוֹת" : "שָׂפָה מָתֵמָטִית",
      type: concept.geometryPrompt ? "geometry" : "verbal",
      learningGoal: "לְהַסְבִּיר וּלְנַסֵּחַ יֶדַע מָתֵמָטִי בְּמִילִּים וּבְיִיצּוּגִים.",
      prerequisiteSkillTags: concept.mainTags,
      exercises: [
        multipleChoice(
          concept.dayNumber,
          3,
          1,
          concept.languagePrompt,
          concept.languageOptions,
          concept.languageAnswer,
          ["number-recognition"],
          dayDifficulty,
          "pictorial",
        ),
        concept.geometryPrompt && concept.geometryAnswer
          ? shapeChoice(
              concept.dayNumber,
              3,
              2,
              concept.geometryPrompt,
              concept.geometryAnswer,
              ["geometry-shapes"],
              dayDifficulty,
              "concrete",
            )
          : multipleChoice(
              concept.dayNumber,
              3,
              2,
              "אֵיזֶה מִשְׁפָּט מָתֵמָטִי מַתְאִים?",
              ["הַמִּסְפָּר גָּדֵל", "הַמִּסְפָּר קָטֵן", "הַמִּסְפָּר נִשְׁאָר קָבוּעַ"],
              "הַמִּסְפָּר גָּדֵל",
              ["word-problems", "comparing"],
              dayDifficulty,
              "abstract",
            ),
      ],
    },
    {
      id: toSectionId(concept.dayNumber, 4),
      title: "בְּדִיקַת הֲבָנָה",
      type: "review",
      learningGoal: "לְזַהוֹת טָעוּיוֹת נְפוֹצוֹת וּלְבַסֵּס הֲבָנָה מְדוּיֶּקֶת.",
      prerequisiteSkillTags: [...concept.spiralReviewTags, ...concept.mainTags],
      exercises: [
        trueFalse(
          concept.dayNumber,
          4,
          1,
          concept.reviewPrompt,
          concept.reviewAnswer,
          concept.spiralReviewTags,
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          concept.dayNumber,
          4,
          2,
          "פִּתְרוּ מְשִׂימַת בְּדִיקָה קְצָרָה.",
          concept.arithmeticAnswer,
          concept.mainTags,
          dayDifficulty,
          "abstract",
        ),
      ],
    },
    {
      id: toSectionId(concept.dayNumber, 5),
      title: "אֶתְגָּר מְסַכֵּם",
      type: "challenge",
      learningGoal: "לְיַישֵׂם אֶת הַמּוּשָׂגִים בִּמְשִׂימָה מְאַתְגֶּרֶת בְּרָמַת עַצְמָאוּת גְּבוֹהָה.",
      prerequisiteSkillTags: [...concept.mainTags, ...concept.spiralReviewTags],
      exercises: [
        numberInput(
          concept.dayNumber,
          5,
          1,
          concept.challengePrompt,
          concept.challengeAnswer,
          ["number-line", "patterns", ...concept.mainTags],
          dayDifficulty,
          "abstract",
        ),
        multipleChoice(
          concept.dayNumber,
          5,
          2,
          "בַּחֲרוּ דֶּרֶךְ פְּתִירָה מַתְאִימָה.",
          ["סְפִירָה בָּאֶצְבָּעוֹת", "קַו מִסְפָּרִים", "פֵּרוּק לַעֲשָׂרוֹת וַאֲחָדוֹת"],
          concept.dayNumber >= 10 ? "פֵּרוּק לַעֲשָׂרוֹת וַאֲחָדוֹת" : "קַו מִסְפָּרִים",
          ["word-problems", "number-line", "place-value"],
          dayDifficulty,
          "abstract",
        ),
      ],
    },
  ];

  let sections: Section[];
  if (progressiveConceptFocus && concept.dayNumber < 29) {
    sections = [
      defaultSections[0],
      buildProgressiveConceptFocusSection(concept, dayDifficulty),
      ...defaultSections.slice(2),
    ];
  } else if (simpleSections) {
    sections = defaultSections;
  } else if (concept.dayNumber <= 7) {
    sections = buildExpandedExercisesForEarlyDays(concept, dayDifficulty, priorConcepts);
  } else if (concept.dayNumber <= 14) {
    sections = buildExpandedExercisesForDay(concept, dayDifficulty, priorConcepts);
  } else {
    sections = defaultSections;
  }

  return {
    id: toDayId(concept.dayNumber),
    dayNumber: concept.dayNumber,
    title: concept.title,
    week,
    objective: concept.objective,
    spiralReviewTags: concept.spiralReviewTags,
    unlockThresholdPercent: 90,
    sections,
  };
}
