export const TEST_ID_PREFIX = "km";

type Segment = string | number | null | undefined;

function normalizeSegment(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return "x";

  // Keep ids ASCII-only and stable; never leak localized/copy strings into test ids.
  const replaced = trimmed
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

  if (replaced) return replaced;

  // When a segment is entirely non-ASCII (e.g. Hebrew choices), derive a deterministic
  // ASCII fallback so different labels never collapse to the same test id.
  const codepointFallback = Array.from(trimmed)
    .map((char) => char.codePointAt(0)?.toString(16) ?? "x")
    .join("-");

  return codepointFallback ? `u-${codepointFallback}` : "x";
}

export function tid(...segments: Segment[]): string {
  const normalized = segments
    .flatMap((s) => (s === null || s === undefined ? [] : [String(s)]))
    .map(normalizeSegment);
  return [TEST_ID_PREFIX, ...normalized].join(".");
}

export function childTid(base: string, ...pathSegments: Segment[]): string {
  const normalizedBase = String(base).trim();
  const normalizedPath = pathSegments
    .flatMap((s) => (s === null || s === undefined ? [] : [String(s)]))
    .map(normalizeSegment);

  return [normalizedBase, "el", ...normalizedPath].join(".");
}

export function testIdAttr(id: string): { "data-testid": string } {
  return { "data-testid": id };
}

export const testIds = {
  screen: {
    gradePicker: {
      root: () => tid("screen", "gradePicker"),
      hero: () => tid("screen", "gradePicker", "hero"),
      gradeCard: (grade: string) => tid("screen", "gradePicker", "gradeCard", "grade", grade),
      gradeCardCta: (grade: string) => tid("screen", "gradePicker", "gradeCard", "grade", grade, "cta"),
    },
    gradeBLocked: {
      root: () => tid("screen", "grade-b-locked"),
      continueGradeA: () => tid("screen", "grade-b-locked", "cta", "continue-grade-a"),
      goFinalExam: () => tid("screen", "grade-b-locked", "cta", "go-final-exam"),
    },
    home: {
      root: (grade: string) => tid("screen", "home", "grade", grade),
      hero: (grade: string) => tid("screen", "home", "hero", "grade", grade),
      planCta: (grade: string) => tid("screen", "home", "cta", "plan", "grade", grade),
      dayCard: (dayId: string) => tid("screen", "home", "dayCard", "day", dayId),
      dayCardCta: (dayId: string) => tid("screen", "home", "dayCard", "day", dayId, "cta", "open"),
    },
    plan: {
      root: (grade: string) => tid("screen", "plan", "grade", grade),
      hero: (grade: string) => tid("screen", "plan", "hero", "grade", grade),
      overall: () => tid("screen", "plan", "overall"),
      strand: (grade: string, strandId: string) => tid("screen", "plan", "strand", "grade", grade, "strand", strandId),
      dayLink: (grade: string, dayId: string) => tid("screen", "plan", "dayLink", "grade", grade, "day", dayId),
    },
    day: {
      root: (grade: string, dayId: string) => tid("screen", "day", "grade", grade, "day", dayId),
      nav: (grade: string, dayId: string) => tid("screen", "day", "nav", "grade", grade, "day", dayId),
      stickyHeader: (grade: string, dayId: string) => tid("screen", "day", "stickyHeader", "grade", grade, "day", dayId),
      howWeWork: (grade: string, dayId: string) => tid("screen", "day", "howWeWork", "grade", grade, "day", dayId),
      resetNotice: (grade: string, dayId: string) => tid("screen", "day", "resetNotice", "grade", grade, "day", dayId),
      completionPanel: (grade: string, dayId: string) => tid("screen", "day", "completionPanel", "grade", grade, "day", dayId),
      completeCta: (grade: string, dayId: string) => tid("screen", "day", "cta", "complete", "grade", grade, "day", dayId),
    },
    finalExam: {
      root: (grade: string) => tid("screen", "finalExam", "grade", grade),
      stickyHeader: (grade: string) => tid("screen", "finalExam", "stickyHeader", "grade", grade),
      finishPanel: (grade: string) => tid("screen", "finalExam", "finishPanel", "grade", grade),
      finishCta: (grade: string) => tid("screen", "finalExam", "cta", "finish", "grade", grade),
      retryCta: (grade: string) => tid("screen", "finalExam", "cta", "retry", "grade", grade),
      startGradeB: () => tid("screen", "finalExam", "cta", "start-grade-b"),
      gradePicker: () => tid("screen", "finalExam", "cta", "grade-picker"),
    },
    comingSoon: {
      root: (grade: string) => tid("screen", "comingSoon", "grade", grade),
      ctaStartGradeA: () => tid("screen", "comingSoon", "cta", "start-grade-a"),
      ctaGradePicker: () => tid("screen", "comingSoon", "cta", "grade-picker"),
    },
  },
  component: {
    sectionBlock: {
      root: (sectionId: string) => tid("component", "sectionBlock", "section", sectionId),
      title: (sectionId: string) => childTid(tid("component", "sectionBlock", "section", sectionId), "title"),
      emoji: (sectionId: string) => childTid(tid("component", "sectionBlock", "section", sectionId), "emoji"),
      learningGoal: (sectionId: string) =>
        childTid(tid("component", "sectionBlock", "section", sectionId), "learningGoal"),
      example: {
        root: (sectionId: string) => childTid(tid("component", "sectionBlock", "section", sectionId), "example"),
        title: (sectionId: string) =>
          childTid(tid("component", "sectionBlock", "section", sectionId), "example", "title"),
        prompt: (sectionId: string) =>
          childTid(tid("component", "sectionBlock", "section", sectionId), "example", "prompt"),
        math: (sectionId: string) => childTid(tid("component", "sectionBlock", "section", sectionId), "example", "math"),
        steps: (sectionId: string) =>
          childTid(tid("component", "sectionBlock", "section", sectionId), "example", "steps"),
        step: (sectionId: string, idx: number) =>
          childTid(tid("component", "sectionBlock", "section", sectionId), "example", "step", idx),
        takeaway: (sectionId: string) =>
          childTid(tid("component", "sectionBlock", "section", sectionId), "example", "takeaway"),
      },
      body: (sectionId: string) => childTid(tid("component", "sectionBlock", "section", sectionId), "body"),
    },
    ui: {
      heroHeader: {
        root: (key: string) => tid("component", "ui", "heroHeader", "key", key),
      },
      centeredPanel: {
        root: (key: string) => tid("component", "ui", "centeredPanel", "key", key),
      },
      surface: {
        root: (key: string) => tid("component", "ui", "surface", "key", key),
      },
      button: {
        root: (key: string) => tid("component", "ui", "button", "key", key),
      },
      chip: {
        root: (key: string) => tid("component", "ui", "chip", "key", key),
      },
    },
    exerciseBox: {
      root: (exerciseId: string) => tid("component", "exerciseBox", "exercise", exerciseId),
      input: (exerciseId: string) => tid("component", "exerciseBox", "exercise", exerciseId, "input"),
      check: (exerciseId: string) => tid("component", "exerciseBox", "exercise", exerciseId, "check"),
      retry: (exerciseId: string) => tid("component", "exerciseBox", "exercise", exerciseId, "retry"),
      choice: (exerciseId: string, optionKey: string) =>
        tid("component", "exerciseBox", "exercise", exerciseId, "choice", optionKey),
    },
    starReward: {
      overlay: () => tid("component", "starReward", "overlay"),
      dialog: () => tid("component", "starReward", "dialog"),
      confirm: () => tid("component", "starReward", "cta", "confirm"),
    },
  },
} as const;

