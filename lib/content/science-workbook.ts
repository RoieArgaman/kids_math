import type { GradeId } from "@/lib/grades";
import type { DayId, WorkbookDay } from "@/lib/types";
import {
  scienceDays,
  scienceDaysById,
  scienceLevelADays,
  scienceLevelADaysById,
  scienceLevelBDays,
  scienceLevelBDaysById,
} from "./science/index";

/** Science levels reuse the shared GradeId axis ("a" = כיתה א׳, "b" = כיתה ב׳). */
export type ScienceLevel = GradeId;

/** Days for a single Science level (its own home + exam bank). */
export function getScienceDays(level: ScienceLevel): WorkbookDay[] {
  return level === "b" ? scienceLevelBDays : scienceLevelADays;
}

export function getScienceDaysById(level: ScienceLevel): Record<DayId, WorkbookDay> {
  return level === "b" ? scienceLevelBDaysById : scienceLevelADaysById;
}

export function getScienceTotalDays(level: ScienceLevel): number {
  return getScienceDays(level).length;
}

/** All Science days across both levels — used by the single progress store + day lookups. */
export function getAllScienceDays(): WorkbookDay[] {
  return scienceDays;
}

export function getAllScienceDaysById(): Record<DayId, WorkbookDay> {
  return scienceDaysById;
}
