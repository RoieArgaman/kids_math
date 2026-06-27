import type { AnswerValue, Exercise } from "../types";

const HEBREW_NIQUD_REGEX = /[֑-ׇ]/g;
const PUNCTUATION_REGEX = /[.,/#!$%^&*;:{}=\-_`~()?"'!]/g;

export const normalizeTextAnswer = (value: string): string =>
  value
    .trim()
    .replace(HEBREW_NIQUD_REGEX, "")
    .replace(PUNCTUATION_REGEX, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

export const normalizeAnswerValue = (value: unknown): AnswerValue | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric) && trimmed !== "") {
      return numeric;
    }

    return normalizeTextAnswer(trimmed);
  }

  return null;
};

const toBoolean = (value: AnswerValue): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = normalizeTextAnswer(value);
    if (["כן", "true", "נכון"].includes(normalized)) {
      return true;
    }
    if (["לא", "false", "לא נכון"].includes(normalized)) {
      return false;
    }
  }

  return null;
};

const isMatchPairsCorrect = (
  exercise: Extract<Exercise, { kind: "match_pairs" }>,
  rawAnswer: unknown,
): boolean => {
  if (typeof rawAnswer !== "string" || rawAnswer.trim().length === 0) {
    return false;
  }
  let mapping: unknown;
  try {
    mapping = JSON.parse(rawAnswer);
  } catch {
    return false;
  }
  if (typeof mapping !== "object" || mapping === null) {
    return false;
  }
  const map = mapping as Record<string, unknown>;
  // Every pair must be matched, and matched correctly.
  return exercise.pairs.every((pair) => map[pair.left] === pair.right);
};

export const isAnswerCorrect = (exercise: Exercise, rawAnswer: unknown): boolean => {
  if (exercise.kind === "match_pairs") {
    return isMatchPairsCorrect(exercise, rawAnswer);
  }

  const normalized = normalizeAnswerValue(rawAnswer);
  if (normalized === null) {
    return false;
  }

  switch (exercise.kind) {
    case "number_input":
      return typeof normalized === "number" && normalized === exercise.answer;
    case "multiple_choice":
      return normalizeTextAnswer(String(normalized)) === normalizeTextAnswer(exercise.answer);
    case "true_false": {
      const answerBool = toBoolean(normalized);
      return answerBool !== null && answerBool === exercise.answer;
    }
    case "number_line_jump":
      return (
        typeof normalized === "number" &&
        normalized === exercise.answer &&
        exercise.start < exercise.end
      );
    case "shape_choice":
      return String(normalized) === exercise.answer;
    case "listen_choose":
      return normalizeTextAnswer(String(normalized)) === normalizeTextAnswer(exercise.answer);
    case "letter_tiles":
      return normalizeTextAnswer(String(normalized)) === normalizeTextAnswer(exercise.word);
    default: {
      const _exhaustiveCheck: never = exercise;
      return _exhaustiveCheck;
    }
  }
};

const representationHint = (exercise: Exercise): string | null => {
  switch (exercise.meta.representation) {
    case "concrete":
      return "היעזרו בעצמים: חרוזים/קוביות/אצבעות, וסדרו אותם כדי לראות את הפעולה.";
    case "pictorial":
      return "ציירו ציור קטן: נקודות/קבוצות/קו מספרים, ואז כתבו את התרגיל שמתאים לציור.";
    case "abstract":
      return null;
    default: {
      const _never: never = exercise.meta.representation;
      return _never;
    }
  }
};

const strategyHint = (exercise: Exercise): string | null => {
  const tags = exercise.meta.skillTags;
  const has = (t: string) => tags.includes(t as never);

  if (has("word-problems")) {
    return "בבעיות מילוליות: סמנו מה שואלים, רשמו את הנתונים, וכתבו תרגיל אחד שמתאים לסיפור.";
  }

  if (has("number-bonds")) {
    return "נסו לפרק ולהשלים ל-10 (קשרים בין מספרים).";
  }

  if (has("place-value")) {
    return "חשבו בעשרות ויחידות בנפרד (ערך המקום), ואז חברו/חסרו.";
  }

  if (has("number-line")) {
    return "השתמשו בקו מספרים: התחילו במספר הראשון וקפצו/ספרו לפי הצעד.";
  }

  if (has("addition")) {
    return "בחיבור: נסו 'להשלים ל-10' או להשתמש בכפולות (דאבל).";
  }

  if (has("subtraction")) {
    return "בחיסור: נסו 'להגיע לעשר' או לספור אחורה על קו מספרים.";
  }

  if (has("multiplication-intro") || has("multiplication-tables")) {
    return "בכפל: חשבו על קבוצות שוות או על חיבור חוזר.";
  }

  if (has("division-equal-groups")) {
    return "בחילוק: חלקו לקבוצות שוות ובדקו כמה בכל קבוצה (או כמה קבוצות יש).";
  }

  if (has("fractions-parts")) {
    return "בשברים: חשבו על השלם כמחולק לחלקים שווים (חצי/רבע) וספרו חלקים.";
  }

  return null;
};

