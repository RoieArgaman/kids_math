import { describe, it, expect } from "vitest";
import {
  ACCOUNT_STATUS_FIELD,
  canAuthenticate,
  isDocActive,
  readAccountStatus,
  type AccountStatus,
} from "@/lib/auth/accountStatus";

// A failure in the "absent ⇒ active" direction means every pre-Phase-3 learner is locked out.
// Treat it as an incident, not a test to update.
describe("readAccountStatus", () => {
  describe("absent ⇒ active", () => {
    it.each([
      ["undefined", undefined],
      ["null", null],
    ])("treats %s as active", (_label, raw) => {
      expect(readAccountStatus(raw)).toBe("active");
    });
  });

  describe("recognized values round-trip", () => {
    it.each<[AccountStatus]>([["active"], ["deactivated"], ["deleted"]])(
      "maps %s to itself",
      (status) => {
        expect(readAccountStatus(status)).toBe(status);
      },
    );
  });

  describe("unrecognized explicit values fail closed", () => {
    it.each([
      ["a future status string", "suspended"],
      ["empty string", ""],
      ["wrong case", "Active"],
      ["whitespace-padded", " active "],
      ["a number", 1],
      ["a boolean", true],
      ["an object", { status: "active" }],
      ["an array", ["active"]],
    ])("treats %s as non-active", (_label, raw) => {
      expect(canAuthenticate(readAccountStatus(raw))).toBe(false);
    });

    it("normalizes an unknown value to deactivated, not deleted", () => {
      expect(readAccountStatus("suspended")).toBe("deactivated");
    });
  });
});

describe("canAuthenticate", () => {
  it("permits only active", () => {
    expect(canAuthenticate("active")).toBe(true);
    expect(canAuthenticate("deactivated")).toBe(false);
    expect(canAuthenticate("deleted")).toBe(false);
  });

  it("refuses both non-active states identically — distinguishing them leaks account state", () => {
    expect(canAuthenticate("deactivated")).toBe(canAuthenticate("deleted"));
  });
});

describe("isDocActive", () => {
  it("reads the status field off a doc payload", () => {
    expect(isDocActive({ [ACCOUNT_STATUS_FIELD]: "active" })).toBe(true);
    expect(isDocActive({ [ACCOUNT_STATUS_FIELD]: "deleted" })).toBe(false);
    expect(isDocActive({ [ACCOUNT_STATUS_FIELD]: "deactivated" })).toBe(false);
  });

  it("treats a legacy doc with no status field as active", () => {
    expect(isDocActive({ username: "dana", usernameLower: "dana", role: "user" })).toBe(true);
  });

  it("treats an undefined doc as active", () => {
    expect(isDocActive(undefined)).toBe(true);
  });

  it("ignores unrelated fields", () => {
    expect(isDocActive({ isActive: false, isDeleted: true })).toBe(true);
  });
});
