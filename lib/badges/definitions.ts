import type { BadgeDefinition } from "./types";

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // --- Progress milestones ---
  {
    id: "first-day-done",
    icon: "🌟",
    name: "יום ראשון",
    description: "השלמת את יום א׳",
    tier: "bronze",
  },
  {
    id: "streak-3-days",
    icon: "🔥",
    name: "3 ימים",
    description: 'השלמת 3 ימים בסה"כ',
    tier: "bronze",
  },
  {
    id: "streak-5-days",
    icon: "🌈",
    name: "5 ימים",
    description: 'השלמת 5 ימים בסה"כ',
    tier: "bronze",
  },
  {
    id: "streak-10-days",
    icon: "🚀",
    name: "10 ימים",
    description: 'השלמת 10 ימים בסה"כ',
    tier: "silver",
  },
  {
    id: "halfway-there",
    icon: "🎯",
    name: "חצי הדרך",
    description: "השלמת חצי מכל ימי החומר",
    tier: "bronze",
  },
  // --- Weekly milestones ---
  {
    id: "week-1-complete",
    icon: "📅",
    name: "שבוע ראשון",
    description: "השלמת את כל ימי השבוע הראשון",
    tier: "bronze",
  },
  {
    id: "week-2-complete",
    icon: "📆",
    name: "שבוע שני",
    description: "השלמת את כל ימי השבוע השני",
    tier: "bronze",
  },
  {
    id: "week-3-complete",
    icon: "🗓️",
    name: "שבוע שלישי",
    description: "השלמת את כל ימי השבוע השלישי",
    tier: "bronze",
  },
  {
    id: "week-4-complete",
    icon: "🏆",
    name: "שבוע רביעי",
    description: "השלמת את כל ימי השבוע הרביעי",
    tier: "bronze",
  },
  // --- Accuracy badges ---
  {
    id: "zero-mistakes",
    icon: "💎",
    name: "ללא טעויות",
    description: "השלמת יום אחד — כל תשובה נכונה בניסיון הראשון",
    tier: "bronze",
  },
  {
    id: "sharp-mind",
    icon: "🧠",
    name: "חד כתער",
    description: "השלמת 3 ימים שונים — כל תשובה נכונה בניסיון הראשון",
    tier: "silver",
  },
  {
    id: "flawless-five",
    icon: "⭐",
    name: "חמישייה מושלמת",
    description: "השלמת 5 ימים שונים — כל תשובה נכונה בניסיון הראשון",
    tier: "gold",
  },
  {
    id: "zero-hero",
    icon: "🏅",
    name: "גיבור הדיוק",
    description: "השלמת 10 ימים שונים — כל תשובה נכונה בניסיון הראשון",
    tier: "gold",
  },
  {
    id: "perfect-week",
    icon: "👑",
    name: "שבוע מושלם",
    description: "שבוע שלם — כל תשובה נכונה בניסיון הראשון בכל יום",
    tier: "silver",
  },
  {
    id: "perfect-two-weeks",
    icon: "💫",
    name: "שבועיים מושלמים",
    description: "שבועיים שלמים — כל תשובה נכונה בניסיון הראשון בכל יום",
    tier: "gold",
  },
  // --- Speed badges ---
  {
    id: "speed-runner",
    icon: "⚡",
    name: "רץ מהיר",
    description: "השלמת יום תוך פחות מ-5 דקות",
    tier: "bronze",
  },
  {
    id: "lightning-fast",
    icon: "🌩️",
    name: "ברק",
    description: "השלמת יום תוך פחות מ-3 דקות",
    tier: "silver",
  },
  {
    id: "speed-trio",
    icon: "🏎️",
    name: "שלישייה מהירה",
    description: "השלמת 3 ימים שונים תוך פחות מ-5 דקות כל אחד",
    tier: "silver",
  },
  // --- Perseverance badges ---
  {
    id: "comeback-kid",
    icon: "💪",
    name: "אלוף ההתמדה",
    description: "השלמת יום עם 5 טעויות ומעלה (לפחות 10 ניסיונות)",
    tier: "bronze",
  },
  {
    id: "iron-will",
    icon: "🔨",
    name: "רצון ברזל",
    description: "השלמת 3 ימים שונים עם 5 טעויות ומעלה בכל אחד (לפחות 10 ניסיונות ביום)",
    tier: "silver",
  },
  {
    id: "ten-and-done",
    icon: "💥",
    name: "עשר ונצחתי",
    description: "השלמת יום עם 10 טעויות ומעלה — לא מוותרים! (לפחות 15 ניסיונות)",
    tier: "silver",
  },
  // --- Time-based badges ---
  {
    id: "early-bird",
    icon: "🌅",
    name: "ציפור השחר",
    description: "השלמת יום לפני השעה 8 בבוקר",
    tier: "bronze",
  },
  {
    id: "weekend-warrior",
    icon: "🦸",
    name: "לוחם סוף השבוע",
    description: "השלמת יום בסוף השבוע",
    tier: "bronze",
  },
  // --- Calendar streaks ---
  {
    id: "calendar-streak-3",
    icon: "📌",
    name: "3 ימים רצופים",
    description: "למדת 3 ימי לוח רצופים",
    tier: "bronze",
  },
  {
    id: "calendar-streak-7",
    icon: "🗒️",
    name: "שבוע רצוף",
    description: "למדת 7 ימי לוח רצופים — שבוע שלם!",
    tier: "silver",
  },
  // --- Ministry strand mastery ---
  {
    id: "strand-numbers",
    icon: "🔢",
    name: "מאסטר המספרים",
    description: "השלמת את כל ימי תחום המספרים הטבעיים",
    tier: "silver",
  },
  {
    id: "strand-operations",
    icon: "➕",
    name: "מאסטר החשבון",
    description: "השלמת את כל ימי תחום הפעולות החשבוניות",
    tier: "silver",
  },
  {
    id: "strand-geometry",
    icon: "📐",
    name: "מאסטר הגאומטריה",
    description: "השלמת את כל ימי תחום המדידה והגאומטריה",
    tier: "silver",
  },
  {
    id: "strand-advanced",
    icon: "🌠",
    name: "מאסטר מתקדם",
    description: "השלמת את כל ימי התחום המשלים והמתקדם",
    tier: "silver",
  },
  // --- Final exam performance ---
  {
    id: "exam-high-score",
    icon: "🥇",
    name: "ציון מצוין",
    description: "קיבלת 90% ומעלה במבחן המסכם",
    tier: "silver",
  },
  {
    id: "exam-ace",
    icon: "💯",
    name: "אס המבחן",
    description: "קיבלת 100% במבחן המסכם — מושלם!",
    tier: "gold",
  },
  // --- Effort badges ---
  {
    id: "hundred-answers",
    icon: "💬",
    name: "מאה תשובות",
    description: 'ענית על 100 שאלות בסה"כ',
    tier: "bronze",
  },
  {
    id: "five-hundred-answers",
    icon: "🎪",
    name: "חמש מאות תשובות",
    description: 'ענית על 500 שאלות בסה"כ',
    tier: "silver",
  },
  // --- Grand master ---
  {
    id: "grand-master",
    icon: "✨",
    name: "גאון המתמטיקה",
    description: "השלמת את כל ימי החוברת בלי אף טעות",
    tier: "platinum",
  },
  // --- Graduation ---
  {
    id: "grade-a-graduate",
    icon: "🎓",
    name: "בוגר כיתה א׳",
    description: "עברת את כל ימי כיתה א׳ ואת המבחן המסכם",
    tier: "gold",
  },
  {
    id: "grade-b-graduate",
    icon: "🏫",
    name: "בוגר כיתה ב׳",
    description: "עברת את כל ימי כיתה ב׳ ואת המבחן המסכם",
    tier: "gold",
  },
];

export const BADGE_DEFINITIONS_MAP: Record<string, BadgeDefinition> = Object.fromEntries(
  BADGE_DEFINITIONS.map((b) => [b.id, b]),
);
