import { WORKBOOK_TOTAL_DAYS } from "@/lib/content/days";
import type { SkillTag } from "@/lib/types";
import type { WorkbookProgressState } from "@/lib/types";

export type MinistryStrandId =
  | "natural-numbers"
  | "operations"
  | "measurement-geometry"
  | "supplementary-pedagogy";

export interface MinistryStrand {
  id: MinistryStrandId;
  title: string;
  summary: string;
  /** Day numbers (1-based) that contribute to this strand */
  dayNumbers: number[];
  skillTags: SkillTag[];
}

export const MINISTRY_STRANDS: MinistryStrand[] = [
  {
    id: "natural-numbers",
    title: "מַסְפָּרִים טְבִעִיִּים וִיצּוּג",
    summary:
      "מִנִּיָּה, הַכָּרַת מִסְפָּרִים, קַו מִסְפָּרִים, הַשְׁוָאָה, דְּפוּסִים, זוּגִי וְאִי־זוּגִי, עֶרֶךְ מָקוֹם.",
    dayNumbers: [1, 2, 5, 6, 9, 10],
    skillTags: [
      "counting",
      "number-recognition",
      "number-line",
      "comparing",
      "patterns",
      "place-value",
    ],
  },
  {
    id: "operations",
    title: "פְּעוּלוֹת חֶשְׁבּוֹן וּבְעָיוֹת",
    summary: "חִיבּוּר וְחִיסּוּר, עֲשָׂרוֹת שְׁלֵמוֹת, בְּעָיוֹת מִילּוּלִיּוֹת, הַטְמָעָה.",
    dayNumbers: [3, 4, 6, 7, 11, 12, 13, 14],
    skillTags: ["addition", "subtraction", "word-problems", "number-line", "comparing", "place-value"],
  },
  {
    id: "measurement-geometry",
    title: "מְדִידָה וּגְאוֹמֶטְרִיָּה",
    summary: "צוּרוֹת, מְצוּלָעִים, מְדִידַת אֹרֶךְ וְזְמַן, חִשּׁוּב הַזָּזָה וְשִׁקּוּף — בְּהַשְׁלָמָה לְפִי הַתָּכְנִית.",
    dayNumbers: [8, 14, 15, 16, 17],
    skillTags: [
      "geometry-shapes",
      "measurement-length",
      "measurement-time",
      "symmetry-transform",
    ],
  },
  {
    id: "supplementary-pedagogy",
    title: "הַשְׁלָמָה וְכִּשּׁוּרִים מַתְקַדְּמִים",
    summary:
      "גִימַטְרִיָּה אוֹתִיּוֹת א־י, כֶּפֶל כְּחִזּוּר חִיבּוּר, קִשְׁרֵי מִסְפָּר ל־10.",
    dayNumbers: [18, 19, 20, 21],
    skillTags: ["gematria-letters", "multiplication-intro", "number-bonds", "addition"],
  },
];

export const LEARNING_ROUTINE_STEPS: string[] = [
  "קוֹרְאִים אֶת הַשְּׁאֵלָה בְּקוֹל רָם — מְבִינִים מָה מְבַקְשִׁים.",
  "בּוֹחֲרִים דֶּרֶךְ: סְפִירָה, קַו מִסְפָּרִים, פֵּרוּק אוֹ צִיּוּר בְּרֹאשׁ.",
  "עוֹשִׂים צַעַד־אַחַר־צַעַד — בְּלִי לְמַהֵר.",
  "בּוֹדְקִים: הַאִם הַתְּשׁוּבָה הִגְיוֹנִית? אֶפְשָׁר לְהַסְבִּיר לַאֲחֵר?",
];

/** מספר ימי העבודה בחוברת — מסונכרן אוטומטית עם workbookDays */
export const TOTAL_CURRICULUM_DAYS = WORKBOOK_TOTAL_DAYS;

export const PARENT_GUIDE = {
  title: "מַדְרִיךְ קָצָר לְהוֹרִים — לִפְנֵי וְאַחֲרֵי",
  before:
    "לִפְנֵי הַשִּׁעוּר — אַל תַּגִּידוּ אֶת הַתְּשׁוּבָה. שַׁאֲלוּ: «מָה מְבַקְשִׁים?» וּ«מָה כְּבָר יָדוּעַ בַּשְּׁאֵלָה?»",
  after:
    "אַחֲרֵי הַשִּׁעוּר — שַׁאֲלוּ רַק שְׁאֵלָה אַחַת: «אֵיךְ פָּתַרְתְּ?» אוֹ «מָה עָשִׂית בִּדְקִירָה רִאשׁוֹנָה?»",
  tactile:
    "כְּשֶׁרוֹאִים חִיבּוּר אוֹ חִיסּוּר — מומלֵץ לְהַפְסִיק דַּקָה וּלְהִשְׁתַּמֵּשׁ בְּקֻבִּיּוֹת, אֶצְבָּעוֹת אוֹ שְׁנֵי קְבוּצוֹת חֶפְצִים קְטַנִּים.",
  mindset:
    "טְעוּת מְלַמֶּדֶת — לֹא כֹּשֶׁל. מַעֲבִירִים בְּרַכּוּת גַּם כְּשֶׁצָּרִיךְ לְנַסּוֹת שׁוּב.",
};

export function dayIdFromNumber(dayNumber: number): `day-${number}` {
  return `day-${dayNumber}`;
}

export function fractionOfDaysComplete(
  dayNumbers: number[],
  progress: WorkbookProgressState,
): number {
  if (dayNumbers.length === 0) return 0;
  const done = dayNumbers.filter((d) => progress.days[dayIdFromNumber(d)]?.isComplete).length;
  return done / dayNumbers.length;
}

export function isStrandComplete(dayNumbers: number[], progress: WorkbookProgressState): boolean {
  if (dayNumbers.length === 0) return false;
  return dayNumbers.every((d) => progress.days[dayIdFromNumber(d)]?.isComplete);
}

/** השלמת כל ימי החוברת (1 … totalDays) */
export function fractionOverallComplete(
  progress: WorkbookProgressState,
  totalDays: number = TOTAL_CURRICULUM_DAYS,
): number {
  if (totalDays <= 0) return 0;
  let done = 0;
  for (let d = 1; d <= totalDays; d += 1) {
    if (progress.days[dayIdFromNumber(d)]?.isComplete) done += 1;
  }
  return done / totalDays;
}

export const COMPLETION_GATE_NOTE =
  "כְּדֵי לִפְתּוֹחַ יוֹם חָדָשׁ: לְהַשְׁלִים אֶת הַיּוֹם הַקּוֹדֵם בְּ-100% תְּשׁוּבוֹת נְכוֹנוֹת (כָּל הַמְּשִׂימוֹת).";
