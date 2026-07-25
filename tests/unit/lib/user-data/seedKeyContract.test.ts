import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../../../e2e/testUtils";
import { workbookProgressStorageKey } from "@/lib/progress/storage";
import { englishProgressStorageKey } from "@/lib/english/storage";
import { scienceProgressStorageKey } from "@/lib/science/storage";
import { englishFinalExamStorageKey } from "@/lib/english/final-exam/storage";
import { scienceFinalExamStorageKey } from "@/lib/science/final-exam/storage";
import type { GradeId } from "@/lib/grades";

/**
 * Seed-key contract guard (Phase A, plan Step 2).
 *
 * The E2E harness seeds localStorage by hand-written key prefixes. If a real storage
 * key is renamed in a lib storage module but the harness prefix is not updated,
 * every seed-driven E2E test would silently seed a DEAD key — tests would still "pass"
 * against empty state and stop guarding anything. This test fails loudly on that drift
 * for every storage key the lib exposes a builder for. It is also the canonical place a
 * storage-key rename must update the harness (renames are MAX per the storage rules).
 */
describe("E2E seed-key contract matches lib storage keys", () => {
  const grades: GradeId[] = ["a", "b"];

  it("workbook progress key matches lib builder", () => {
    for (const g of grades) {
      expect(STORAGE_KEYS.workbookProgress(g)).toBe(workbookProgressStorageKey(g));
    }
  });

  it("final-exam (grade) key matches the documented literal shape", () => {
    // No exported builder for the math per-grade final exam; pin the literal so a rename
    // of the underlying KEY_PREFIX surfaces here (cross-checked against lib/final-exam/storage.ts).
    for (const g of grades) {
      expect(STORAGE_KEYS.finalExam(g)).toBe("kids_math.final_exam.v1.grade." + g);
    }
  });

  it("badges (grade) key matches the documented literal shape", () => {
    for (const g of grades) {
      expect(STORAGE_KEYS.badges(g)).toBe("kids_math.badges.v1.grade." + g);
    }
  });

  it("streak / analytics device keys match the documented literals", () => {
    expect(STORAGE_KEYS.streak).toBe("kids_math.streak.v1");
    expect(STORAGE_KEYS.analyticsEvents).toBe("kids_math.analytics_events.v1");
  });

  it("english / science subject storage builders exist and are stable", () => {
    expect(englishProgressStorageKey()).toBe("kids_math.english.workbook_progress.v1");
    expect(scienceProgressStorageKey()).toBe("kids_math.science.workbook_progress.v1");
    expect(englishFinalExamStorageKey("a")).toBe("kids_math.english.final_exam.v1.level.a");
    expect(englishFinalExamStorageKey("b")).toBe("kids_math.english.final_exam.v1.level.b");
    expect(scienceFinalExamStorageKey("a")).toBe("kids_math.science.final_exam.v1.level.a");
    expect(scienceFinalExamStorageKey("b")).toBe("kids_math.science.final_exam.v1.level.b");
  });
});
