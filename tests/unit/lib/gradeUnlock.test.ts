import { describe, expect, it } from "vitest";
import {
  GRADE_B_UNLOCK_COOKIE_NAME,
  GRADE_B_UNLOCK_COOKIE_VALUE,
  MATH_B_LEGACY_COOKIE,
  subjectGradeBUnlockCookieName,
} from "@/lib/gradeUnlock";

describe("gradeUnlock cookie names", () => {
  it("builds a distinct per-subject cookie name", () => {
    expect(subjectGradeBUnlockCookieName("math")).toBe("kids_math.unlocked.b.math");
    expect(subjectGradeBUnlockCookieName("english")).toBe("kids_math.unlocked.b.english");
    expect(subjectGradeBUnlockCookieName("science")).toBe("kids_math.unlocked.b.science");
  });

  it("keeps the legacy math cookie name as a recognized alias", () => {
    expect(MATH_B_LEGACY_COOKIE).toBe("kids_math.unlocked_grade_b");
    expect(GRADE_B_UNLOCK_COOKIE_NAME).toBe(MATH_B_LEGACY_COOKIE);
    expect(GRADE_B_UNLOCK_COOKIE_VALUE).toBe("1");
  });
});
