import type { DayId, WorkbookDay } from "@/lib/types";
import { englishDay01 } from "./day-01";
import { englishDay02 } from "./day-02";
import { englishDay03 } from "./day-03";
import { englishDay04 } from "./day-04";
import { englishDay05 } from "./day-05";
import { englishDay06 } from "./day-06";
import { englishDay07 } from "./day-07";

/** Ordered English (Pre-A1) workbook days. */
export const englishDays: WorkbookDay[] = [
  englishDay01,
  englishDay02,
  englishDay03,
  englishDay04,
  englishDay05,
  englishDay06,
  englishDay07,
];

export const ENGLISH_TOTAL_DAYS = englishDays.length;

export const englishDaysById: Record<DayId, WorkbookDay> = englishDays.reduce(
  (acc, day) => {
    acc[day.id] = day;
    return acc;
  },
  {} as Record<DayId, WorkbookDay>,
);
