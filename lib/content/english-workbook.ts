import type { DayId, WorkbookDay } from "@/lib/types";
import { ENGLISH_TOTAL_DAYS, englishDays, englishDaysById } from "./english/index";

export function getEnglishDays(): WorkbookDay[] {
  return englishDays;
}

export function getEnglishDaysById(): Record<DayId, WorkbookDay> {
  return englishDaysById;
}

export function getEnglishTotalDays(): number {
  return ENGLISH_TOTAL_DAYS;
}
