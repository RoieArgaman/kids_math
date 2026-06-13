import type { GradeId } from "@/lib/grades";
import { DEFAULT_GRADE } from "@/lib/grades";
import type { Subject } from "@/lib/subjects";
import type { DayId, WorkbookDay, WorkbookProgressState } from "@/lib/types";
import { getWorkbookDays, getWorkbookDaysById } from "@/lib/content/workbook";
import { getEnglishDays, getEnglishDaysById } from "@/lib/content/english-workbook";
import { loadProgressState, saveProgressState } from "@/lib/progress/storage";
import {
  loadEnglishProgressState,
  saveEnglishProgressState,
} from "@/lib/english/storage";

/**
 * Track resolver — the single place that maps a {subject, grade} to its content
 * source and its (isolated) progress store. Math is grade-keyed; English is a
 * single subject-keyed track. Keeping this here lets the shared hooks stay
 * storage-agnostic while Math's behavior is unchanged when `subject` is omitted.
 */
export type TrackOptions = { subject?: Subject; grade?: GradeId };

function isEnglish(opts: TrackOptions): boolean {
  return opts.subject === "english";
}

export function getTrackDays(opts: TrackOptions): WorkbookDay[] {
  return isEnglish(opts) ? getEnglishDays() : getWorkbookDays(opts.grade ?? DEFAULT_GRADE);
}

export function getTrackDaysById(opts: TrackOptions): Record<DayId, WorkbookDay> {
  return isEnglish(opts) ? getEnglishDaysById() : getWorkbookDaysById(opts.grade ?? DEFAULT_GRADE);
}

export function loadTrackProgress(opts: TrackOptions): WorkbookProgressState {
  return isEnglish(opts)
    ? loadEnglishProgressState()
    : loadProgressState({ grade: opts.grade ?? DEFAULT_GRADE });
}

export function saveTrackProgress(state: WorkbookProgressState, opts: TrackOptions): void {
  if (isEnglish(opts)) {
    saveEnglishProgressState(state);
    return;
  }
  saveProgressState(state, { grade: opts.grade ?? DEFAULT_GRADE });
}
