import type { GradeId } from "@/lib/grades";
import type { HeroDecoration } from "@/components/ui/HeroHeader";
import type { Exercise, ExerciseId, WorkbookDay, WorkbookProgressState } from "@/lib/types";
import type { Subject } from "@/lib/subjects";
import { testIds } from "@/lib/testIds";
import { routes, type RouteOpts } from "@/lib/routes";

import { getEnglishDays, getEnglishTotalDays, getAllEnglishDays } from "@/lib/content/english-workbook";
import {
  ENGLISH_LEVELS,
  englishLevelLabel,
  englishLevelSubtitle,
  isEnglishLevelUnlocked,
} from "@/lib/english/levels";
import { loadEnglishProgressState } from "@/lib/english/storage";
import {
  ENGLISH_FINAL_EXAM_MIN_COUNT,
  ENGLISH_FINAL_EXAM_PASS_PERCENT,
} from "@/lib/english/final-exam/config";
import { buildEnglishExamBank, pickEnglishExamExerciseIds } from "@/lib/english/final-exam/picker";
import { gradeEnglishFinalExam } from "@/lib/english/final-exam/grading";
import {
  clearEnglishFinalExamState,
  createInitialEnglishFinalExamState,
  loadEnglishFinalExamState,
  saveEnglishFinalExamState,
} from "@/lib/english/final-exam/storage";

import { getScienceDays, getScienceTotalDays, getAllScienceDays } from "@/lib/content/science-workbook";
import {
  SCIENCE_LEVELS,
  scienceLevelLabel,
  scienceLevelSubtitle,
  isScienceLevelUnlocked,
} from "@/lib/science/levels";
import { loadScienceProgressState } from "@/lib/science/storage";
import {
  SCIENCE_FINAL_EXAM_MIN_COUNT,
  SCIENCE_FINAL_EXAM_PASS_PERCENT,
} from "@/lib/science/final-exam/config";
import { buildScienceExamBank, pickScienceExamExerciseIds } from "@/lib/science/final-exam/picker";
import { gradeScienceFinalExam } from "@/lib/science/final-exam/grading";
import {
  clearScienceFinalExamState,
  createInitialScienceFinalExamState,
  loadScienceFinalExamState,
  saveScienceFinalExamState,
} from "@/lib/science/final-exam/storage";

/**
 * Structural final-exam state shared by the SHARED SubjectFinalExamScreen.
 * English's `EnglishFinalExamState` and Science's `ScienceFinalExamState` are
 * structurally identical (both the V1 shape); this alias lets the screen read
 * either through the config without importing a subject's state type. Each
 * subject still owns its OWN storage keys, picker, config, and grading.
 */
export type FinalExamState = {
  version: 1;
  createdAt: string;
  pickerVersion: 1;
  selectedExerciseIds: ExerciseId[];
  answers: Record<ExerciseId, string>;
  correctMap: Record<ExerciseId, boolean>;
  submittedAt?: string;
  scorePercent?: number;
  passed?: boolean;
};

/** Structural grading result shared by the SHARED SubjectFinalExamScreen. */
export type FinalExamGradingResult = {
  total: number;
  answeredCount: number;
  correctCount: number;
  scorePercent: number;
  passed: boolean;
  correctMap: Record<ExerciseId, boolean>;
  canFinish: boolean;
};

/**
 * Final-exam wiring for the SHARED SubjectFinalExamScreen. Captures everything
 * that differs between the English and Science exam screens: the exam bank /
 * picker, isolated storage, grading (each subject calls `gradeExam` with its OWN
 * pass percent — never changed here), thresholds, copy, and the locked-notice text.
 *
 * CRITICAL — grading & storage isolation: thresholds and storage are wired
 * per subject; the shared screen never branches on subject and never touches a
 * threshold or storage key. It only forwards through these callbacks.
 */
