import { loadEvents } from "@/lib/analytics/events";
import type { GradeId } from "@/lib/grades";
import { loadFinalExamState } from "@/lib/final-exam/storage";
import type { FinalExamState } from "@/lib/final-exam/types";
import { loadProgressState } from "@/lib/progress/storage";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";
import type { AnalyticsEvent, WorkbookProgressState } from "@/lib/types";

export type GradeHomeResumeState = {
  progress: WorkbookProgressState;
  finalExam: FinalExamState | null;
  events: AnalyticsEvent[];
  previewAll: boolean;
};

export function loadGradeHomeResumeState(grade: GradeId): GradeHomeResumeState {
  return {
    progress: loadProgressState({ grade }),
    finalExam: loadFinalExamState(grade),
    events: loadEvents(),
    previewAll: getPreviewAllFromLocation(),
  };
}

export function loadPlanScreenResumeState(grade: GradeId): Pick<GradeHomeResumeState, "progress" | "previewAll"> {
  return {
    progress: loadProgressState({ grade }),
    previewAll: getPreviewAllFromLocation(),
  };
}
