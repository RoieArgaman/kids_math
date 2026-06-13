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
    subjectPicker: {
      root: () => tid("screen", "subjectPicker"),
      hero: () => tid("screen", "subjectPicker", "hero"),
      adminCta: () => tid("screen", "subjectPicker", "cta", "admin"),
      mathCard: () => tid("screen", "subjectPicker", "subjectCard", "math"),
      mathCardCta: () => tid("screen", "subjectPicker", "subjectCard", "math", "cta"),
      englishCard: () => tid("screen", "subjectPicker", "subjectCard", "english"),
      englishCardCta: () => tid("screen", "subjectPicker", "subjectCard", "english", "cta"),
    },
    gradePicker: {
      root: () => tid("screen", "gradePicker"),
      hero: () => tid("screen", "gradePicker", "hero"),
      navBack: () => tid("screen", "gradePicker", "nav", "back"),
      adminCta: () => tid("screen", "gradePicker", "cta", "admin"),
      gradeCard: (grade: string) => tid("screen", "gradePicker", "gradeCard", "grade", grade),
      gradeCardCta: (grade: string) => tid("screen", "gradePicker", "gradeCard", "grade", grade, "cta"),
    },
    english: {
      home: {
        root: () => tid("screen", "english", "home"),
        hero: () => tid("screen", "english", "home", "hero"),
        dayCard: (dayId: string) => tid("screen", "english", "home", "dayCard", "day", dayId),
        dayCardCta: (dayId: string) => tid("screen", "english", "home", "dayCard", "day", dayId, "cta"),
        examCard: () => tid("screen", "english", "home", "examCard"),
        examCardCta: () => tid("screen", "english", "home", "examCard", "cta"),
      },
      exam: {
        root: () => tid("screen", "english", "exam"),
        nav: () => tid("screen", "english", "exam", "nav"),
        stickyHeader: () => tid("screen", "english", "exam", "stickyHeader"),
        finishCta: () => tid("screen", "english", "exam", "cta", "finish"),
        retryCta: () => tid("screen", "english", "exam", "cta", "retry"),
        finishPanel: () => tid("screen", "english", "exam", "finishPanel"),
        lockedNotice: () => tid("screen", "english", "exam", "lockedNotice"),
      },
      day: {
        root: (dayId: string) => tid("screen", "english", "day", "day", dayId),
        nav: (dayId: string) => tid("screen", "english", "day", "nav", "day", dayId),
        sectionCard: (dayId: string, sectionId: string) =>
          tid("screen", "english", "day", "day", dayId, "sectionCard", "section", sectionId),
        sectionCardCta: (dayId: string, sectionId: string) =>
          tid("screen", "english", "day", "day", dayId, "sectionCard", "section", sectionId, "cta"),
        completionPanel: (dayId: string) => tid("screen", "english", "day", "day", dayId, "completionPanel"),
        completeCta: (dayId: string) => tid("screen", "english", "day", "day", dayId, "cta", "complete"),
      },
      section: {
        root: (dayId: string, sectionId: string) =>
          tid("screen", "english", "section", "day", dayId, "section", sectionId),
        nav: (dayId: string, sectionId: string) =>
          tid("screen", "english", "section", "nav", "day", dayId, "section", sectionId),
        stickyHeader: (dayId: string, sectionId: string) =>
          tid("screen", "english", "section", "stickyHeader", "day", dayId, "section", sectionId),
        completionPanel: (dayId: string, sectionId: string) =>
          tid("screen", "english", "section", "completionPanel", "day", dayId, "section", sectionId),
      },
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
      dayCardRecordTime: (dayId: string) => childTid(tid("screen", "home", "dayCard", "day", dayId), "recordTime"),
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
      sectionRow: (grade: string, dayId: string, sectionId: string) =>
        tid("screen", "adminProgress", "grade", grade, "day", dayId, "section", sectionId),
      sectionState: (grade: string, dayId: string, sectionId: string) =>
        tid("screen", "adminProgress", "grade", grade, "day", dayId, "section", sectionId, "state"),
      markSectionComplete: (grade: string, dayId: string, sectionId: string) =>
        tid("screen", "adminProgress", "grade", grade, "day", dayId, "section", sectionId, "cta", "complete"),
      resetSection: (grade: string, dayId: string, sectionId: string) =>
        tid("screen", "adminProgress", "grade", grade, "day", dayId, "section", sectionId, "cta", "reset"),
      resetSectionConfirm: (grade: string, dayId: string, sectionId: string) =>
        tid("screen", "adminProgress", "grade", grade, "day", dayId, "section", sectionId, "cta", "reset", "confirm"),
      resetSectionCancel: (grade: string, dayId: string, sectionId: string) =>
        tid("screen", "adminProgress", "grade", grade, "day", dayId, "section", sectionId, "cta", "reset", "cancel"),
      daySectionsToggle: (grade: string, dayId: string) =>
        tid("screen", "adminProgress", "grade", grade, "day", dayId, "sections", "toggle"),
      markAllDaysComplete: (grade: string) => tid("screen", "adminProgress", "grade", grade, "cta", "markAllDaysComplete"),
      forceFinalExamComplete: (grade: string) => tid("screen", "adminProgress", "grade", grade, "cta", "forceFinalExamComplete"),
      statusMessage: () => tid("screen", "adminProgress", "statusMessage"),
      ttsToggle: () => tid("screen", "adminProgress", "tts", "toggle"),
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
      dayHeader: (grade: string, dayId: string) => tid("screen", "day", "dayHeader", "grade", grade, "day", dayId),
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
    dayOverview: {
      root: (grade: string, dayId: string) => tid("screen", "dayOverview", "grade", grade, "day", dayId),
      nav: (grade: string, dayId: string) => tid("screen", "dayOverview", "nav", "grade", grade, "day", dayId),
      sectionCard: (grade: string, dayId: string, sectionId: string) =>
        tid("screen", "dayOverview", "sectionCard", "grade", grade, "day", dayId, "section", sectionId),
      sectionCardCta: (grade: string, dayId: string, sectionId: string) =>
        tid("screen", "dayOverview", "sectionCard", "grade", grade, "day", dayId, "section", sectionId, "cta"),
      completionPanel: (grade: string, dayId: string) =>
        tid("screen", "dayOverview", "completionPanel", "grade", grade, "day", dayId),
      completeCta: (grade: string, dayId: string) =>
        tid("screen", "dayOverview", "cta", "complete", "grade", grade, "day", dayId),
      teachingPrimer: (grade: string, dayId: string) =>
        tid("screen", "dayOverview", "grade", grade, "day", dayId, "teachingPrimer"),
      teachingPrimerTts: (grade: string, dayId: string) =>
        tid("screen", "dayOverview", "grade", grade, "day", dayId, "teachingPrimer", "tts"),
      teachingPrimerExpand: (grade: string, dayId: string) =>
        tid("screen", "dayOverview", "grade", grade, "day", dayId, "teachingPrimer", "expand"),
    },
    section: {
      root: (grade: string, dayId: string, sectionId: string) =>
        tid("screen", "section", "grade", grade, "day", dayId, "section", sectionId),
      nav: (grade: string, dayId: string, sectionId: string) =>
        tid("screen", "section", "nav", "grade", grade, "day", dayId, "section", sectionId),
      stickyHeader: (grade: string, dayId: string, sectionId: string) =>
        tid("screen", "section", "stickyHeader", "grade", grade, "day", dayId, "section", sectionId),
      completionPanel: (grade: string, dayId: string, sectionId: string) =>
        tid("screen", "section", "completionPanel", "grade", grade, "day", dayId, "section", sectionId),
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
        tts: (sectionId: string) =>
          childTid(tid("component", "sectionBlock", "section", sectionId), "example", "tts"),
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
      tts: (exerciseId: string) => tid("component", "exerciseBox", "exercise", exerciseId, "tts"),
      audio: (exerciseId: string) => tid("component", "exerciseBox", "exercise", exerciseId, "audio"),
      tile: (exerciseId: string, index: number) =>
        tid("component", "exerciseBox", "exercise", exerciseId, "tile", index),
      tileWord: (exerciseId: string) => tid("component", "exerciseBox", "exercise", exerciseId, "tileWord"),
      tileBackspace: (exerciseId: string) =>
        tid("component", "exerciseBox", "exercise", exerciseId, "tileBackspace"),
      matchLeft: (exerciseId: string, index: number) =>
        tid("component", "exerciseBox", "exercise", exerciseId, "matchLeft", index),
      matchRight: (exerciseId: string, index: number) =>
        tid("component", "exerciseBox", "exercise", exerciseId, "matchRight", index),
    },
    shapeIcon: {
      root: (shape: string) => tid("component", "shapeIcon", shape),
      svg: (shape: string) => tid("component", "shapeIcon", shape, "svg"),
      fallback: () => tid("component", "shapeIcon", "fallback"),
    },
    mathLabel: (exerciseId: string, optionKey: string) =>
      tid("component", "exerciseBox", "exercise", exerciseId, "mathLabel", optionKey),
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
    auth: {
      topBar: () => tid("component", "auth", "topBar"),
      loginButton: () => tid("component", "auth", "loginButton"),
      loginModal: () => tid("component", "auth", "loginModal"),
      loginModalOverlay: () => tid("component", "auth", "loginModal", "overlay"),
      usernameInput: () => tid("component", "auth", "loginModal", "username"),
      passwordInput: () => tid("component", "auth", "loginModal", "password"),
      submitButton: () => tid("component", "auth", "loginModal", "submit"),
      errorMessage: () => tid("component", "auth", "loginModal", "error"),
      avatar: () => tid("component", "auth", "avatar"),
      avatarDropdown: () => tid("component", "auth", "avatar", "dropdown"),
      logoutButton: () => tid("component", "auth", "avatar", "logout"),
      adminUsersLink: () => tid("component", "auth", "avatar", "adminUsers"),
    },
    adminUsers: {
      root: () => tid("component", "adminUsers"),
      userRow: (userId: string) => tid("component", "adminUsers", "user", userId),
      addForm: () => tid("component", "adminUsers", "addForm"),
      usernameInput: () => tid("component", "adminUsers", "addForm", "username"),
      passwordInput: () => tid("component", "adminUsers", "addForm", "password"),
      adminToggle: () => tid("component", "adminUsers", "addForm", "adminToggle"),
      submitButton: () => tid("component", "adminUsers", "addForm", "submit"),
      deleteButton: (userId: string) => tid("component", "adminUsers", "user", userId, "delete"),
      deleteConfirm: (userId: string) => tid("component", "adminUsers", "user", userId, "deleteConfirm"),
      deleteCancel: (userId: string) => tid("component", "adminUsers", "user", userId, "deleteCancel"),
    },
  },
} as const;

