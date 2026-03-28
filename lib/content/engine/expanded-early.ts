import type { DifficultyLevel, Section, SkillTag } from "@/lib/types";

import { countRangePrompt } from "../promptTemplates";
import type { DayConcept } from "./exercise-factories";
import {
  multipleChoice,
  numberInput,
  numberLineJump,
  toSectionId,
  trueFalse,
} from "./exercise-factories";
import { buildSpiralWarmupExercises } from "./warmup-generator";

export const buildExpandedExercisesForEarlyDays = (
  concept: DayConcept,
  dayDifficulty: DifficultyLevel,
  priorConcepts: DayConcept[],
): Section[] => {
  const d = concept.dayNumber;
  const addBase = d + 2;
  const subBase = d + 7;
  const maxForDay = d <= 2 ? d * 5 : 20;
  const focusTag: SkillTag = concept.mainTags[0] ?? "counting";
  const focusTitle = concept.title;
  const countingCap = d === 1 ? 5 : d === 2 ? 10 : maxForDay;
  const spacedFocusOrder = [1, 3, 5, 2, 4, 6];
  const spacedDrillOrder = d <= 2 ? [1, 5, 2, 6, 3, 7, 4, 8] : [1, 3, 5, 7, 2, 4, 6, 8];

  /** יום 3 — חִיבּוּר עַד 10: זוּגוֹת קְבוּעִים לְתִרְגּוּל מְמוּקָּד. */
  const day3AdditionPair = (idx: number): [number, number] => {
    const pairs: [number, number][] = [
      [4, 3],
      [5, 5],
      [2, 7],
      [6, 4],
      [3, 6],
      [8, 2],
      [7, 3],
      [4, 4],
    ];
    const [a, b] = pairs[(idx - 1) % pairs.length] ?? [4, 3];
    return [a, b];
  };

  /** יום 4 — חִיסּוּר עַד 10: מִנּוּעַ ≤ 10, תּוֹצָאָה טְבָעִית לִכִיתָה א׳. */
  const day4SubtractionPair = (idx: number): [number, number] => {
    const pairs: [number, number][] = [
      [9, 4],
      [10, 6],
      [8, 3],
      [7, 2],
      [10, 3],
      [6, 1],
      [9, 5],
      [5, 3],
    ];
    const [m, s] = pairs[(idx - 1) % pairs.length] ?? [9, 4];
    return [m, s];
  };

  const focusNumberPrompt = (idx: number): { prompt: string; answer: number; tags: SkillTag[] } => {
    if (d === 1) {
      const start = Math.max(0, Math.min(4, idx - 1));
      const dayOnePrompts = [
        `סִפְרוּ מִ-${start} עַד 5. כַּמָּה מִסְפָּרִים אוֹמְרִים?`,
        countRangePrompt(start, 5),
        countRangePrompt(start, 5),
        `סִפְרוּ בְּקוֹל: ${start}, ... , 5. כַּמָּה נֶאֱמָרִים בַּסַּךְ הַכֹּל?`,
        `סוֹפְרִים אֶת כָּל הַמִּסְפָּרִים מִ-${start} עַד 5. כַּמָּה יֵשׁ?`,
        `עִבְרוּ מִ-${start} עַד 5 בִּסְפִירָה. כַּמָּה מִסְפָּרִים עוֹבְרִים?`,
      ];
      return {
        prompt: dayOnePrompts[(idx - 1) % dayOnePrompts.length],
        answer: 6 - start,
        tags: ["counting", "number-recognition"],
      };
    }

    if (d === 2) {
      const start = (idx - 1) % 6;
      const end = Math.min(10, start + 4);
      const dayTwoPrompts = [
        countRangePrompt(start, end),
        countRangePrompt(start, end),
        `אִמְרוּ אֶת הַסְּפִירָה ${start} עַד ${end}. כַּמָּה נֶאֱמָר?`,
        `בִּסְפִירָה מִ-${start} לְ-${end}, כַּמָּה מִסְפָּרִים כּוֹלֵל הַטֶּוַח?`,
        `סִפְרָה מֻדְרֶכֶת: מִ-${start} עַד ${end}. כַּמָּה יֵשׁ בַּסְּפִירָה?`,
        countRangePrompt(start, end),
      ];
      return {
        prompt: dayTwoPrompts[(idx - 1) % dayTwoPrompts.length],
        answer: end - start + 1,
        tags: ["counting", "number-recognition"],
      };
    }

    if (d === 3) {
      const [a, b] = day3AdditionPair(idx);
      const dayThreePrompts = [
        `חַשְּׁבוּ: ${a} + ${b}`,
        `חַשְּׁבוּ חִיבּוּר: ${a} + ${b}`,
        `מָה הַתּוֹצָאָה שֶׁל ${a} + ${b}?`,
        `כַּמָּה יֵצֵא בְּ-${a} + ${b}?`,
        `תַּרְגִּיל חִיבּוּר קָצָר: ${a} + ${b}`,
        `תַּרְגִּיל חִיבּוּר: ${a} וְעוֹד ${b}.`,
      ];
      return {
        prompt: dayThreePrompts[(idx - 1) % dayThreePrompts.length],
        answer: a + b,
        tags: ["addition"],
      };
    }

    if (d === 4) {
      const [a, sub] = day4SubtractionPair(idx);
      const dayFourPrompts = [
        `חַשְּׁבוּ: ${a} - ${sub}`,
        `חַשְּׁבוּ חִיסּוּר: ${a} - ${sub}`,
        `מָה הַתּוֹצָאָה בַּתַּרְגִּיל ${a} - ${sub}?`,
        `כַּמָּה יֵצֵא בְּ-${a} - ${sub}?`,
        `תַּרְגִּיל חִיסּוּר קָצָר: ${a} - ${sub}`,
        `תַּרְגִּיל חִיסּוּר: ${a} פָּחוֹת ${sub}.`,
      ];
      return {
        prompt: dayFourPrompts[(idx - 1) % dayFourPrompts.length],
        answer: a - sub,
        tags: ["subtraction"],
      };
    }

    if (d === 5) {
      const left = 8 + idx;
      const right = 10 + (idx % 4);
      const dayFivePrompts = [
        `כִּתְבוּ אֶת הַמִּסְפָּר הַגָּדוֹל יוֹתֵר: ${left} אוֹ ${right}.`,
        `מִי גָּדוֹל יוֹתֵר, ${left} אוֹ ${right}? כִּתְבוּ אֶת הַתְּשׁוּבָה.`,
        `הַשְׁווּ בֵּין ${left} לְ-${right}. מָה הַמִּסְפָּר הַגָּדוֹל?`,
        `בְּחִירַת מִסְפָּר גָּדוֹל: ${left} אוֹ ${right}?`,
        `אֵיזֶה מִסְפָּר גָּדוֹל יוֹתֵר בַּזּוּג ${left}, ${right}?`,
        `רְאוּ אֶת הַזּוּג ${left} וְ-${right}. כִּתְבוּ אֶת הַגָּדוֹל.`,
      ];
      return {
        prompt: dayFivePrompts[(idx - 1) % dayFivePrompts.length],
        answer: Math.max(left, right),
        tags: ["comparing", "number-recognition"],
      };
    }

    if (d === 6) {
      if (idx % 2 === 0) {
        const a = 10 + idx;
        const b = idx <= 4 ? 3 : 4;
        const evenPrompts = [
          `חַשְּׁבוּ חִיבּוּר: ${a} + ${b}`,
          `כַּמָּה יֵשׁ בְּסַךְ הַכֹּל? ${a} וְעוֹד ${b}.`,
          `הוֹסִיפוּ ${b} לְ-${a}. מַה הַתּוֹצָאָה?`,
          `כַּמָּה יֵצֵא בְּ-${a} + ${b}?`,
        ];
        return {
          prompt: evenPrompts[(idx / 2 - 1) % evenPrompts.length],
          answer: a + b,
          tags: ["addition"],
        };
      }
      const a = 18 + idx;
      const b = idx <= 4 ? 4 : 5;
      const oddPrompts = [
        `חַשְּׁבוּ חִיסּוּר: ${a} - ${b}`,
        `מַה נִשְׁאָר אִם מוֹרִידִים ${b} מִ-${a}?`,
        `כַּמָּה יֵצֵא בְּ-${a} - ${b}?`,
        `הַחְסִירוּ ${b} מִ-${a}. מַה הַתְּשׁוּבָה?`,
      ];
      return {
        prompt: oddPrompts[((idx - 1) / 2) % oddPrompts.length],
        answer: a - b,
        tags: ["subtraction"],
      };
    }

    return {
      prompt: `לְאוֹר הָיוּ ${6 + idx} מַדְבֵּקוֹת וְקִבְּלָה עוֹד ${idx <= 4 ? 2 : 3}. כַּמָּה יֵשׁ לָהּ עַכְשָׁיו?`,
      answer: 6 + idx + (idx <= 4 ? 2 : 3),
      tags: ["word-problems", "addition"],
    };
  };

  const focusedDrillPrompt = (idx: number): { prompt: string; answer: number; tags: SkillTag[] } => {
    if (d === 1) {
      const start = Math.max(0, Math.min(4, idx - 1));
      const end = 5;
      const dayOneDrillPrompts = [
        countRangePrompt(start, end),
        countRangePrompt(start, end),
        `הַשְׁלִימוּ סְפִירָה מִ-${start} עַד ${end}. כַּמָּה בַּסַּךְ הַכֹּל?`,
        countRangePrompt(start, end),
        `סוֹפְרִים: ${start}...${end}. כַּמָּה מִסְפָּרִים נֶאֱמָרִים?`,
        `סִפְרָה יְשִׁירָה מִ-${start} עַד ${end}. כַּמָּה יֵשׁ?`,
        countRangePrompt(start, end),
        countRangePrompt(start, end),
      ];
      return {
        prompt: dayOneDrillPrompts[(idx - 1) % dayOneDrillPrompts.length],
        answer: end - start + 1,
        tags: ["counting", "number-recognition"],
      };
    }

    if (d === 2) {
      const start = Math.max(0, idx - 1);
      const end = Math.min(10, start + 5);
      const dayTwoDrillPrompts = [
        `כִּתְבוּ אֶת הַמִּסְפָּר הָאַחֲרוֹן בַּסְּפִירָה מִ-${start} עַד ${end}.`,
        `מַתְחִילִים בְּ-${start} וּמַגִּיעִים לְ-${end}. מָה הַמִּסְפָּר הָאַחֲרוֹן?`,
        `בַּסְּפִירָה ${start} עַד ${end}, אֵיזֶה מִסְפָּר בַּסּוֹף?`,
        `סִיּוּם סְפִירָה: מִ-${start} עַד ${end}. כִּתְבוּ אֶת הָאַחֲרוֹן.`,
        `סִפְרוּ מִ-${start} לְ-${end} וּכְתְבוּ אֶת מִסְפַּר הַסּוֹף.`,
        `בַּטֶּוַח ${start} עַד ${end}, מָה הַמִּסְפָּר שֶׁמַּסְיֵם?`,
        `הַמִּסְפָּר הָאַחֲרוֹן בְּסְפִירָה מִ-${start} עַד ${end} הוּא?`,
        `עִבְרוּ מִ-${start} עַד ${end}. אֵיזֶה מִסְפָּר בָּא בַּסּוֹף?`,
      ];
      return {
        prompt: dayTwoDrillPrompts[(idx - 1) % dayTwoDrillPrompts.length],
        answer: end,
        tags: ["counting", "number-recognition"],
      };
    }

    if (d === 3) {
      const [a, b] = day3AdditionPair(idx);
      const dayThreeDrillPrompts = [
        `חַשְּׁבוּ חִיבּוּר: ${a} + ${b}`,
        `חַשְּׁבוּ אֶת הַתַּרְגִּיל ${a} + ${b}`,
        `מָה תּוֹצָאַת הַחִיבּוּר ${a} + ${b}?`,
        `חִיבּוּר: ${a} וְעוֹד ${b}. כַּמָּה?`,
        `תַּרְגִּיל יוֹם 3: חַשְּׁבוּ ${a} + ${b}`,
        `כִּתְבוּ תְּשׁוּבָה לְ-${a} + ${b}`,
        `חִיבּוּר קָצָר: ${a} וְעוֹד ${b}. כַּמָּה?`,
        `מָה יֵצֵא אִם מוֹסִיפִים ${b} לְ-${a}?`,
      ];
      return {
        prompt: dayThreeDrillPrompts[(idx - 1) % dayThreeDrillPrompts.length],
        answer: a + b,
        tags: ["addition"],
      };
    }

    if (d === 4) {
      const [a, sub] = day4SubtractionPair(idx);
      const dayFourDrillPrompts = [
        `חַשְּׁבוּ חִיסּוּר: ${a} - ${sub}`,
        `חַשְּׁבוּ אֶת הַתַּרְגִּיל ${a} - ${sub}`,
        `מָה תּוֹצָאַת הַחִיסּוּר ${a} - ${sub}?`,
        `חִיסּוּר: ${a} פָּחוֹת ${sub}. כַּמָּה?`,
        `תַּרְגִּיל יוֹם 4: חַשְּׁבוּ ${a} - ${sub}`,
        `כִּתְבוּ תְּשׁוּבָה לְ-${a} - ${sub}`,
        `חִיסּוּר קָצָר: ${a} פָּחוֹת ${sub}. כַּמָּה?`,
        `מָה יֵצֵא אִם נַחְסִיר ${sub} מִ-${a}?`,
      ];
      return {
        prompt: dayFourDrillPrompts[(idx - 1) % dayFourDrillPrompts.length],
        answer: a - sub,
        tags: ["subtraction"],
      };
    }

    if (d === 5) {
      const small = 7 + idx;
      const big = small + (idx % 3) + 1;
      const dayFiveDrillPrompts = [
        `מָה גָּדוֹל יוֹתֵר: ${small} אוֹ ${big}? כִּתְבוּ אֶת הַגָּדוֹל.`,
        `הַשְׁווּ בֵּין ${small} לְ-${big}. מִי גָּדוֹל?`,
        `בִּזְוּג ${small}, ${big} אֵיזֶה מִסְפָּר גָּדוֹל יוֹתֵר?`,
        `כִּתְבוּ אֶת הַמִּסְפָּר הַגָּדוֹל מִבֵּין ${small} וְ-${big}.`,
        `אֵיזֶה מִסְפָּר מְנַצֵּחַ: ${small} אוֹ ${big}?`,
        `מִבֵּין ${small} וְ-${big}, מָה הַמִּסְפָּר הַגָּדוֹל?`,
        `סַמְּנוּ אֶת הַגָּדוֹל בַּזּוּג ${small} וְ-${big}.`,
        `בַּחֲרוּ אֶת הַמִּסְפָּר הַגָּדוֹל יוֹתֵר: ${small} אוֹ ${big}.`,
      ];
      return {
        prompt: dayFiveDrillPrompts[(idx - 1) % dayFiveDrillPrompts.length],
        answer: big,
        tags: ["comparing", "number-recognition"],
      };
    }

    if (d === 6) {
      if (idx % 2 === 0) {
        const a = 11 + idx;
        const b = 4;
        const evenDrillPrompts = [
          `חַשְּׁבוּ: ${a} + ${b}`,
          `מָה הַתּוֹצָאָה שֶׁל ${a} וְעוֹד ${b}?`,
          `הוֹסִיפוּ ${b} לְ-${a} וּכְתְבוּ אֶת הַסְּכוּם.`,
          `תַּרְגִּיל חִיבּוּר: ${a} + ${b}`,
        ];
        return {
          prompt: evenDrillPrompts[(idx / 2 - 1) % evenDrillPrompts.length],
          answer: a + b,
          tags: ["addition"],
        };
      }
      const a = 20 + idx;
      const b = 5;
      const oddDrillPrompts = [
        `חַשְּׁבוּ: ${a} - ${b}`,
        `כַּמָּה נִשְׁאָר מִ-${a} אַחֲרֵי הוֹרָדַת ${b}?`,
        `תַּרְגִּיל חִיסּוּר: ${a} - ${b}`,
        `הַחְסִירוּ ${b} מִ-${a} וּכְתְבוּ תְּשׁוּבָה.`,
      ];
      return {
        prompt: oddDrillPrompts[((idx - 1) / 2) % oddDrillPrompts.length],
        answer: a - b,
        tags: ["subtraction"],
      };
    }

    const startStickers = 8 + idx;
    const add = idx <= 4 ? 2 : 3;
    return {
      prompt: `לְיָד הָיוּ ${startStickers} מַדְבֵּקוֹת. הוּא קִבֵּל עוֹד ${add}. כַּמָּה יֵשׁ לוֹ?`,
      answer: startStickers + add,
      tags: ["word-problems", "addition"],
    };
  };

  return [
    {
      id: toSectionId(d, 1),
      title: "חִימּוּם וַחֲזָרַת סְפִּירָלָה",
      type: "warmup",
      learningGoal: "לְהַתְחִיל בְּהַצְלָחָה עִם 3–4 תַּרְגּוּלִים מִיָּמִים קוֹדְמִים.",
      prerequisiteSkillTags: concept.spiralReviewTags,
      exercises: buildSpiralWarmupExercises(concept, priorConcepts, dayDifficulty),
    },
    {
      id: toSectionId(d, 2),
      title: `מוּשָׂג הַיּוֹם: ${focusTitle}`,
      type: "arithmetic",
      learningGoal: "לְהַעֲמִיק בְּמוּשָׂג הַמֶּרְכָּזִי שֶׁל הַיּוֹם בְּתַרְגּוּל מֻדְרָג.",
      prerequisiteSkillTags: concept.mainTags,
      example: {
        title: "דֻּגְמָה פְּתוּרָה",
        prompt: `דֻּגְמָה: ${concept.arithmeticPrompt}`,
        steps: [
          "קוֹרְאִים אֶת הַשְּׁאֵלָה וּמְזַהִים אֵיזוֹ מְיֻמָּנוּת נִדְרֶשֶׁת.",
          `מְבַצְּעִים אֶת הַפְּעוּלָה בְּשָׁלָבִים קְצָרִים וּמַגִּיעִים לְ-${concept.arithmeticAnswer}.`,
          "בוֹדְקִים שֶׁהַתְּשׁוּבָה הִגְיוֹנִית לְפִי הַסִּפּוּר אוֹ הַתַּרְגִּיל.",
        ],
        takeaway: "רַעְיוֹן זְכִירָה: עוֹבְדִים מְסֻדָּר, שׁוֹמְרִים עַל נוֹשֵׂא הַיּוֹם.",
      },
      exercises: [
        numberInput(
          d,
          2,
          1,
          `דֻּגְמָה: ${concept.arithmeticPrompt} תְּשׁוּבָה ${concept.arithmeticAnswer}. עַכְשָׁיו פִּתְרוּ שְׁאֵלָה דּוֹמָה.`,
          concept.arithmeticAnswer,
          concept.mainTags,
          dayDifficulty,
          "concrete",
          0,
          20,
        ),
        numberInput(
          d,
          2,
          2,
          focusNumberPrompt(spacedFocusOrder[0]).prompt,
          focusNumberPrompt(spacedFocusOrder[0]).answer,
          focusNumberPrompt(spacedFocusOrder[0]).tags,
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          2,
          3,
          focusNumberPrompt(spacedFocusOrder[1]).prompt,
          focusNumberPrompt(spacedFocusOrder[1]).answer,
          focusNumberPrompt(spacedFocusOrder[1]).tags,
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          2,
          4,
          focusNumberPrompt(spacedFocusOrder[2]).prompt,
          focusNumberPrompt(spacedFocusOrder[2]).answer,
          focusNumberPrompt(spacedFocusOrder[2]).tags,
          dayDifficulty,
          "abstract",
        ),
        multipleChoice(
          d,
          2,
          5,
          concept.arithmeticPrompt,
          concept.arithmeticMcOptions,
          concept.arithmeticMcAnswer,
          concept.mainTags,
          dayDifficulty,
          "pictorial",
        ),
        numberInput(
          d,
          2,
          6,
          focusNumberPrompt(spacedFocusOrder[3]).prompt,
          focusNumberPrompt(spacedFocusOrder[3]).answer,
          focusNumberPrompt(spacedFocusOrder[3]).tags,
          dayDifficulty,
          "abstract",
          0,
          maxForDay,
        ),
        numberInput(
          d,
          2,
          7,
          focusNumberPrompt(spacedFocusOrder[4]).prompt,
          focusNumberPrompt(spacedFocusOrder[4]).answer,
          focusNumberPrompt(spacedFocusOrder[4]).tags,
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          2,
          8,
          focusNumberPrompt(spacedFocusOrder[5]).prompt,
          focusNumberPrompt(spacedFocusOrder[5]).answer,
          focusNumberPrompt(spacedFocusOrder[5]).tags,
          dayDifficulty,
          "abstract",
        ),
      ],
    },
    {
      id: toSectionId(d, 3),
      title: "חִיסּוּר",
      type: "arithmetic",
      learningGoal: "לְחַזֵּק חִיסּוּר בְּדִיּוּק וּבְשִׁיטָה סְדוּרָה.",
      prerequisiteSkillTags: ["subtraction", ...concept.mainTags],
      exercises: [
        numberInput(
          d,
          3,
          1,
          `דֻּגְמָה: ${subBase + 2} - 2 = ${subBase}. עַכְשָׁיו חַשְּׁבוּ ${subBase + 3} - 2`,
          subBase + 1,
          ["subtraction"],
          dayDifficulty,
          "concrete",
          0,
          20,
        ),
        numberInput(d, 3, 2, `חַשְּׁבוּ ${subBase + 1} - 3`, subBase - 2, ["subtraction"], dayDifficulty, "abstract"),
        numberInput(d, 3, 3, `חַשְּׁבוּ ${subBase + 2} - 4`, subBase - 2, ["subtraction"], dayDifficulty, "abstract"),
        numberInput(d, 3, 4, `חַשְּׁבוּ ${subBase} - 2`, subBase - 2, ["subtraction"], dayDifficulty, "abstract"),
        multipleChoice(
          d,
          3,
          5,
          `חַשְּׁבוּ ${subBase + 4} - 3`,
          [`${subBase}`, `${subBase + 1}`, `${subBase + 2}`],
          `${subBase + 1}`,
          ["subtraction"],
          dayDifficulty,
          "pictorial",
        ),
        numberInput(
          d,
          3,
          6,
          `חַשְּׁבוּ ${Math.min(maxForDay, subBase + 5)} - 5`,
          Math.min(maxForDay, subBase + 5) - 5,
          ["subtraction"],
          dayDifficulty,
          "abstract",
          0,
          20,
        ),
        trueFalse(
          d,
          3,
          7,
          d === 4
            ? "הַאִם נָכוֹן: 12 - 4 = 8?"
            : d === 5
              ? "הַאִם נָכוֹן: 14 גָּדוֹל מִ-11?"
              : d === 2
                ? "הַאִם נָכוֹן: 9 - 1 = 8?"
              : d === 3
                ? "הַאִם נָכוֹן: 6 + 3 = 9?"
                : "הַאִם נָכוֹן: 10 - 2 = 8?",
          true,
          d === 5 ? ["comparing"] : d === 3 ? ["addition"] : ["subtraction"],
          dayDifficulty,
          "abstract",
        ),
        numberLineJump(
          d,
          3,
          8,
          d === 1
            ? `עַל קַו מִסְפָּרִים: מִ-0 עַד ${countingCap} בְּקְפִיצָה שֶׁל 1. כַּמָּה קְפִיצוֹת?`
            : d === 2
              ? `הִתְקַדְּמוּ מִ-0 עַד ${countingCap}, צַעַד אֶחָד כָּל פַּעַם. כַּמָּה צְעָדִים?`
              : "מִתְחִילִים בְּ-2 וְקוֹפְצִים בְּ-2 עַד 12. כַּמָּה קְפִיצוֹת?",
          d <= 2 ? 0 : 2,
          d <= 2 ? countingCap : 12,
          d <= 2 ? 1 : 2,
          d <= 2 ? countingCap : 5,
          d <= 2 ? ["counting", "number-line"] : ["number-line", "patterns"],
          dayDifficulty,
          "pictorial",
        ),
      ],
    },
    {
      id: toSectionId(d, 4),
      title: "בְּעָיוֹת מִילּוּלִיּוֹת",
      type: "verbal",
      learningGoal: "לְתַרְגֵּם סִפּוּר לִתְרַגִּיל חִיבּוּר אוֹ חִיסּוּר.",
      prerequisiteSkillTags: ["word-problems", "addition", "subtraction"],
      exercises: [
        numberInput(
          d,
          4,
          1,
          `דֻּגְמָה: לְעִידוֹ יֵשׁ ${addBase + 2} גֻּלּוֹת וְהוּא קִבֵּל עוֹד 2. כַּמָּה יֵשׁ לוֹ?`,
          addBase + 4,
          ["word-problems", "addition"],
          dayDifficulty,
          "pictorial",
          0,
          20,
        ),
        numberInput(
          d,
          4,
          2,
          `לְנֹעַם יֵשׁ ${subBase + 2} מַדְבֵּקוֹת. הוּא נָתַן 3. כַּמָּה נִשְׁאָרוּ?`,
          subBase - 1,
          ["word-problems", "subtraction"],
          dayDifficulty,
          "pictorial",
          0,
          20,
        ),
        numberInput(
          d,
          4,
          3,
          `בַּסַּל יֵשׁ ${addBase + 1} תַּפּוּחִים. מוֹסִיפִים 4. כַּמָּה יֵשׁ?`,
          addBase + 5,
          ["word-problems", "addition"],
          dayDifficulty,
          "pictorial",
          0,
          20,
        ),
        numberInput(
          d,
          4,
          4,
          `בַּצֶּלַחַת הָיוּ ${subBase + 4} עוּגִיּוֹת. אָכְלוּ 5. כַּמָּה נִשְׁאָרוּ?`,
          subBase - 1,
          ["word-problems", "subtraction"],
          dayDifficulty,
          "pictorial",
          0,
          20,
        ),
        numberInput(
          d,
          4,
          5,
          `בַּכִּתָּה ${addBase + 3} יְלָדִים וְעוֹד 3 הִצְטָרְפוּ. כַּמָּה יְלָדִים יֵשׁ?`,
          addBase + 6,
          ["word-problems", "addition"],
          dayDifficulty,
          "abstract",
          0,
          20,
        ),
        numberInput(
          d,
          4,
          6,
          `הָיוּ ${Math.min(maxForDay, subBase + 6)} בָּלוֹנִים. 4 הִתְפּוֹצְצוּ. כַּמָּה נִשְׁאָרוּ?`,
          Math.min(maxForDay, subBase + 6) - 4,
          ["word-problems", "subtraction"],
          dayDifficulty,
          "abstract",
          0,
          20,
        ),
        multipleChoice(
          d,
          4,
          7,
          d === 7
            ? "בְּסִפּוּר 'הָיוּ 15 וְאָכְלוּ 4' אֵיזוֹ פְּעוּלָה נַעֲשֶׂה?"
            : "אֵיזוֹ פְּעוּלָה נַעֲשֶׂה כְּשֶׁכָּתוּב 'נִשְׁאֲרוּ'?",
          ["חִיבּוּר", "חִיסּוּר", "סְפִירָה לְלֹא פְּעוּלָה"],
          "חִיסּוּר",
          ["word-problems", "subtraction"],
          dayDifficulty,
          "abstract",
        ),
        numberInput(
          d,
          4,
          8,
          d === 7
            ? "לְגִיל הָיוּ 11 קַלָּפִים. הוּא קִבֵּל עוֹד 5. כַּמָּה קַלָּפִים יֵשׁ לוֹ?"
            : `לְדָנִי הָיוּ ${addBase + 4} גֻּלּוֹת. הוּא קִבֵּל עוֹד 2. כַּמָּה יֵשׁ לוֹ?`,
          d === 7 ? 16 : addBase + 6,
          ["word-problems", "addition"],
          dayDifficulty,
          "pictorial",
          0,
          20,
        ),
      ],
    },
    {
      id: toSectionId(d, 5),
      title: "סִכּוּם וּבְדִיקַת עַצְמִי",
      type: "review",
      learningGoal: "לְוַדֵּא הֲבָנָה בִּתְרַגִּילִים מְשֻׁלָּבִים.",
      prerequisiteSkillTags: [...concept.mainTags, ...concept.spiralReviewTags],
      exercises: [
        multipleChoice(
          d,
          5,
          1,
          `דֻּגְמָה: חַשְּׁבוּ ${addBase + 3} + 2`,
          [`${addBase + 4}`, `${addBase + 5}`, `${addBase + 6}`],
          `${addBase + 5}`,
          ["addition"],
          dayDifficulty,
          "abstract",
        ),
        multipleChoice(
          d,
          5,
          2,
          `חַשְּׁבוּ ${subBase + 3} - 3`,
          [`${subBase - 1}`, `${subBase}`, `${subBase + 1}`],
          `${subBase}`,
          ["subtraction"],
          dayDifficulty,
          "abstract",
        ),
        trueFalse(
          d,
          5,
          3,
          `הַאִם נָכוֹן: ${addBase + 2} + 4 = ${addBase + 6}?`,
          true,
          ["addition", "comparing"],
          dayDifficulty,
          "abstract",
        ),
        trueFalse(
          d,
          5,
          4,
          `הַאִם נָכוֹן: ${subBase + 5} - 2 = ${subBase + 4}?`,
          false,
          ["subtraction", "comparing"],
          dayDifficulty,
          "abstract",
        ),
        multipleChoice(
          d,
          5,
          5,
          `בְּעָיָה: לְיָעֵל הָיוּ ${addBase + 2} מַדְבֵּקוֹת וְהִיא קִבְּלָה 3. כַּמָּה עַכְשָׁיו?`,
          [`${addBase + 4}`, `${addBase + 5}`, `${addBase + 6}`],
          `${addBase + 5}`,
          ["word-problems", "addition"],
          dayDifficulty,
          "pictorial",
        ),
        multipleChoice(
          d,
          5,
          6,
          `בְּעָיָה: בַּקֻּפְסָה הָיוּ ${subBase + 4} קוּבִּיּוֹת. הוֹצִיאוּ 4. כַּמָּה נִשְׁאָרוּ?`,
          [`${subBase - 1}`, `${subBase}`, `${subBase + 1}`],
          `${subBase}`,
          ["word-problems", "subtraction"],
          dayDifficulty,
          "pictorial",
        ),
        numberLineJump(
          d,
          5,
          7,
          d === 1
            ? "עַל קַו מִסְפָּרִים: מִ-1 עַד 5 בְּקְפִיצוֹת שֶׁל 1. כַּמָּה קְפִיצוֹת?"
            : d === 2
              ? "עַל קַו מִסְפָּרִים: מִ-0 עַד 10 בְּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת?"
              : "עַל קַו מִסְפָּרִים: מִ-4 עַד 14 בְּקְפִיצוֹת שֶׁל 2. כַּמָּה קְפִיצוֹת?",
          d === 1 ? 1 : d === 2 ? 0 : 4,
          d === 1 ? 5 : d === 2 ? 10 : 14,
          d === 1 ? 1 : 2,
          d === 1 ? 4 : 5,
          ["number-line", "patterns"],
          dayDifficulty,
          "abstract",
        ),
        trueFalse(
          d,
          5,
          8,
          d === 3
            ? "הַאִם נָכוֹן: 7 + 2 = 10?"
            : d === 4
              ? "הַאִם נָכוֹן: 13 - 3 = 10?"
              : d === 5
                ? "הַאִם נָכוֹן: 16 גָּדוֹל מִ-12?"
                : "הַאִם נָכוֹן: 9 + 1 = 10?",
          d === 3 ? false : true,
          d === 5 ? ["comparing"] : d === 4 ? ["subtraction"] : ["addition"],
          dayDifficulty,
          "abstract",
        ),
      ],
    },
    {
      id: toSectionId(d, 6),
      title: "תִּרְגּוּל מְמוּקָּד בְּנוֹשֵׂא הַיּוֹם",
      type: "challenge",
      learningGoal: "לְבַסֵּס שְׁטִיפוּת בְּנוֹשֵׂא הַיּוֹם עִם 8 מְשִׂימוֹת נוֹסָפוֹת.",
      prerequisiteSkillTags: [focusTag, ...concept.mainTags],
      exercises: [
        numberInput(d, 6, 1, focusedDrillPrompt(spacedDrillOrder[0]).prompt, focusedDrillPrompt(spacedDrillOrder[0]).answer, focusedDrillPrompt(spacedDrillOrder[0]).tags, dayDifficulty, "abstract"),
        numberInput(d, 6, 2, focusedDrillPrompt(spacedDrillOrder[1]).prompt, focusedDrillPrompt(spacedDrillOrder[1]).answer, focusedDrillPrompt(spacedDrillOrder[1]).tags, dayDifficulty, "abstract"),
        numberInput(d, 6, 3, focusedDrillPrompt(spacedDrillOrder[2]).prompt, focusedDrillPrompt(spacedDrillOrder[2]).answer, focusedDrillPrompt(spacedDrillOrder[2]).tags, dayDifficulty, "abstract"),
        numberInput(d, 6, 4, focusedDrillPrompt(spacedDrillOrder[3]).prompt, focusedDrillPrompt(spacedDrillOrder[3]).answer, focusedDrillPrompt(spacedDrillOrder[3]).tags, dayDifficulty, "abstract"),
        numberInput(d, 6, 5, focusedDrillPrompt(spacedDrillOrder[4]).prompt, focusedDrillPrompt(spacedDrillOrder[4]).answer, focusedDrillPrompt(spacedDrillOrder[4]).tags, dayDifficulty, "abstract"),
        numberInput(d, 6, 6, focusedDrillPrompt(spacedDrillOrder[5]).prompt, focusedDrillPrompt(spacedDrillOrder[5]).answer, focusedDrillPrompt(spacedDrillOrder[5]).tags, dayDifficulty, "abstract"),
        numberInput(d, 6, 7, focusedDrillPrompt(spacedDrillOrder[6]).prompt, focusedDrillPrompt(spacedDrillOrder[6]).answer, focusedDrillPrompt(spacedDrillOrder[6]).tags, dayDifficulty, "abstract"),
        numberInput(d, 6, 8, focusedDrillPrompt(spacedDrillOrder[7]).prompt, focusedDrillPrompt(spacedDrillOrder[7]).answer, focusedDrillPrompt(spacedDrillOrder[7]).tags, dayDifficulty, "abstract"),
      ],
    },
  ];
};
