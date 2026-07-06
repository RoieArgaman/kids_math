import type { DayId, WorkbookDay } from "@/lib/types";
import { scienceDay01 } from "./day-01";
import { scienceDay02 } from "./day-02";
import { scienceDay03 } from "./day-03";
import { scienceDay04 } from "./day-04";
import { scienceDay05 } from "./day-05";
import { scienceDay06 } from "./day-06";
import { scienceDay07 } from "./day-07";
import { scienceDay08 } from "./day-08";
import { scienceDay09 } from "./day-09";
import { scienceDay10 } from "./day-10";
import { scienceDay11 } from "./day-11";
import { scienceDay12 } from "./day-12";
import { scienceDay13 } from "./day-13";
import { scienceDay14 } from "./day-14";
import { scienceDay15 } from "./day-15";
import { scienceDay16 } from "./day-16";
import { scienceDay17 } from "./day-17";

/**
 * Science is one curriculum taught as two Israeli grade levels (like Math's
 * grades): Level א׳ (כיתה א׳) and Level ב׳ (כיתה ב׳). Each level has its own home,
 * its own final exam, and Level ב׳ is gated behind Level א׳'s exam.
 *
 * Day IDs are globally unique and disjoint across levels (א׳: day-1..N, ב׳:
 * day-(N+1)..), so learner progress can live in a single isolated store while
 * still being effectively separate per level.
 *
 * Level א׳ ships lessons 1–10 (day IDs 1–10); Level ב׳ ships lessons 11–17
 * (day IDs 11–17). New day modules are appended to the arrays below as they
 * are written, keeping each level's IDs contiguous and disjoint.
 */
export const scienceLevelADays: WorkbookDay[] = [
  scienceDay01,
  scienceDay02,
  scienceDay03,
  scienceDay04,
  scienceDay05,
  scienceDay06,
  scienceDay07,
  scienceDay08,
  scienceDay09,
  scienceDay10,
];

export const scienceLevelBDays: WorkbookDay[] = [
  scienceDay11,
  scienceDay12,
  scienceDay13,
  scienceDay14,
  scienceDay15,
  scienceDay16,
  scienceDay17,
];

function byId(days: WorkbookDay[]): Record<DayId, WorkbookDay> {
  return Object.fromEntries(days.map((d) => [d.id, d])) as Record<DayId, WorkbookDay>;
}

export const scienceLevelADaysById: Record<DayId, WorkbookDay> = byId(scienceLevelADays);
export const scienceLevelBDaysById: Record<DayId, WorkbookDay> = byId(scienceLevelBDays);

export const scienceDays: WorkbookDay[] = [...scienceLevelADays, ...scienceLevelBDays];
export const scienceDaysById: Record<DayId, WorkbookDay> = byId(scienceDays);
