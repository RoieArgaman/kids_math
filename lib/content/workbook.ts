import type { GradeId } from "@/lib/grades";
import type { DayId, WorkbookDay } from "@/lib/types";

import { workbookDays, workbookDaysById } from "./days";
import { workbookDaysByIdGradeB, workbookDaysGradeB } from "./days-grade-b";

export function getWorkbookDays(grade: GradeId): WorkbookDay[] {
  return grade === "b" ? workbookDaysGradeB : workbookDays;
}

export function getWorkbookDaysById(grade: GradeId): Record<DayId, WorkbookDay> {
  return grade === "b" ? workbookDaysByIdGradeB : workbookDaysById;
}

export function getWorkbookTotalDays(grade: GradeId): number {
  return getWorkbookDays(grade).length;
}
