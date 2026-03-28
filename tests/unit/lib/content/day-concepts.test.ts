import { describe, expect, it } from "vitest";

import { validateDayConcept } from "@/lib/content/engine/validate";

// Grade A concepts
import { concept as gaDay01 } from "@/lib/content/grade-a/day-01";
import { concept as gaDay02 } from "@/lib/content/grade-a/day-02";
import { concept as gaDay03 } from "@/lib/content/grade-a/day-03";
import { concept as gaDay04 } from "@/lib/content/grade-a/day-04";
import { concept as gaDay05 } from "@/lib/content/grade-a/day-05";
import { concept as gaDay06 } from "@/lib/content/grade-a/day-06";
import { concept as gaDay07 } from "@/lib/content/grade-a/day-07";
import { concept as gaDay08 } from "@/lib/content/grade-a/day-08";
import { concept as gaDay09 } from "@/lib/content/grade-a/day-09";
import { concept as gaDay10 } from "@/lib/content/grade-a/day-10";
import { concept as gaDay11 } from "@/lib/content/grade-a/day-11";
import { concept as gaDay12 } from "@/lib/content/grade-a/day-12";
import { concept as gaDay13 } from "@/lib/content/grade-a/day-13";
import { concept as gaDay14 } from "@/lib/content/grade-a/day-14";
import { concept as gaDay15 } from "@/lib/content/grade-a/day-15";
import { concept as gaDay16 } from "@/lib/content/grade-a/day-16";
import { concept as gaDay17 } from "@/lib/content/grade-a/day-17";
import { concept as gaDay18 } from "@/lib/content/grade-a/day-18";
import { concept as gaDay19 } from "@/lib/content/grade-a/day-19";
import { concept as gaDay20 } from "@/lib/content/grade-a/day-20";
import { concept as gaDay21 } from "@/lib/content/grade-a/day-21";
import { concept as gaDay22 } from "@/lib/content/grade-a/day-22";
import { concept as gaDay23 } from "@/lib/content/grade-a/day-23";
import { concept as gaDay24 } from "@/lib/content/grade-a/day-24";
import { concept as gaDay25 } from "@/lib/content/grade-a/day-25";
import { concept as gaDay26 } from "@/lib/content/grade-a/day-26";
import { concept as gaDay27 } from "@/lib/content/grade-a/day-27";
import { concept as gaDay28 } from "@/lib/content/grade-a/day-28";
import { concept as gaDay29 } from "@/lib/content/grade-a/day-29";

// Grade B concepts
import { concept as gbDay01 } from "@/lib/content/grade-b/day-01";
import { concept as gbDay02 } from "@/lib/content/grade-b/day-02";
import { concept as gbDay03 } from "@/lib/content/grade-b/day-03";
import { concept as gbDay04 } from "@/lib/content/grade-b/day-04";
import { concept as gbDay05 } from "@/lib/content/grade-b/day-05";
import { concept as gbDay06 } from "@/lib/content/grade-b/day-06";
import { concept as gbDay07 } from "@/lib/content/grade-b/day-07";
import { concept as gbDay08 } from "@/lib/content/grade-b/day-08";
import { concept as gbDay09 } from "@/lib/content/grade-b/day-09";
import { concept as gbDay10 } from "@/lib/content/grade-b/day-10";
import { concept as gbDay11 } from "@/lib/content/grade-b/day-11";
import { concept as gbDay12 } from "@/lib/content/grade-b/day-12";
import { concept as gbDay13 } from "@/lib/content/grade-b/day-13";
import { concept as gbDay14 } from "@/lib/content/grade-b/day-14";
import { concept as gbDay15 } from "@/lib/content/grade-b/day-15";
import { concept as gbDay16 } from "@/lib/content/grade-b/day-16";
import { concept as gbDay17 } from "@/lib/content/grade-b/day-17";
import { concept as gbDay18 } from "@/lib/content/grade-b/day-18";
import { concept as gbDay19 } from "@/lib/content/grade-b/day-19";
import { concept as gbDay20 } from "@/lib/content/grade-b/day-20";
import { concept as gbDay21 } from "@/lib/content/grade-b/day-21";
import { concept as gbDay22 } from "@/lib/content/grade-b/day-22";
import { concept as gbDay23 } from "@/lib/content/grade-b/day-23";
import { concept as gbDay24 } from "@/lib/content/grade-b/day-24";
import { concept as gbDay25 } from "@/lib/content/grade-b/day-25";
import { concept as gbDay26 } from "@/lib/content/grade-b/day-26";
import { concept as gbDay27 } from "@/lib/content/grade-b/day-27";
import { concept as gbDay28 } from "@/lib/content/grade-b/day-28";
import { concept as gbDay29 } from "@/lib/content/grade-b/day-29";

const gradeAConcepts = [
  gaDay01, gaDay02, gaDay03, gaDay04, gaDay05, gaDay06, gaDay07,
  gaDay08, gaDay09, gaDay10, gaDay11, gaDay12, gaDay13, gaDay14,
  gaDay15, gaDay16, gaDay17, gaDay18, gaDay19, gaDay20, gaDay21,
  gaDay22, gaDay23, gaDay24, gaDay25, gaDay26, gaDay27, gaDay28, gaDay29,
];

const gradeBConcepts = [
  gbDay01, gbDay02, gbDay03, gbDay04, gbDay05, gbDay06, gbDay07,
  gbDay08, gbDay09, gbDay10, gbDay11, gbDay12, gbDay13, gbDay14,
  gbDay15, gbDay16, gbDay17, gbDay18, gbDay19, gbDay20, gbDay21,
  gbDay22, gbDay23, gbDay24, gbDay25, gbDay26, gbDay27, gbDay28, gbDay29,
];

describe("Grade A DayConcept validation", () => {
  it("has 29 days", () => {
    expect(gradeAConcepts).toHaveLength(29);
  });

  it("all days have sequential dayNumbers starting at 1", () => {
    gradeAConcepts.forEach((c, i) => {
      expect(c.dayNumber).toBe(i + 1);
    });
  });

  it.each(gradeAConcepts.map((c) => [c.dayNumber, c] as [number, typeof c]))(
    "day %i passes validateDayConcept",
    (_, concept) => {
      const errors = validateDayConcept(concept);
      expect(errors).toHaveLength(0);
    },
  );
});

describe("Grade B DayConcept validation", () => {
  it("has 29 days", () => {
    expect(gradeBConcepts).toHaveLength(29);
  });

  it("all days have sequential dayNumbers starting at 1", () => {
    gradeBConcepts.forEach((c, i) => {
      expect(c.dayNumber).toBe(i + 1);
    });
  });

  it.each(gradeBConcepts.map((c) => [c.dayNumber, c] as [number, typeof c]))(
    "day %i passes validateDayConcept",
    (_, concept) => {
      const errors = validateDayConcept(concept);
      expect(errors).toHaveLength(0);
    },
  );
});
