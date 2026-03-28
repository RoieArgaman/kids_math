import type { BadgeDefinition } from "./types";

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first-day-done",
    icon: "🌟",
    name: "יום ראשון",
    description: "השלמת את יום א׳",
  },
  {
    id: "week-1-complete",
    icon: "📅",
    name: "שבוע ראשון",
    description: "השלמת את כל ימי השבוע הראשון",
  },
  {
    id: "zero-mistakes",
    icon: "💎",
    name: "ללא טעויות",
    description: "השלמת יום אחד בלי אף טעות",
  },
  {
    id: "speed-runner",
    icon: "⚡",
    name: "רץ מהיר",
    description: "השלמת יום תוך פחות מ-5 דקות",
  },
  {
    id: "grade-a-graduate",
    icon: "🎓",
    name: "בוגר כיתה א׳",
    description: "עברת את כל ימי כיתה א׳ ואת המבחן המסכם",
  },
  {
    id: "perfect-week",
    icon: "👑",
    name: "שבוע מושלם",
    description: "השלמת שבוע שלם בלי אף טעות",
  },
  {
    id: "comeback-kid",
    icon: "💪",
    name: "אלוף ההתמדה",
    description: "השלמת יום עם 5 טעויות ומעלה",
  },
  {
    id: "streak-3-days",
    icon: "🔥",
    name: "3 ימים ברצף",
    description: 'השלמת 3 ימים בסה"כ',
  },
];

export const BADGE_DEFINITIONS_MAP: Record<string, BadgeDefinition> = Object.fromEntries(
  BADGE_DEFINITIONS.map((b) => [b.id, b]),
);
