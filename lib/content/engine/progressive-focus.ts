import type { DifficultyLevel, Exercise, Section, SkillTag } from "@/lib/types";

import type { DayConcept } from "./exercise-factories";
import {
  multipleChoice,
  numberInput,
  numberLineJump,
  toSectionId,
  trueFalse,
} from "./exercise-factories";

/** מקטע «מושג היום» מורחב אחרי חימום — כל התרגילים נגזרים מ־DayConcept (לכיתה ב׳). */
export function buildProgressiveConceptFocusSection(
  concept: DayConcept,
  dayDifficulty: DifficultyLevel,
): Section {
  const d = concept.dayNumber;
  const tags = concept.mainTags;
  const hasTag = (tag: SkillTag) => tags.includes(tag);
  const hasWordProblems = hasTag("word-problems");
  const hasPlaceValue = hasTag("place-value");
  const a = concept.arithmeticAnswer;
  const exercises: Exercise[] = [];
  let exNum = 1;

  exercises.push(
    numberInput(d, 2, exNum++, concept.arithmeticPrompt, a, tags, dayDifficulty, "concrete"),
  );
  exercises.push(
    multipleChoice(
      d,
      2,
      exNum++,
      "בַּחֲרוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.",
      concept.arithmeticMcOptions,
      concept.arithmeticMcAnswer,
      tags,
      dayDifficulty,
      "pictorial",
    ),
  );

  if (a >= 3) {
    const placeValueNumber = Math.min(999, Math.max(10, a + 10));
    const placeValueTens = Math.floor(placeValueNumber / 10);
    exercises.push(
      numberInput(
        d,
        2,
        exNum++,
        hasPlaceValue
          ? `בַּמִּסְפָּר ${placeValueNumber}, כַּמָּה עֲשָׂרוֹת יֵשׁ?`
          : hasWordProblems
            ? `בְּעָיָה: הָיוּ ${a} עִפְּרוֹנוֹת. הִשְׁתַּמְּשׁוּ בְּ-3. כַּמָּה נִשְׁאֲרוּ?`
            : `תִרְגּוּל הַמְשָׁךְ לְנוֹשֵׂא הַיּוֹם: חַשְּׁבוּ ${a} - 3`,
        hasPlaceValue ? placeValueTens : a - 3,
        hasPlaceValue ? ["place-value", ...tags] : tags,
        dayDifficulty,
        "abstract",
        0,
        400,
      ),
    );
  }

  const placeValueNumber2 = Math.min(999, Math.max(10, a + 10));
  const placeValueTensBase = Math.floor(placeValueNumber2 / 10) * 10;
  const placeValueOnes = placeValueNumber2 - placeValueTensBase;
  exercises.push(
    numberInput(
      d,
      2,
      exNum++,
      hasPlaceValue
        ? `כַּמָּה צָרִיךְ לְהוֹסִיף לְ-${placeValueTensBase} כְּדֵי לְהַגִּיעַ לְ-${placeValueNumber2}?`
        : hasWordProblems
          ? `בְּעָיָה: לְדָנִי הָיוּ ${a + 2} מַדְבֵּקוֹת. הוּא נָתַן 2. כַּמָּה הָיוּ לוֹ לִפְנֵי שֶׁנָּתַן?`
          : `תִרְגּוּל הַמְשָׁךְ: חַשְּׁבוּ ${a} + 2`,
      hasPlaceValue ? placeValueOnes : hasWordProblems ? a : a + 2,
      hasPlaceValue ? ["place-value", "number-bonds", ...tags] : tags,
      dayDifficulty,
      "abstract",
      0,
      400,
    ),
  );

  exercises.push(
    numberInput(
      d,
      2,
      exNum++,
      `חִזּוּק: חַשְּׁבוּ ${a} + 10`,
      a + 10,
      tags,
      dayDifficulty,
      "abstract",
      0,
      400,
    ),
  );

  const roughSpan = Math.min(100, Math.max(20, a + 20));
  const step: 1 | 2 | 3 | 5 = roughSpan > 55 ? 5 : roughSpan > 30 ? 3 : 2;
  const start = Math.max(0, a - (d % 5));
  let end = Math.min(100, start + step * (4 + (d % 4)));
  if (end <= start + step) {
    end = start + step * 5;
  }
  let jumpLen = end - start;
  const rem = jumpLen % step;
  if (rem !== 0) {
    end -= rem;
    jumpLen = end - start;
  }
  const numJumps = jumpLen / step;
  if (numJumps >= 2 && numJumps <= 24) {
    exercises.push(
      numberLineJump(
        d,
        2,
        exNum++,
        `מֵאַחַר הַחִימּוּם — עַל קַו מִסְפָּרִים: מִ-${start} עַד ${end} בִּקְפִיצוֹת שֶׁל ${step}. כַּמָּה קְפִיצוֹת?`,
        start,
        end,
        step,
        numJumps,
        ["number-line", ...tags],
        dayDifficulty,
        "abstract",
      ),
    );
  }

  return {
    id: toSectionId(d, 2),
    title: `מוּשָׂג הַיּוֹם: ${concept.title}`,
    type: "arithmetic",
    learningGoal:
      "לְהַעֲמִיק בְּמוּשַׂג הַיּוֹם אַחֲרֵי הַחִימּוּם — בִּתְרַגּוּל מְדַרְגָּתִי עַל אוֹתוֹ נוֹשֵׂא.",
    prerequisiteSkillTags: concept.mainTags,
    example: {
      title: "דֻּגְמָה פְּתוּרָה",
      prompt: `דֻּגְמָה: ${concept.arithmeticPrompt}`,
      steps: [
        "קוֹרְאִים אֶת הַשְּׁאֵלָה וּמְזַהִים מָה צָרִיךְ לִמְצֹא.",
        `פּוֹתְרִים בְּצַעַדִים קְטַנִּים וּמַגִּיעִים לִתְשׁוּבָה: ${concept.arithmeticAnswer}.`,
        "בּוֹדְקִים שֶׁהַתְּשׁוּבָה הִגְיוֹנִית.",
      ],
      takeaway:
        "אַחַר חִימּוּם — מַתְמִידִים בְּנוֹשֵׂא הַיּוֹם בִּתְרַגּוּלִים נוֹסָפִים לִפְנֵי שָׂפָה וַאֶתְגָּר.",
    },
    exercises,
  };
}
