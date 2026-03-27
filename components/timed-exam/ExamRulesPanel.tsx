"use client";

import Link from "next/link";
import { Surface } from "@/components/ui/Surface";
import { childTid } from "@/lib/testIds";

const RULE_BULLETS = [
  "זהו תרגול רשות בלבד — לא משפיע על ציון או פתיחת כיתה.",
  "שלושה מקטעים עם זמן נפרד לכל מקטע (מותאם לגודל המקטע, בהשראת GMAT Focus).",
  "לפני ההתחלה בוחרים את סדר המקטעים.",
  "במהלך מקטע אפשר לסמן שאלות לבדיקה.",
  "בסוף כל מקטע יש שלב סקירה: עד שלוש שאלות שונות מהמצב בסוף המקטע יכולות להשתנות.",
  "אפשר הפסקה קצרה בין מקטעים (רשות, עם דילוג).",
  "השעון ממשיך גם אם עוברים לטאב אחר — כמו במבחן אמיתי.",
] as const;

type ExamRulesPanelProps = {
  rootTestId: string;
  title: string;
  backHref: string;
  backTestId: string;
  onContinue: () => void;
};

export function ExamRulesPanel({
  rootTestId,
  title,
  backHref,
  backTestId,
  onContinue,
}: ExamRulesPanelProps) {
  return (
    <Surface data-testid={rootTestId} variant="default" className="rounded-3xl p-6 shadow-sm">
      <h1 data-testid={childTid(rootTestId, "title")} className="text-xl font-bold text-slate-900">
        {title}
      </h1>
      <ul
        data-testid={childTid(rootTestId, "rules")}
        className="mt-4 list-disc space-y-2 pr-5 text-sm leading-relaxed text-slate-800"
      >
        {RULE_BULLETS.map((text, i) => (
          <li key={i} data-testid={childTid(rootTestId, "rule", i)}>
            {text}
          </li>
        ))}
      </ul>
      <p data-testid={childTid(rootTestId, "note")} className="muted mt-4 text-xs leading-relaxed">
        הכללים מתארים בקצרה את פורמט בחינת ה־GMAT Focus אצל מבוגרים; כאן התוכן הוא מתמטיקה לפי החוברת בלבד, לא בחינת קבלה.
      </p>
      <button
        type="button"
        data-testid={childTid(rootTestId, "cta", "continue")}
        className="touch-button btn-accent mt-6 w-full"
        onClick={onContinue}
      >
        הבנתי, להמשיך
      </button>
      <Link
        data-testid={backTestId}
        href={backHref}
        className="touch-button mt-3 flex w-full items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-800 hover:bg-slate-50"
      >
        חזרה לחוברת
      </Link>
    </Surface>
  );
}
