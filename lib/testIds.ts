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
      adminCta: () => tid("screen", "gradePicker", "cta", "admin"),
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
      adminCta: (grade: string) => tid("screen", "home", "cta", "admin", "grade", grade),
      dayCard: (dayId: string) => tid("screen", "home", "dayCard", "day", dayId),
      dayCardCta: (dayId: string) => tid("screen", "home", "dayCard", "day", dayId, "cta", "open"),
      gmatChallengeCta: (grade: string) => tid("screen", "home", "cta", "gmatChallenge", "grade", grade),
    },
    adminProgress: {
      root: () => tid("screen", "adminProgress"),
      navBack: () => tid("screen", "adminProgress", "nav", "back"),
      pinInput: () => tid("screen", "adminProgress", "pin", "input"),
      pinSubmit: () => tid("screen", "adminProgress", "pin", "submit"),
      pinError: () => tid("screen", "adminProgress", "pin", "error"),
      gradeSelect: () => tid("screen", "adminProgress", "grade", "select"),
      dayRow: (grade: string, dayId: string) => tid("screen", "adminProgress", "grade", grade, "day", dayId),
      dayState: (grade: string, dayId: string) => tid("screen", "adminProgress", "grade", grade, "day", dayId, "state"),
      markComplete: (grade: string, dayId: string) =>
        tid("screen", "adminProgress", "grade", grade, "day", dayId, "cta", "complete"),
      reset: (grade: string, dayId: string) => tid("screen", "adminProgress", "grade", grade, "day", dayId, "cta", "reset"),
      resetConfirm: (grade: string, dayId: string) =>
        tid("screen", "adminProgress", "grade", grade, "day", dayId, "cta", "reset", "confirm"),
      resetCancel: (grade: string, dayId: string) =>
        tid("screen", "adminProgress", "grade", grade, "day", dayId, "cta", "reset", "cancel"),
      markAllDaysComplete: (grade: string) => tid("screen", "adminProgress", "grade", grade, "cta", "markAllDaysComplete"),
      forceFinalExamComplete: (grade: string) => tid("screen", "adminProgress", "grade", grade, "cta", "forceFinalExamComplete"),
      statusMessage: () => tid("screen", "adminProgress", "statusMessage"),
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
      gmatChallengeCta: (grade: string) => tid("screen", "finalExam", "cta", "gmatChallenge", "grade", grade),
    },
    gmatChallenge: {
      root: (grade: string) => tid("screen", "gmatChallenge", "grade", grade),
      locked: (grade: string) => tid("screen", "gmatChallenge", "grade", grade, "locked"),
      rulesPanel: (grade: string) => tid("screen", "gmatChallenge", "grade", grade, "rules"),
      orderPanel: (grade: string) => tid("screen", "gmatChallenge", "grade", grade, "order"),
      breakPanel: (grade: string) => tid("screen", "gmatChallenge", "grade", grade, "break"),
      sectionHeader: (grade: string) => tid("screen", "gmatChallenge", "grade", grade, "sectionHeader"),
      finishSectionCta: (grade: string) => tid("screen", "gmatChallenge", "grade", grade, "cta", "finishSection"),
      confirmReviewCta: (grade: string) => tid("screen", "gmatChallenge", "grade", grade, "cta", "confirmReview"),
      results: (grade: string) => tid("screen", "gmatChallenge", "grade", grade, "results"),
      restartCta: (grade: string) => tid("screen", "gmatChallenge", "grade", grade, "cta", "restart"),
    },
    badges: {
      root: (grade: string) => tid("screen", "badges", "grade", grade),
      badgeCard: (badgeId: string) => tid("screen", "badges", "badge", badgeId),
      badgesCta: (grade: string) => tid("screen", "home", "cta", "badges", "grade", grade),
    },
    comingSoon: {
      root: (grade: string) => tid("screen", "comingSoon", "grade", grade),
      ctaStartGradeA: () => tid("screen", "comingSoon", "cta", "start-grade-a"),
      ctaGradePicker: () => tid("screen", "comingSoon", "cta", "grade-picker"),
    },
    privacy: {
      root: () => tid("screen", "privacy"),
      navBack: () => tid("screen", "privacy", "nav", "back"),
    },
    cookies: {
      root: () => tid("screen", "cookies"),
      navBack: () => tid("screen", "cookies", "nav", "back"),
    },
  },
  layout: {
    mainSlot: () => tid("layout", "mainSlot"),
    cookieConsent: {
      root: () => tid("layout", "cookieConsent"),
    },
    siteFooter: {
      root: () => tid("layout", "siteFooter"),
      linkPrivacy: () => tid("layout", "siteFooter", "link", "privacy"),
      linkCookies: () => tid("layout", "siteFooter", "link", "cookies"),
      nav: () => tid("layout", "siteFooter", "nav"),
      sep: () => tid("layout", "siteFooter", "sep"),
      note: () => tid("layout", "siteFooter", "note"),
      wave: () => childTid(tid("layout", "siteFooter"), "wave"),
      waveSvg: () => childTid(tid("layout", "siteFooter"), "wave", "svg"),
      wavePath: () => childTid(tid("layout", "siteFooter"), "wave", "path"),
      content: () => childTid(tid("layout", "siteFooter"), "content"),
      section: () => childTid(tid("layout", "siteFooter"), "section"),
      heading: () => childTid(tid("layout", "siteFooter"), "heading"),
      tray: () => childTid(tid("layout", "siteFooter"), "tray"),
      tilePrivacyRow: () => childTid(tid("layout", "siteFooter"), "tile", "privacy", "row"),
      tilePrivacyEmoji: () => childTid(tid("layout", "siteFooter"), "tile", "privacy", "emoji"),
      tilePrivacyTitle: () => childTid(tid("layout", "siteFooter"), "tile", "privacy", "title"),
      tilePrivacyHint: () => childTid(tid("layout", "siteFooter"), "tile", "privacy", "hint"),
      tileCookiesRow: () => childTid(tid("layout", "siteFooter"), "tile", "cookies", "row"),
      tileCookiesEmoji: () => childTid(tid("layout", "siteFooter"), "tile", "cookies", "emoji"),
      tileCookiesTitle: () => childTid(tid("layout", "siteFooter"), "tile", "cookies", "title"),
      tileCookiesHint: () => childTid(tid("layout", "siteFooter"), "tile", "cookies", "hint"),
      noteLine1: () => childTid(tid("layout", "siteFooter"), "note", "line", 1),
      noteLine2: () => childTid(tid("layout", "siteFooter"), "note", "line", 2),
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
      storageErrorBoundary: {
        root: () => tid("component", "ui", "storageErrorBoundary"),
        title: () => tid("component", "ui", "storageErrorBoundary", "title"),
        body: () => tid("component", "ui", "storageErrorBoundary", "body"),
        br: () => tid("component", "ui", "storageErrorBoundary", "br"),
        detail: () => tid("component", "ui", "storageErrorBoundary", "detail"),
        resetCta: () => tid("component", "ui", "storageErrorBoundary", "cta", "reset"),
      },
    },
    exerciseBox: {
      root: (exerciseId: string) => tid("component", "exerciseBox", "exercise", exerciseId),
      input: (exerciseId: string) => tid("component", "exerciseBox", "exercise", exerciseId, "input"),
      check: (exerciseId: string) => tid("component", "exerciseBox", "exercise", exerciseId, "check"),
      retry: (exerciseId: string) => tid("component", "exerciseBox", "exercise", exerciseId, "retry"),
      choice: (exerciseId: string, optionKey: string) =>
        tid("component", "exerciseBox", "exercise", exerciseId, "choice", optionKey),
      hint: (exerciseId: string) =>
        tid("component", "exerciseBox", "exercise", exerciseId, "hint"),
      hintText: (exerciseId: string) =>
        tid("component", "exerciseBox", "exercise", exerciseId, "hintText"),
    },
    starReward: {
      overlay: () => tid("component", "starReward", "overlay"),
      dialog: () => tid("component", "starReward", "dialog"),
      confirm: () => tid("component", "starReward", "cta", "confirm"),
    },
    trophyUnlock: {
      overlay: () => tid("component", "trophyUnlock", "overlay"),
      dialog: () => tid("component", "trophyUnlock", "dialog"),
      confirm: () => tid("component", "trophyUnlock", "cta", "confirm"),
    },
    streakBadge: {
      root: () => tid("component", "streakBadge"),
    },
  },
} as const;

