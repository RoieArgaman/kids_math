import type { GradeId } from "@/lib/grades";
import type { DayId, WorkbookDay } from "@/lib/types";
import {
  englishDays,
  englishDaysById,
  englishLevelADays,
  englishLevelADaysById,
  englishLevelBDays,
  englishLevelBDaysById,
} from "./english/index";

/** English levels reuse the shared GradeId axis ("a" = Pre-A1, "b" = A1). */
export type EnglishLevel = GradeId;

/** Days for a single English level (its own home + exam bank). */
export function getEnglishDays(level: EnglishLevel): WorkbookDay[] {
  return level === "b" ? englishLevelBDays : englishLevelADays;
}

export function getEnglishDaysById(level: EnglishLevel): Record<DayId, WorkbookDay> {
  return level === "b" ? englishLevelBDaysById : englishLevelADaysById;
}

export function getEnglishTotalDays(level: EnglishLevel): number {
  return getEnglishDays(level).length;
}

/** All English days across both levels — used by the single progress store + day lookups. */
export function getAllEnglishDays(): WorkbookDay[] {
  return englishDays;
}

export function getAllEnglishDaysById(): Record<DayId, WorkbookDay> {
  return englishDaysById;
}
