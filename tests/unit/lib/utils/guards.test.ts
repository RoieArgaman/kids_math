import { describe, expect, it } from "vitest";
import { isBrowser, isObject } from "@/lib/utils/guards";

describe("isBrowser", () => {
  it("returns true in the jsdom test environment (window + localStorage present)", () => {
    // Vitest unit config runs under jsdom, which exposes window.localStorage.
    expect(isBrowser()).toBe(true);
  });

  it("returns false when window is undefined", () => {
    const original = globalThis.window;
    // @ts-expect-error — deliberately simulate a server (no window).
    delete globalThis.window;
    try {
      expect(isBrowser()).toBe(false);
    } finally {
      globalThis.window = original;
    }
  });
});

describe("isObject", () => {
  it("returns true for plain objects", () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });

  it("returns true for arrays (matches the original guard semantics)", () => {
    // The extracted guard is `typeof value === "object" && value !== null`,
    // which is true for arrays — preserved exactly from the storage modules.
    expect(isObject([])).toBe(true);
  });

  it("returns false for null", () => {
    expect(isObject(null)).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isObject(undefined)).toBe(false);
    expect(isObject(1)).toBe(false);
    expect(isObject("x")).toBe(false);
    expect(isObject(true)).toBe(false);
  });
});
