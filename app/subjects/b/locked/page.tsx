import { LockedGradeScreen } from "@/components/screens/LockedGradeScreen";
import { routes } from "@/lib/routes";
import { testIds } from "@/lib/testIds";

export default function SubjectsBLockedPage() {
  return (
    <LockedGradeScreen
      rootTestId={testIds.screen.lockedGrade.root("grade")}
      reasonTestId={testIds.screen.lockedGrade.reason("grade")}
      title="כיתה ב׳ עדיין נעולה"
      reason="כדי להיכנס לכיתה ב׳ צריך לסיים לפחות נושא אחד בכיתה א׳ — כל הימים והמבחן המסכם שלו. אז אותו נושא ייפתח בכיתה ב׳."
      primary={{
        href: routes.subjectsForGrade("a"),
        label: "חזרה לנושאים של כיתה א׳",
        testId: testIds.screen.lockedGrade.primaryCta("grade"),
      }}
      secondary={{
        href: routes.gradePicker(),
        label: "חזרה לבחירת כיתה",
        testId: testIds.screen.lockedGrade.secondaryCta("grade"),
      }}
    />
  );
}
