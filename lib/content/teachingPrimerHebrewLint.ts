import type { GradeId } from "@/lib/grades";
import type { WorkbookDay } from "@/lib/types";
import { primerBandForDay } from "@/lib/content/teachingPrimerLimits";

export type HebrewLintIssue = {
  dayId: string;
  field: "teachingSummary" | "teachingStep";
  stepIndex?: number;
  rule: string;
  excerpt: string;
};

/**
 * Build a niqqud-insensitive matcher from a Hebrew consonant skeleton.
 * Spaces match one-or-more whitespace; any niqqud/cantillation marks between
 * consonants are ignored. Lets us guard spoken-content typos regardless of how
 * the vowel marks happen to be composed in the source.
 */
function skeleton(consonants: string): RegExp {
  const nik = "[\\u0591-\\u05C7]*";
  const body = Array.from(consonants)
    .map((ch) =>
      ch === " " ? "\\s+" : ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + nik,
    )
    .join("");
  return new RegExp(body);
}

/** Patterns that indicate non-standard or child-unfriendly primer Hebrew. */
const FORBIDDEN_PATTERNS: { id: string; re: RegExp }[] = [
  { id: "sounds-correct", re: /נִשְׁמַעַת נָכוֹן/ },
  { id: "counting-as-verb-monim", re: /נִתְרַגֵּל בְּמוֹנִים/ },
  { id: "double-bet", re: /נִתְרַגֵּל בְּבְ(?!\s*[עב])/ },
  { id: "work-in-security", re: /נַעֲבֹד לְאִטּוֹ וּבִבְטִיחוּת/ },
  { id: "work-slow-security", re: /וּבִבְטִיחוּת/ },
  // Spoken-content typos caught during the voice/speech audit — guard against regressions.
  { id: "spoken-typo-bekol-rag", re: skeleton("בקול רג") }, // should be "בְּקוֹל רָם"
  { id: "spoken-typo-kipuim", re: skeleton("קפואים") }, // should be "קְפִיצוֹת"
  { id: "spoken-typo-zaheret", re: skeleton("זהרת") }, // should be "זְהִירוּת"
  { id: "spoken-typo-sheirit", re: skeleton("שאירית") }, // should be "שְׁאֵרִית"
  { id: "spoken-typo-zohot", re: skeleton("זוהות") }, // should be "זֵהוֹת"
  { id: "spoken-typo-mamrikim", re: skeleton("ממריקים") }, // should be "מְפָרְקִים"
  { id: "spoken-typo-muvalgim", re: skeleton("מובלגים") }, // non-word
  // Doubled "in/with a problem" prefix: first bet vocalized with anything but HIRIQ
  // (the typo "בְּבְעָיוֹת"), vs. the correct bet+HIRIQ "בִּבְעָיוֹת". Codepoints, not
  // literals, to avoid niqqud-composition pitfalls; anchored to ע so legit
  // "בְּבֵית"-style words are not flagged.
  // ב bet · ִ hiriq · ע ayin · [֑-ׇ] any niqqud mark
  { id: "spoken-typo-double-bet-beaya", re: /ב(?![֑-ׇ]*ִ)[֑-ׇ]*ב[֑-ׇ]*ע/ },
];

const EARLY_BAND_ABSTRACT_RE = /רַעֲיוֹן הַיּוֹם/;

const MAX_CONSECUTIVE_IDENTICAL_STEP_SETS = 2;

function stepsKey(steps: string[]): string {
  return steps.map((s) => s.trim()).join("\n");
}

export function lintTeachingPrimerHebrew(
  grade: GradeId,
  days: WorkbookDay[],
): HebrewLintIssue[] {
  const issues: HebrewLintIssue[] = [];

  let prevStepsKey: string | null = null;
  let identicalRun = 0;

  for (const day of days) {
    const summary = day.teachingSummary ?? "";
    const steps = day.teachingSteps ?? [];

    for (const { id, re } of FORBIDDEN_PATTERNS) {
      if (re.test(summary)) {
        issues.push({
          dayId: day.id,
          field: "teachingSummary",
          rule: id,
          excerpt: summary.slice(0, 80),
        });
      }
    }

    if (primerBandForDay(day.dayNumber) === "early" && EARLY_BAND_ABSTRACT_RE.test(summary)) {
      issues.push({
        dayId: day.id,
        field: "teachingSummary",
        rule: "early-band-abstract-idea",
        excerpt: summary.slice(0, 80),
      });
    }

    steps.forEach((step, idx) => {
      for (const { id, re } of FORBIDDEN_PATTERNS) {
        if (re.test(step)) {
          issues.push({
            dayId: day.id,
            field: "teachingStep",
            stepIndex: idx,
            rule: id,
            excerpt: step.slice(0, 80),
          });
        }
      }
      if (primerBandForDay(day.dayNumber) === "early" && EARLY_BAND_ABSTRACT_RE.test(step)) {
        issues.push({
          dayId: day.id,
          field: "teachingStep",
          stepIndex: idx,
          rule: "early-band-abstract-idea",
          excerpt: step.slice(0, 80),
        });
      }
    });

    const key = stepsKey(steps);
    if (key && key === prevStepsKey) {
      identicalRun += 1;
      if (identicalRun >= MAX_CONSECUTIVE_IDENTICAL_STEP_SETS) {
        issues.push({
          dayId: day.id,
          field: "teachingStep",
          rule: "duplicate-steps-run",
          excerpt: key.slice(0, 80),
        });
      }
    } else {
      identicalRun = 0;
      prevStepsKey = key || null;
    }

    void grade;
  }

  return issues;
}
