import type { WorkbookDay } from "@/lib/types";

import { buildDayFromConcepts } from "../engine/day-builder";
import { concept as day01 } from "./day-01";
import { concept as day02 } from "./day-02";
import { concept as day03 } from "./day-03";
import { concept as day04 } from "./day-04";
import { concept as day05 } from "./day-05";
import { concept as day06 } from "./day-06";
import { concept as day07 } from "./day-07";
import { concept as day08 } from "./day-08";
import { concept as day09 } from "./day-09";
import { concept as day10 } from "./day-10";
import { concept as day11 } from "./day-11";
import { concept as day12 } from "./day-12";
import { concept as day13 } from "./day-13";
import { concept as day14 } from "./day-14";
import { concept as day15 } from "./day-15";
import { concept as day16 } from "./day-16";
import { concept as day17 } from "./day-17";
import { concept as day18 } from "./day-18";
import { concept as day19 } from "./day-19";
import { concept as day20 } from "./day-20";
import { concept as day21 } from "./day-21";
import { concept as day22 } from "./day-22";
import { concept as day23 } from "./day-23";
import { concept as day24 } from "./day-24";
import { concept as day25 } from "./day-25";
import { concept as day26 } from "./day-26";
import { concept as day27 } from "./day-27";
import { concept as day28 } from "./day-28";
import { concept as day29 } from "./day-29";

const concepts = [
  day01,
  day02,
  day03,
  day04,
  day05,
  day06,
  day07,
  day08,
  day09,
  day10,
  day11,
  day12,
  day13,
  day14,
  day15,
  day16,
  day17,
  day18,
  day19,
  day20,
  day21,
  day22,
  day23,
  day24,
  day25,
  day26,
  day27,
  day28,
  day29,
];

export const workbookDays: WorkbookDay[] = concepts.map((c) =>
  buildDayFromConcepts(concepts, c, { simpleSections: false }),
);

export const workbookDaysById: Record<WorkbookDay["id"], WorkbookDay> = workbookDays.reduce(
  (acc, day) => {
    acc[day.id] = day;
    return acc;
  },
  {} as Record<WorkbookDay["id"], WorkbookDay>,
);

/** מספר ימי הלמידה בחוברת — לשימוש במפת תוכנית ובמדדי התקדמות */
export const WORKBOOK_TOTAL_DAYS = workbookDays.length;
