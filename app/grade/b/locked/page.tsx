import { LockedGradeScreen } from "@/components/screens/LockedGradeScreen";
import { FINAL_EXAM_DAY_ID, FINAL_EXAM_GRADE } from "@/lib/final-exam/config";
import { routes } from "@/lib/routes";
import { testIds } from "@/lib/testIds";

export default function GradeBLockedPage() {
  return (
    <LockedGradeScreen
      rootTestId={testIds.screen.gradeBLocked.root()}
      title="כיתה ב׳ נעולה"
      reason="כדי לפתוח את כיתה ב׳ בחשבון צריך לסיים את כל ימי הלימוד של כיתה א׳ ולעבור את המבחן המסכם (ציון 85 לפחות)."
      primary={{
        href: routes.gradeHome("a"),
        label: "להמשיך בכיתה א׳",
        testId: testIds.screen.gradeBLocked.continueGradeA(),
      }}
      secondary={{
        href: routes.gradeDay(FINAL_EXAM_GRADE, FINAL_EXAM_DAY_ID),
        label: "ללכת למבחן המסכם",
        testId: testIds.screen.gradeBLocked.goFinalExam(),
      }}
    />
  );
}
