import { describe, expect, it } from "vitest";
import {
  sanitizeBooleanRecord,
  sanitizeNumberRecord,
  sanitizeStringRecord,
} from "@/lib/utils/sanitize";

describe("sanitizeStringRecord", () => {
  it("keeps only string values", () => {
    expect(
      sanitizeStringRecord({ a: "x", b: 1, c: true, d: null, e: "y" }),
    ).toEqual({ a: "x", e: "y" });
  });

  it("returns {} for non-record inputs", () => {
    expect(sanitizeStringRecord(null)).toEqual({});
    expect(sanitizeStringRecord(undefined)).toEqual({});
    expect(sanitizeStringRecord(42)).toEqual({});
    expect(sanitizeStringRecord("str")).toEqual({});
    expect(sanitizeStringRecord([1, 2, 3])).toEqual({});
  });

  it("handles an all-valid record", () => {
    expect(sanitizeStringRecord({ a: "1", b: "2" })).toEqual({ a: "1", b: "2" });
  });

  it("handles an all-invalid record", () => {
    expect(sanitizeStringRecord({ a: 1, b: false })).toEqual({});
  });
});

describe("sanitizeBooleanRecord", () => {
  it("keeps only boolean values", () => {
    expect(
      sanitizeBooleanRecord({ a: true, b: false, c: "true", d: 1, e: null }),
    ).toEqual({ a: true, b: false });
  });

  it("returns {} for non-record inputs", () => {
    expect(sanitizeBooleanRecord(null)).toEqual({});
    expect(sanitizeBooleanRecord([true])).toEqual({});
    expect(sanitizeBooleanRecord("x")).toEqual({});
  });

  it("does NOT coerce truthy/falsy non-booleans", () => {
    expect(sanitizeBooleanRecord({ a: 0, b: 1, c: "" })).toEqual({});
  });
});

describe("sanitizeNumberRecord", () => {
  it("keeps finite numbers >= 0", () => {
    expect(sanitizeNumberRecord({ a: 0, b: 1, c: 99.5 })).toEqual({
      a: 0,
      b: 1,
      c: 99.5,
    });
  });

  it("drops negative numbers", () => {
    expect(sanitizeNumberRecord({ a: -1, b: -0.5, c: 2 })).toEqual({ c: 2 });
  });

  it("drops non-finite numbers (NaN / Infinity)", () => {
    expect(
      sanitizeNumberRecord({ a: NaN, b: Infinity, c: -Infinity, d: 3 }),
    ).toEqual({ d: 3 });
  });

  it("drops non-number values", () => {
    expect(sanitizeNumberRecord({ a: "1", b: true, c: null, d: 4 })).toEqual({
      d: 4,
    });
  });

  it("treats -0 as >= 0 (kept)", () => {
    expect(sanitizeNumberRecord({ a: -0 })).toEqual({ a: -0 });
  });

  it("returns {} for non-record inputs", () => {
    expect(sanitizeNumberRecord(null)).toEqual({});
    expect(sanitizeNumberRecord([1, 2])).toEqual({});
    expect(sanitizeNumberRecord(5)).toEqual({});
  });
});
