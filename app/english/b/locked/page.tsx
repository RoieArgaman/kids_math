import { LockedGradeScreen } from "@/components/screens/LockedGradeScreen";
import { routes } from "@/lib/routes";
import { testIds } from "@/lib/testIds";

export default function EnglishLevelBLockedPage() {
  return (
    <LockedGradeScreen
      rootTestId={testIds.screen.lockedGrade.root("english")}
      reasonTestId={testIds.screen.lockedGrade.reason("english")}
      emoji="🔤"
      title="אנגלית — שלב ב׳ נעול"
      reason="כדי לפתוח את שלב ב׳ באנגלית צריך לסיים את כל שיעורי שלב א׳ ולעבור את המבחן המסכם שלו."
      primary={{
        href: routes.englishHome("a"),
        label: "חזרה לשלב א׳ באנגלית",
        testId: testIds.screen.lockedGrade.primaryCta("english"),
      }}
      secondary={{
        href: routes.englishExam("a"),
        label: "למבחן המסכם של שלב א׳",
        testId: testIds.screen.lockedGrade.secondaryCta("english"),
      }}
    />
  );
}
