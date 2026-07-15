import { describe, expect, it } from "vitest";
import {
  adminCreateSchema,
  adminDeleteSchema,
  adminPatchSchema,
  loginSchema,
  progressEnvelopeSchema,
  subjectSchema,
} from "@/lib/security/schemas";

describe("security/schemas", () => {
  describe("loginSchema", () => {
    it("accepts a well-formed body", () => {
      expect(loginSchema.safeParse({ username: "dana", password: "pw" }).success).toBe(true);
    });
    it("rejects non-string fields and missing fields", () => {
      expect(loginSchema.safeParse({ username: 123, password: "pw" }).success).toBe(false);
      expect(loginSchema.safeParse({ username: "dana" }).success).toBe(false);
      expect(loginSchema.safeParse(null).success).toBe(false);
    });
  });

  describe("adminCreateSchema", () => {
    it("accepts username+password, optional role and overridePolicy", () => {
      expect(adminCreateSchema.safeParse({ username: "u", password: "p" }).success).toBe(true);
      expect(
        adminCreateSchema.safeParse({ username: "u", password: "p", role: "admin", overridePolicy: true })
          .success,
      ).toBe(true);
    });
    it("rejects missing password / wrong types", () => {
      expect(adminCreateSchema.safeParse({ username: "u" }).success).toBe(false);
      expect(adminCreateSchema.safeParse({ username: "u", password: "p", overridePolicy: "yes" }).success).toBe(
        false,
      );
    });
  });

  describe("adminPatchSchema (reset | unlock)", () => {
    it("accepts a password reset (with optional override)", () => {
      expect(adminPatchSchema.safeParse({ userId: "x", password: "p" }).success).toBe(true);
      expect(adminPatchSchema.safeParse({ userId: "x", password: "p", overridePolicy: true }).success).toBe(true);
    });
    it("accepts an unlock action with no password", () => {
      expect(adminPatchSchema.safeParse({ userId: "x", action: "unlock" }).success).toBe(true);
    });
    it("rejects a reset with no password and an unknown action", () => {
      expect(adminPatchSchema.safeParse({ userId: "x" }).success).toBe(false);
      expect(adminPatchSchema.safeParse({ userId: "x", action: "nuke" }).success).toBe(false);
    });
  });

  describe("adminDeleteSchema", () => {
    it("requires userId", () => {
      expect(adminDeleteSchema.safeParse({ userId: "x" }).success).toBe(true);
      expect(adminDeleteSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("subjectSchema", () => {
    it("accepts the three known subjects", () => {
      for (const subject of ["math", "english", "science"]) {
        expect(subjectSchema.safeParse({ subject }).success).toBe(true);
      }
    });
    it("rejects an unknown or missing subject", () => {
      expect(subjectSchema.safeParse({ subject: "history" }).success).toBe(false);
      expect(subjectSchema.safeParse({}).success).toBe(false);
    });

    it("preserves parseSubjectId tolerance: trims + lowercases (backward-compat)", () => {
      const res = subjectSchema.safeParse({ subject: "  Math " });
      expect(res.success).toBe(true);
      if (res.success) expect(res.data.subject).toBe("math");
      expect(subjectSchema.safeParse({ subject: "ENGLISH" }).success).toBe(true);
    });
  });

  describe("progressEnvelopeSchema (envelope-only, backward-compat)", () => {
    it("accepts bundleVersion 1..4 and preserves unknown nested fields", () => {
      for (const v of [1, 2, 3, 4]) {
        const res = progressEnvelopeSchema.safeParse({ bundleVersion: v, deeply: { nested: [1, 2] } });
        expect(res.success).toBe(true);
        if (res.success) expect((res.data as Record<string, unknown>).deeply).toEqual({ nested: [1, 2] });
      }
    });
    it("rejects an unknown version and non-objects (preserves the 400 contract)", () => {
      expect(progressEnvelopeSchema.safeParse({ bundleVersion: 5 }).success).toBe(false);
      expect(progressEnvelopeSchema.safeParse({ bundleVersion: "1" }).success).toBe(false);
      expect(progressEnvelopeSchema.safeParse(null).success).toBe(false);
    });
  });
});