export const defaultHint = (exercise: Exercise): string => {
  if (exercise.hint) {
    return exercise.hint;
  }

  const rep = representationHint(exercise);
  const strat = strategyHint(exercise);
  if (rep && strat) {
    return `${strat} ${rep}`;
  }
  if (strat) {
    return strat;
  }
  if (rep) {
    return rep;
  }

  switch (exercise.kind) {
    case "number_input":
      return "נַסּוּ לִסְפּוֹר לְאַט צַעַדַ–צַעַד וְלִבְדּוֹק שׁוּב אֶת הַתּוֹצָאָה.";
    case "multiple_choice":
      return "עִבְרוּ עַל כָּל אֶפְשָׁרוּת וּבִדְקוּ אֵיזוֹ מַתְאִימָה בְדִיּוּק לַשְּׁאֵלָה.";
    case "true_false":
      return "קִרְאוּ אֶת הַמִּשְׁפָט שׁוּב וּבִדְקוּ אִם הוּא תָּמִיד נָכוֹן.";
    case "number_line_jump":
      return "סַמְּנוּ נְקוּדַּת הַתְחָלָה וְקִפְצוּ לְפִי גֹּדֶל הַקְּפִיצָה עַד הַסּוֹף.";
    case "shape_choice":
      return "בִּדְקוּ אֶת מִסְפַּר הַצְּלָעוֹת אוֹ הַפִּינוֹת שֶׁל כָּל צוּרָה.";
    case "listen_choose":
      return "לַחֲצוּ עַל הָרַמְקוֹל 🔊 וְהַקְשִׁיבוּ שׁוּב, וְאָז בַּחֲרוּ אֶת הַתְּשׁוּבָה שֶׁמַּתְאִימָה.";
    case "letter_tiles":
      return "הַקְשִׁיבוּ לַמִּלָּה וְאָז הַרְכִּיבוּ אוֹתָהּ מֵהָאוֹתִיּוֹת לְפִי הַסֵּדֶר.";
    case "match_pairs":
      return "בַּחֲרוּ פְּרִיט מִצַּד אֶחָד וְאָז אֶת הַהַתְאָמָה שֶׁלּוֹ מֵהַצַּד הַשֵּׁנִי, עַד שֶׁכָּל הַזּוּגוֹת מְחֻבָּרִים.";
    default: {
      const _never: never = exercise;
      return _never;
    }
  }
};

/** True when the student's numeric answer is exactly ±1 off the correct answer. */
export function isNearMiss(exercise: Exercise, rawAnswer: unknown): boolean {
  if (exercise.kind !== "number_input") return false;
  const normalized = normalizeAnswerValue(rawAnswer);
  if (typeof normalized !== "number") return false;
  return Math.abs(normalized - exercise.answer) === 1;
}

export const NEAR_MISS_FEEDBACK_TEXT =
  "כִּמְעַט נָכוֹן! נַסּוּ שׁוּב בְעִיּוּן.";

export const getRetryFeedbackText = (
  exercise: Exercise,
  rawAnswer: unknown,
  attemptNumber: number,
): string => {
  const normalized = normalizeAnswerValue(rawAnswer);
  const correct = isAnswerCorrect(exercise, rawAnswer);

  if (correct) {
    return attemptNumber <= 1
      ? "מְעוּלֶּה! תְשׁוּבָה נְכוֹנָה."
      : "יָפֶה מְאֹד, הִצְלַחְתֶּם לְתַקֵּן נָכוֹן.";
  }

  if (normalized === null) {
    return "לֹא נִקְלְטָה תְשׁוּבָה. נַסּוּ לְהָזִין תְשׁוּבָה מְלֵאָה וּבְרוּרָה.";
  }

  if (isNearMiss(exercise, rawAnswer)) {
    return NEAR_MISS_FEEDBACK_TEXT;
  }

  if (attemptNumber >= 3) {
    return "נְסוּ עוֹד פַּעַם — רֶמֶז מוּכָן בִשְׁבִילְכֶם 💡";
  }

  return "לֹא מְדוּיָּק עֲדַיִן, נַסּוּ שׁוּב וּבִדְקוּ כָּל שָׁלָב.";
};
