import type { GradeId } from "@/lib/grades";
import { DEFAULT_GRADE } from "@/lib/grades";
import type { Subject } from "@/lib/subjects";
import type { DayId, WorkbookDay, WorkbookProgressState } from "@/lib/types";
import { getWorkbookDays, getWorkbookDaysById } from "@/lib/content/workbook";
import { getAllEnglishDays, getAllEnglishDaysById } from "@/lib/content/english-workbook";
import { getAllScienceDays, getAllScienceDaysById } from "@/lib/content/science-workbook";
import { loadProgressState, saveProgressState } from "@/lib/progress/storage";
import {
  loadEnglishProgressState,
  saveEnglishProgressState,
} from "@/lib/english/storage";
import {
  loadScienceProgressState,
  saveScienceProgressState,
} from "@/lib/science/storage";

/**
 * Track resolver — the single place that maps a {subject, grade} to its content
 * source and its (isolated) progress store. Math is grade-keyed; English is a
 * single subject-keyed track. Keeping this here lets the shared hooks stay
 * storage-agnostic while Math's behavior is unchanged when `subject` is omitted.
 */
export type TrackOptions = { subject?: Subject; grade?: GradeId };

export function getTrackDays(opts: TrackOptions): WorkbookDay[] {
  switch (opts.subject) {
    case "english":
      return getAllEnglishDays();
    case "science":
      return getAllScienceDays();
    default:
      return getWorkbookDays(opts.grade ?? DEFAULT_GRADE);
  }
}

export function getTrackDaysById(opts: TrackOptions): Record<DayId, WorkbookDay> {
  switch (opts.subject) {
    case "english":
      return getAllEnglishDaysById();
    case "science":
      return getAllScienceDaysById();
    default:
      return getWorkbookDaysById(opts.grade ?? DEFAULT_GRADE);
  }
}

export function loadTrackProgress(opts: TrackOptions): WorkbookProgressState {
  switch (opts.subject) {
    case "english":
      return loadEnglishProgressState();
    case "science":
      return loadScienceProgressState();
    default:
      return loadProgressState({ grade: opts.grade ?? DEFAULT_GRADE });
  }
}

export function saveTrackProgress(state: WorkbookProgressState, opts: TrackOptions): void {
  switch (opts.subject) {
    case "english":
      saveEnglishProgressState(state);
      return;
    case "science":
      saveScienceProgressState(state);
      return;
    default:
      saveProgressState(state, { grade: opts.grade ?? DEFAULT_GRADE });
  }
}
