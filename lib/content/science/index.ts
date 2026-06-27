import type { DayId, WorkbookDay } from "@/lib/types";
import { scienceDay01 } from "./day-01";
import { scienceDay02 } from "./day-02";
import { scienceDay03 } from "./day-03";
import { scienceDay04 } from "./day-04";
import { scienceDay05 } from "./day-05";
import { scienceDay11 } from "./day-11";

/**
 * Science is one curriculum taught as two Israeli grade levels (like Math's
 * grades): Level א׳ (כיתה א׳) and Level ב׳ (כיתה ב׳). Each level has its own home,
 * its own final exam, and Level ב׳ is gated behind Level א׳'s exam.
 *
 * Day IDs are globally unique and disjoint across levels (א׳: day-1..N, ב׳:
 * day-(N+1)..), so learner progress can live in a single isolated store while
 * still being effectively separate per level.
 *
 * NOTE (Phase 1): Level א׳ ships lessons 1–5; Level ב׳ ships a scaffold (lesson 11).
 * New day modules are appended to the arrays below as they are written.
 */
export const scienceLevelADays: WorkbookDay[] = [
  scienceDay01,
  scienceDay02,
  scienceDay03,
  scienceDay04,
  scienceDay05,
];

export const scienceLevelBDays: WorkbookDay[] = [scienceDay11];

function byId(days: WorkbookDay[]): Record<DayId, WorkbookDay> {
  return Object.fromEntries(days.map((d) => [d.id, d])) as Record<DayId, WorkbookDay>;
}

export const scienceLevelADaysById: Record<DayId, WorkbookDay> = byId(scienceLevelADays);
export const scienceLevelBDaysById: Record<DayId, WorkbookDay> = byId(scienceLevelBDays);

export const scienceDays: WorkbookDay[] = [...scienceLevelADays, ...scienceLevelBDays];
export const scienceDaysById: Record<DayId, WorkbookDay> = byId(scienceDays);
