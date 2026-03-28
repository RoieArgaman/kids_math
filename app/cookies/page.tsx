import type { Metadata } from "next";
import Link from "next/link";
import { CookiesPrivacyLink } from "@/components/legal/CookiesPrivacyLink";
import { LegalSection } from "@/components/legal/LegalSection";
import { HeroHeader } from "@/components/ui/HeroHeader";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";

export const metadata: Metadata = {
  title: "מדיניות עוגיות | חוברת מתמטיקה",
  description: "שימוש בעוגיות ובאחסון טכני דומה באפליקציה",
};

export default function CookiesPage() {
  const root = testIds.screen.cookies.root();
  const moreBase = childTid(root, "section", "more");
  return (
    <main data-testid={root} className="mx-auto w-full max-w-[720px] space-y-5 px-4 pb-14 pt-8">
      <Link
        data-testid={testIds.screen.cookies.navBack()}
        className="touch-button mb-4 inline-flex text-slate-700"
        href={routes.gradePicker()}
      >
        חזרה לבחירת כיתה
      </Link>

      <HeroHeader
        data-testid={childTid(root, "hero")}
        className="!px-6 !py-8 sm:!px-8 sm:!py-10"
        title="מדיניות עוגיות ואחסון דומה"
        subtitle="הבהרה קצרה על עוגיות טכניות ועל אחסון מקומי בדפדפן. אין כאן ייעוץ משפטי."
        decorations={[
          { emoji: "🍪", className: "pointer-events-none absolute -left-2 -top-2 text-6xl opacity-15 select-none" },
        ]}
      />

      <LegalSection
        rootTestId={root}
        sectionKey="essential"
        title="עוגיות הכרחיות / פונקציונליות"
        paragraphs={[
          "האפליקציה עשויה להשתמש בעוגיית HTTP (מאובטחת ככלשרלוונטי) כדי לזכור הרשאת גישה לתכנים לאחר השלמת מבחן מסכם (למשל פתיחת מסלול כיתה ב׳). העוגיה נועדה לתפקוד השירות ולא לפרסום ממוקד.",
        ]}
      />

      <LegalSection
        rootTestId={root}
        sectionKey="local"
        title="אחסון מקומי (לא עוגיות)"
        paragraphs={[
          "חלק מהמידע נשמר ב־localStorage בדפדפן: התקדמות לימודית, מצב מבחנים ואתגרים, ואירועי שימוש פנימיים. אלה אינם עוגיות, אבל דומים מבחינת שליטה במכשיר — ניתן למחוק דרך הגדרות הדפדפן.",
        ]}
      />

      <LegalSection
        rootTestId={root}
        sectionKey="third"
        title="צדדים שלישיים"
        paragraphs={[
          "בגרסה הנוכחית אין שילוב של כלי פרסום או אנליטיקה חיצונית שמעבירים מידע אישי לצד ג׳ לצורך מעקב. אם יתווספו בעתיד — תעודכן מדיניות זו ויוצגו בחירות מתאימות לפי הצורך.",
        ]}
      />

      <LegalSection
        rootTestId={root}
        sectionKey="more"
        title="מידע נוסף"
        footer={<CookiesPrivacyLink baseTestId={moreBase} />}
      />
    </main>
  );
}