export type SubjectFinalExamConfig = {
  /** Minimum exercises required to assemble a valid exam (subject-owned). */
  minCount: number;
  /** Pass threshold % shown in the retry copy (subject-owned, English 80 / Science 80). */
  passPercent: number;

  /** All exam-bank exercises for a level — used to resolve selected ids. */
  buildExamBank: (level: GradeId) => Exercise[];
  /** Deterministic pick of exercise ids for a fresh exam (subject-owned seed/version). */
  pickExerciseIds: (params: { level: GradeId; seed: string; pickerVersion: 1 }) => ExerciseId[];

  /** Grade the exam via the subject's grading module (which applies its own passPercent). */
  grade: (params: { selectedExercises: Exercise[]; answers: Record<ExerciseId, string> }) => FinalExamGradingResult;

  /** Isolated per-subject exam-state storage. */
  loadState: (level: GradeId) => FinalExamState | null;
  saveState: (state: FinalExamState, level: GradeId) => void;
  clearState: (level: GradeId) => void;
  createInitialState: (params: { selectedExerciseIds: ExerciseId[] }) => FinalExamState;

  /** Per-level title suffix: "📝 מִבְחָן מְסַכֵּם · {label}". */
  levelLabel: (level: GradeId) => string;
  /** Locked-notice description (subject-specific phrasing). */
  lockedDescription: string;

  testIds: typeof testIds.screen.english.exam;
};

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

  /**
   * Subject passed to the progress / answer hooks. Same value as `subject`,
   * but typed as the hooks' `Subject` union so it can be forwarded directly.
   */
  progressSubject: Subject;

  /** Ordered list of levels for this subject (currently always ["a", "b"]). */
  levels: GradeId[];

  // --- Content + progress (isolated per subject) ---
  getDays: (level: GradeId) => WorkbookDay[];
  /** All days across every level — used by Day/Section screens to resolve a dayId. */
  getAllDays: () => WorkbookDay[];
  getTotalDays: (level: GradeId) => number;
  loadProgressState: () => WorkbookProgressState;
  isLevelUnlocked: (level: GradeId, opts?: { previewAll?: boolean }) => boolean;

  // --- Labels ---
  levelLabel: (level: GradeId) => string;
  levelSubtitle: (level: GradeId) => string;
  /** "חֲזָרָה לְאַנְגְּלִית" / "חֲזָרָה לְמַדָּעִים" — back-to-subject nav label. */
  backToSubjectLabel: string;

  // --- Routes ---
  levelPickerRoute: (opts?: Omit<RouteOpts, "grade">) => string;
  homeRoute: (level: GradeId, opts?: Omit<RouteOpts, "grade">) => string;
  dayRoute: (level: GradeId, dayId: string, opts?: Omit<RouteOpts, "grade">) => string;
  sectionRoute: (level: GradeId, dayId: string, sectionId: string, opts?: Omit<RouteOpts, "grade">) => string;
  examRoute: (level: GradeId, opts?: Omit<RouteOpts, "grade">) => string;

  // --- Final exam screen (isolated grading/storage per subject) ---
  exam: SubjectFinalExamConfig;

  // --- Day screen presentation ---
  day: {
    /** Emoji on an open (not-locked, not-complete) section card — "🔤" / "🔬". */
    sectionCardEmoji: string;
    testIds: typeof testIds.screen.english.day;
  };

  // --- Section screen presentation ---
  section: {
    testIds: typeof testIds.screen.english.section;
  };

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
  progressSubject: "english",
  levels: ENGLISH_LEVELS,

  getDays: getEnglishDays,
  getAllDays: getAllEnglishDays,
  getTotalDays: getEnglishTotalDays,
  loadProgressState: loadEnglishProgressState,
  isLevelUnlocked: isEnglishLevelUnlocked,

  levelLabel: englishLevelLabel,
  levelSubtitle: englishLevelSubtitle,
  backToSubjectLabel: "חֲזָרָה לְאַנְגְּלִית",

  levelPickerRoute: routes.englishLevelPicker,
  homeRoute: routes.englishHome,
  dayRoute: routes.englishDay,
  sectionRoute: routes.englishSection,
  examRoute: routes.englishExam,

  exam: {
    minCount: ENGLISH_FINAL_EXAM_MIN_COUNT,
    passPercent: ENGLISH_FINAL_EXAM_PASS_PERCENT,
    buildExamBank: buildEnglishExamBank,
    pickExerciseIds: pickEnglishExamExerciseIds,
    grade: gradeEnglishFinalExam,
    loadState: loadEnglishFinalExamState,
    saveState: saveEnglishFinalExamState,
    clearState: clearEnglishFinalExamState,
    createInitialState: createInitialEnglishFinalExamState,
    levelLabel: englishLevelLabel,
    lockedDescription: "הַשְׁלִימוּ אֶת כָּל הַשִּׁעוּרִים בְּאַנְגְּלִית כְּדֵי לִפְתֹּחַ אֶת הַמִּבְחָן.",
    testIds: testIds.screen.english.exam,
  },

  day: {
    sectionCardEmoji: "🔤",
    testIds: testIds.screen.english.day,
  },

  section: {
    testIds: testIds.screen.english.section,
  },

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
  progressSubject: "science",
  levels: SCIENCE_LEVELS,

  getDays: getScienceDays,
  getAllDays: getAllScienceDays,
  getTotalDays: getScienceTotalDays,
  loadProgressState: loadScienceProgressState,
  isLevelUnlocked: isScienceLevelUnlocked,

  levelLabel: scienceLevelLabel,
  levelSubtitle: scienceLevelSubtitle,
  backToSubjectLabel: "חֲזָרָה לְמַדָּעִים",

  levelPickerRoute: routes.scienceLevelPicker,
  homeRoute: routes.scienceHome,
  dayRoute: routes.scienceDay,
  sectionRoute: routes.scienceSection,
  examRoute: routes.scienceExam,

  exam: {
    minCount: SCIENCE_FINAL_EXAM_MIN_COUNT,
    passPercent: SCIENCE_FINAL_EXAM_PASS_PERCENT,
    buildExamBank: buildScienceExamBank,
    pickExerciseIds: pickScienceExamExerciseIds,
    grade: gradeScienceFinalExam,
    loadState: loadScienceFinalExamState,
    saveState: saveScienceFinalExamState,
    clearState: clearScienceFinalExamState,
    createInitialState: createInitialScienceFinalExamState,
    levelLabel: scienceLevelLabel,
    lockedDescription: "הַשְׁלִימוּ אֶת כָּל הַשִּׁעוּרִים בַּמַּדָּעִים כְּדֵי לִפְתֹּחַ אֶת הַמִּבְחָן.",
    testIds: testIds.screen.science.exam,
  },

  day: {
    sectionCardEmoji: "🔬",
    testIds: testIds.screen.science.day,
  },

  section: {
    testIds: testIds.screen.science.section,
  },

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
