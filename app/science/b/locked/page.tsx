import { LockedGradeScreen } from "@/components/screens/LockedGradeScreen";
import { routes } from "@/lib/routes";
import { testIds } from "@/lib/testIds";

export default function ScienceLevelBLockedPage() {
  return (
    <LockedGradeScreen
      rootTestId={testIds.screen.lockedGrade.root("science")}
      reasonTestId={testIds.screen.lockedGrade.reason("science")}
      emoji="🔬"
      title="מדעים — כיתה ב׳ נעולה"
      reason="כדי לפתוח את כיתה ב׳ במדעים צריך לסיים את כל שיעורי כיתה א׳ ולעבור את המבחן המסכם שלה."
      primary={{
        href: routes.scienceHome("a"),
        label: "חזרה לכיתה א׳ במדעים",
        testId: testIds.screen.lockedGrade.primaryCta("science"),
      }}
      secondary={{
        href: routes.scienceExam("a"),
        label: "למבחן המסכם של כיתה א׳",
        testId: testIds.screen.lockedGrade.secondaryCta("science"),
      }}
    />
  );
}
