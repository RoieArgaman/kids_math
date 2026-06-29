import type { GradeId } from "@/lib/grades";
import type { HeroDecoration } from "@/components/ui/HeroHeader";
import type { WorkbookDay, WorkbookProgressState } from "@/lib/types";
import { testIds } from "@/lib/testIds";
import { routes, type RouteOpts } from "@/lib/routes";

import { getEnglishDays, getEnglishTotalDays } from "@/lib/content/english-workbook";
import {
  ENGLISH_LEVELS,
  englishLevelLabel,
  englishLevelSubtitle,
  isEnglishLevelUnlocked,
} from "@/lib/english/levels";
import { loadEnglishProgressState } from "@/lib/english/storage";

import { getScienceDays, getScienceTotalDays } from "@/lib/content/science-workbook";
import {
  SCIENCE_LEVELS,
  scienceLevelLabel,
  scienceLevelSubtitle,
  isScienceLevelUnlocked,
} from "@/lib/science/levels";
import { loadScienceProgressState } from "@/lib/science/storage";

/**
 * Per-subject configuration that drives the SHARED subject Home + LevelPicker
 * screens. English and Science render identical markup; everything that differs
 * between them (content/progress loaders, routes, labels, emoji decorations,
 * testid subtrees) is captured here so the screens themselves stay subject-blind.
 *
 * CRITICAL — storage isolation: each subject's config wires its OWN content
 * loaders and progress store. The shared screens must only ever reach data
 * through the config; they never import a subject store directly.
 */
export type SubjectScreenConfig = {
  /** Subject id — used only for keys/diagnostics, never to branch in the screen. */
  subject: "english" | "science";

  /** Ordered list of levels for this subject (currently always ["a", "b"]). */
  levels: GradeId[];

  // --- Content + progress (isolated per subject) ---
  getDays: (level: GradeId) => WorkbookDay[];
  getTotalDays: (level: GradeId) => number;
  loadProgressState: () => WorkbookProgressState;
  isLevelUnlocked: (level: GradeId, opts?: { previewAll?: boolean }) => boolean;

  // --- Labels ---
  levelLabel: (level: GradeId) => string;
  levelSubtitle: (level: GradeId) => string;

  // --- Routes ---
  levelPickerRoute: (opts?: Omit<RouteOpts, "grade">) => string;
  homeRoute: (level: GradeId, opts?: Omit<RouteOpts, "grade">) => string;
  dayRoute: (level: GradeId, dayId: string, opts?: Omit<RouteOpts, "grade">) => string;
  examRoute: (level: GradeId, opts?: Omit<RouteOpts, "grade">) => string;

  // --- Home screen presentation ---
  home: {
    /** Hero title prefix, e.g. "אַנְגְּלִית" → rendered as `${prefix} · ${levelLabel}`. */
    heroTitlePrefix: string;
    decorations: HeroDecoration[];
    testIds: typeof testIds.screen.english.home;
  };

  // --- LevelPicker screen presentation ---
  levelPicker: {
    heroTitle: string;
    decorations: HeroDecoration[];
    /** Big emoji shown in the medallion per level. */
    levelEmoji: Record<GradeId, string>;
    /** Inline-start border color of the level card per level. */
    medallionBorderColor: (level: GradeId) => string;
    /** CTA label per level, e.g. "לְשָׁלָב א׳" / "לְכִיתָּה א׳". */
    levelCtaLabel: (level: GradeId) => string;
    /** Locked-hint copy (refers to the prerequisite level's exam). */
    lockedHint: string;
    testIds: typeof testIds.screen.english.levelPicker;
  };
};

const englishDecorations: HeroDecoration[] = [
  { emoji: "🇬🇧", className: "pointer-events-none absolute -left-4 -top-4 text-7xl opacity-15 select-none" },
  { emoji: "🎧", className: "pointer-events-none absolute right-4 top-2 text-5xl opacity-20 select-none" },
];

const scienceDecorations: HeroDecoration[] = [
  { emoji: "🌱", className: "pointer-events-none absolute -left-4 -top-4 text-7xl opacity-15 select-none" },
  { emoji: "🔭", className: "pointer-events-none absolute right-4 top-2 text-5xl opacity-20 select-none" },
];

export const englishScreenConfig: SubjectScreenConfig = {
  subject: "english",
  levels: ENGLISH_LEVELS,

  getDays: getEnglishDays,
  getTotalDays: getEnglishTotalDays,
  loadProgressState: loadEnglishProgressState,
  isLevelUnlocked: isEnglishLevelUnlocked,

  levelLabel: englishLevelLabel,
  levelSubtitle: englishLevelSubtitle,

  levelPickerRoute: routes.englishLevelPicker,
  homeRoute: routes.englishHome,
  dayRoute: routes.englishDay,
  examRoute: routes.englishExam,

  home: {
    heroTitlePrefix: "אַנְגְּלִית",
    decorations: englishDecorations,
    testIds: testIds.screen.english.home,
  },

  levelPicker: {
    heroTitle: "אַנְגְּלִית 🔤",
    decorations: englishDecorations,
    levelEmoji: { a: "🔤", b: "📖" },
    medallionBorderColor: (level) => (level === "a" ? "#34d399" : "#818cf8"),
    levelCtaLabel: (level) => (level === "a" ? "לְשָׁלָב א׳" : "לְשָׁלָב ב׳"),
    lockedHint: "🔒 עוֹבְרִים אֶת הַמִּבְחָן שֶׁל שָׁלָב א׳ כְּדֵי לִפְתֹּחַ",
    testIds: testIds.screen.english.levelPicker,
  },
};

export const scienceScreenConfig: SubjectScreenConfig = {
  subject: "science",
  levels: SCIENCE_LEVELS,

  getDays: getScienceDays,
  getTotalDays: getScienceTotalDays,
  loadProgressState: loadScienceProgressState,
  isLevelUnlocked: isScienceLevelUnlocked,

  levelLabel: scienceLevelLabel,
  levelSubtitle: scienceLevelSubtitle,

  levelPickerRoute: routes.scienceLevelPicker,
  homeRoute: routes.scienceHome,
  dayRoute: routes.scienceDay,
  examRoute: routes.scienceExam,

  home: {
    heroTitlePrefix: "מַדָּעִים",
    decorations: scienceDecorations,
    testIds: testIds.screen.science.home,
  },

  levelPicker: {
    heroTitle: "מַדָּעִים 🔬",
    decorations: scienceDecorations,
    levelEmoji: { a: "🌱", b: "🔭" },
    medallionBorderColor: (level) => (level === "a" ? "#14b8a6" : "#0ea5e9"),
    levelCtaLabel: (level) => (level === "a" ? "לְכִיתָּה א׳" : "לְכִיתָּה ב׳"),
    lockedHint: "🔒 עוֹבְרִים אֶת הַמִּבְחָן שֶׁל כִּיתָּה א׳ כְּדֵי לִפְתֹּחַ",
    testIds: testIds.screen.science.levelPicker,
  },
};
