import type { DayId, WorkbookDay } from "@/lib/types";
import { englishDay01 } from "./day-01";
import { englishDay02 } from "./day-02";
import { englishDay03 } from "./day-03";
import { englishDay04 } from "./day-04";
import { englishDay05 } from "./day-05";
import { englishDay06 } from "./day-06";
import { englishDay07 } from "./day-07";
import { englishDay08 } from "./day-08";
import { englishDay09 } from "./day-09";
import { englishDay10 } from "./day-10";
import { englishDay11 } from "./day-11";
import { englishDay12 } from "./day-12";
import { englishDay13 } from "./day-13";
import { englishDay14 } from "./day-14";
import { englishDay15 } from "./day-15";
import { englishDay16 } from "./day-16";
import { englishDay17 } from "./day-17";
import { englishDay18 } from "./day-18";
import { englishDay19 } from "./day-19";
import { englishDay20 } from "./day-20";
import { englishDay21 } from "./day-21";
import { englishDay22 } from "./day-22";
import { englishDay23 } from "./day-23";
import { englishDay24 } from "./day-24";
import { englishDay25 } from "./day-25";
import { englishDay26 } from "./day-26";
import { englishDay27 } from "./day-27";
import { englishDay28 } from "./day-28";

/**
 * English is one curriculum taught as two CEFR levels (like Math's grades):
 * Level A (Pre-A1) = lessons 1–14, Level B (A1) = lessons 15–28. Each level has
 * its own home, its own final exam, and Level B is gated behind Level A's exam.
 *
 * Day IDs are globally unique and disjoint across levels (A: day-1..14, B:
 * day-15..28), so learner progress can live in a single isolated store while
 * still being effectively separate per level.
 */
export const englishLevelADays: WorkbookDay[] = [
  englishDay01,
  englishDay02,
  englishDay03,
  englishDay04,
  englishDay05,
  englishDay06,
  englishDay07,
  englishDay08,
  englishDay09,
  englishDay10,
  englishDay11,
  englishDay12,
  englishDay13,
  englishDay14,
];

export const englishLevelBDays: WorkbookDay[] = [
  englishDay15,
  englishDay16,
  englishDay17,
  englishDay18,
  englishDay19,
  englishDay20,
  englishDay21,
  englishDay22,
  englishDay23,
  englishDay24,
  englishDay25,
  englishDay26,
  englishDay27,
  englishDay28,
];

/** All English days across both levels (for the single progress store + lookups). */
export const englishDays: WorkbookDay[] = [...englishLevelADays, ...englishLevelBDays];

export const ENGLISH_TOTAL_DAYS = englishDays.length;

function byId(days: WorkbookDay[]): Record<DayId, WorkbookDay> {
  return days.reduce(
    (acc, day) => {
      acc[day.id] = day;
      return acc;
    },
    {} as Record<DayId, WorkbookDay>,
  );
}

export const englishDaysById: Record<DayId, WorkbookDay> = byId(englishDays);
export const englishLevelADaysById: Record<DayId, WorkbookDay> = byId(englishLevelADays);
export const englishLevelBDaysById: Record<DayId, WorkbookDay> = byId(englishLevelBDays);
