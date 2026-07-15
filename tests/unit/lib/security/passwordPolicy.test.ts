import { describe, expect, it } from "vitest";
import { validatePasswordStrength, PASSWORD_MIN_LENGTH } from "@/lib/security/passwordPolicy";

describe("validatePasswordStrength", () => {
  it("accepts a password at or above the minimum length", () => {
    expect(validatePasswordStrength("a".repeat(PASSWORD_MIN_LENGTH)).ok).toBe(true);
    expect(validatePasswordStrength("sunflower42").ok).toBe(true);
  });

  it("rejects an empty password (even under override)", () => {
    expect(validatePasswordStrength("")).toEqual({ ok: false, reason: "empty" });
    expect(validatePasswordStrength("", true)).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects a too-short password", () => {
    expect(validatePasswordStrength("123")).toEqual({ ok: false, reason: "too_short" });
  });

  it("rejects a trivially common password", () => {
    expect(validatePasswordStrength("password").reason).toBe("too_common");
    expect(validatePasswordStrength("123456").reason).toBe("too_common"); // 6 chars: passes length, hits deny-list
    expect(validatePasswordStrength("123").reason).toBe("too_short"); // length short-circuits first
  });

  it("bypasses length/common checks under override (admin simple/PIN password)", () => {
    expect(validatePasswordStrength("1234", true).ok).toBe(true);
    expect(validatePasswordStrength("password", true).ok).toBe(true);
  });
});
