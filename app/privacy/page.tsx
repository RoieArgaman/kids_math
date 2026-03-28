import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection } from "@/components/legal/LegalSection";
import { PrivacyCookieHint } from "@/components/legal/PrivacyCookieHint";
import { HeroHeader } from "@/components/ui/HeroHeader";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";

export const metadata: Metadata = {
  title: "מדיניות פרטיות | חוברת מתמטיקה",
  description: "מידע על איסוף ושימוש במידע באפליקציית החוברת הדיגיטלית",
};

export default function PrivacyPage() {
  const root = testIds.screen.privacy.root();
  const cookieSectionBase = childTid(root, "section", "cookies");
  return (
    <main data-testid={root} className="mx-auto w-full max-w-[720px] space-y-5 px-4 pb-14 pt-8">
      <Link
        data-testid={testIds.screen.privacy.navBack()}
        className="touch-button mb-4 inline-flex text-slate-700"
        href={routes.gradePicker()}
      >
        חזרה לבחירת כיתה
      </Link>

      <HeroHeader
        data-testid={childTid(root, "hero")}
        className="!px-6 !py-8 sm:!px-8 sm:!py-10"
        title="מדיניות פרטיות"
        subtitle="מסמך זה מסביר בקצרה אילו נתונים נשמרים במכשיר ולמה, בהתאם לשקיפות מומלצת. אין כאן ייעוץ משפטי."
        decorations={[
          { emoji: "🔒", className: "pointer-events-none absolute -left-2 -top-2 text-6xl opacity-15 select-none" },
        ]}
      />

      <LegalSection
        rootTestId={root}
        sectionKey="scope"
        title="מי האחראי"
        paragraphs={[
          "האפליקציה פועלת כשירות מקומי בדפדפן: רוב המידע נשמר אצלכם במכשיר ולא נשלח לשרת לצורך פרופיל משתמש או פרסום ממוקד.",
        ]}
      />

      <LegalSection
        rootTestId={root}
        sectionKey="storage"
        title="מה נשמר במכשיר (אחסון מקומי)"
        listItems={[
          "התקדמות בלימודים (ימים שהושלמו, מצב תרגול) — כדי לאפשר המשך עבודה מהנקודה האחרונה.",
          "מצב מבחן מסכם ואתגר זמן — כדי לנהל את חוויית המבחן וההמשך בין ביקורים.",
          "אירועי שימוש פנימיים (למשל מעבר בין מסכים) — לצורך שיפור המוצר; הנתונים נשמרים באופן מקומי ואינם מזהים אישית מעבר לפעילות באפליקציה.",
        ]}
      />

      <LegalSection
        rootTestId={root}
        sectionKey="cookies"
        title="עוגיות (Cookies)"
        footer={<PrivacyCookieHint baseTestId={cookieSectionBase} />}
      />

      <LegalSection
        rootTestId={root}
        sectionKey="children"
        title="ילדים והורים"
        paragraphs={[
          "המוצר מיועד ללמידה ביתית־חינוכית. מומלץ שההורים או המטפלים ילוו את השימוש. אין איסוף מכוון של פרטי זיהוי אישיים לצורך שיווק.",
        ]}
      />

      <LegalSection
        rootTestId={root}
        sectionKey="rights"
        title="זכויות ופניות"
        paragraphs={[
          "ניתן למחוק נתונים מקומיים דרך הגדרות הדפדפן (אחסון לאתר) או באמצעות כלים שיפורסמו באפליקציה. לבקשות בנושא פרטיות ניתן לפנות לבעל השירות בערוץ שיפורסם.",
        ]}
      />
    </main>
  );
}
