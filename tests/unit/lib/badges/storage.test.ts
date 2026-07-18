import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearBadgeState,
  createInitialBadgeState,
  loadBadgeState,
  sanitizeBadgeState,
  saveBadgeState,
} from "@/lib/badges/storage";

const KEY_A = "kids_math.badges.v1.grade.a";
const KEY_B = "kids_math.badges.v1.grade.b";

afterEach(() => {
  window.localStorage.clear();
});

describe("badge storage backward-compat / round-trip", () => {
  it("returns a fresh initial state when nothing is stored", () => {
    const state = loadBadgeState("a");
    expect(state.grade).toBe("a");
    expect(state.unlocked).toEqual([]);
    expect(state.seenIds).toEqual([]);
  });

  it("round-trips a saved badge state", () => {
    const state = createInitialBadgeState("a");
    state.unlocked = [{ id: "first-day-done", unlockedAt: "2026-06-01T00:00:00.000Z" }];
    state.seenIds = ["first-day-done"];
    saveBadgeState(state);

    const loaded = loadBadgeState("a");
    expect(loaded.unlocked).toEqual([{ id: "first-day-done", unlockedAt: "2026-06-01T00:00:00.000Z" }]);
    expect(loaded.seenIds).toEqual(["first-day-done"]);
  });

  it("keeps grade A and grade B badge stores isolated", () => {
    const a = createInitialBadgeState("a");
    a.seenIds = ["first-day-done"];
    saveBadgeState(a);

    expect(window.localStorage.getItem(KEY_A)).not.toBeNull();
    expect(window.localStorage.getItem(KEY_B)).toBeNull();
    expect(loadBadgeState("b").seenIds).toEqual([]);
  });

  it("falls back to initial state on corrupt JSON", () => {
    window.localStorage.setItem(KEY_A, "{not json");
    expect(loadBadgeState("a").unlocked).toEqual([]);
  });

  it("sanitize discards a state whose grade does not match", () => {
    const bState = { ...createInitialBadgeState("b"), seenIds: ["first-day-done"] };
    const sanitized = sanitizeBadgeState(bState, "a");
    // grade mismatch => fresh grade-a fallback, not the grade-b payload
    expect(sanitized.grade).toBe("a");
    expect(sanitized.seenIds).toEqual([]);
  });

  it("sanitize drops malformed unlocked entries but keeps well-formed ones", () => {
    const raw = {
      version: 1,
      grade: "a",
      unlocked: [
        { id: "first-day-done", unlockedAt: "2026-06-01T00:00:00.000Z" },
        { id: "week-1-complete" }, // missing unlockedAt -> dropped
        "not-an-object", // dropped
      ],
      seenIds: ["first-day-done", 42],
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    const sanitized = sanitizeBadgeState(raw, "a");
    expect(sanitized.unlocked).toEqual([{ id: "first-day-done", unlockedAt: "2026-06-01T00:00:00.000Z" }]);
    expect(sanitized.seenIds).toEqual(["first-day-done"]);
  });

  it("clears only the requested grade's key", () => {
    saveBadgeState({ ...createInitialBadgeState("a"), seenIds: ["first-day-done"] });
    saveBadgeState({ ...createInitialBadgeState("b"), seenIds: ["first-day-done"] });
    clearBadgeState("a");
    expect(window.localStorage.getItem(KEY_A)).toBeNull();
    expect(window.localStorage.getItem(KEY_B)).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// sanitizeBadgeState fallback paths.
//
// Badges are the reward surface a child sees, so this sanitizer fails soft:
// anything it cannot trust becomes a fresh empty state rather than a throw.
// The risk is the opposite of the GMAT loader's — being too eager to reset
// wipes earned badges. These tests pin which inputs reset and which survive.
// ---------------------------------------------------------------------------

describe("sanitizeBadgeState — fallback paths", () => {
  const wellFormed = {
    version: 1,
    grade: "a",
    unlocked: [{ id: "first-day-done", unlockedAt: "2026-06-01T00:00:00.000Z" }],
    seenIds: ["first-day-done"],
    updatedAt: "2026-06-01T00:00:00.000Z",
  };

  it("keeps the well-formed control payload intact", () => {
    // Control for the reset cases below.
    const sanitized = sanitizeBadgeState(wellFormed, "a");
    expect(sanitized.unlocked).toHaveLength(1);
    expect(sanitized.seenIds).toEqual(["first-day-done"]);
    expect(sanitized.updatedAt).toBe("2026-06-01T00:00:00.000Z");
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an array", []],
    ["a string", "badges"],
    ["a number", 7],
  ])("resets to a fresh state when the payload is %s", (_label, value) => {
    const sanitized = sanitizeBadgeState(value, "a");
    expect(sanitized.grade).toBe("a");
    expect(sanitized.unlocked).toEqual([]);
    expect(sanitized.seenIds).toEqual([]);
  });

  it("resets on an unknown version", () => {
    expect(sanitizeBadgeState({ ...wellFormed, version: 2 }, "a").unlocked).toEqual([]);
  });

  it("resets when unlocked is not an array", () => {
    expect(sanitizeBadgeState({ ...wellFormed, unlocked: {} }, "a").unlocked).toEqual([]);
  });

  it("resets when seenIds is not an array", () => {
    const sanitized = sanitizeBadgeState({ ...wellFormed, seenIds: "first-day-done" }, "a");
    expect(sanitized.seenIds).toEqual([]);
    // A reset is whole-state: the otherwise-valid unlocked list goes too.
    expect(sanitized.unlocked).toEqual([]);
  });

  it("substitutes a fresh updatedAt when the stored one is not a string", () => {
    const sanitized = sanitizeBadgeState({ ...wellFormed, updatedAt: 12345 }, "a");
    expect(sanitized.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // ...without discarding the badges themselves.
    expect(sanitized.unlocked).toHaveLength(1);
  });

  it("accepts an empty but valid state without resetting", () => {
    const sanitized = sanitizeBadgeState(
      { version: 1, grade: "a", unlocked: [], seenIds: [], updatedAt: "2026-06-01T00:00:00.000Z" },
      "a",
    );
    expect(sanitized.updatedAt).toBe("2026-06-01T00:00:00.000Z");
  });
});

describe("badge storage — server-side rendering", () => {
  // These modules are imported by components that render on the server, so the
  // no-window path is a real production path, not a hypothetical. Follows the
  // window-deletion pattern established in tests/unit/lib/utils/guards.test.ts.
  function withoutWindow(fn: () => void): void {
    const original = globalThis.window;
    // @ts-expect-error — deliberately simulate a server (no window).
    delete globalThis.window;
    try {
      fn();
    } finally {
      globalThis.window = original;
    }
  }

  it("loadBadgeState returns a fresh state instead of touching localStorage", () => {
    withoutWindow(() => {
      const state = loadBadgeState("a");
      expect(state.grade).toBe("a");
      expect(state.unlocked).toEqual([]);
      expect(state.seenIds).toEqual([]);
    });
  });

  it("saveBadgeState is a no-op rather than a crash", () => {
    withoutWindow(() => {
      expect(() => saveBadgeState(createInitialBadgeState("a"))).not.toThrow();
    });
  });

  it("clearBadgeState is a no-op rather than a crash", () => {
    withoutWindow(() => {
      expect(() => clearBadgeState("a")).not.toThrow();
    });
  });
});

describe("badge storage — failure tolerance", () => {
  it("saveBadgeState does not throw when the write is rejected", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    try {
      expect(() => saveBadgeState(createInitialBadgeState("a"))).not.toThrow();
    } finally {
      setItem.mockRestore();
    }
  });

  it("clearBadgeState does not throw when the removal is rejected", () => {
    const removeItem = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    try {
      expect(() => clearBadgeState("a")).not.toThrow();
    } finally {
      removeItem.mockRestore();
    }
  });

  it("loadBadgeState falls back to a fresh state when reading throws", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    try {
      const state = loadBadgeState("a");
      expect(state.grade).toBe("a");
      expect(state.unlocked).toEqual([]);
    } finally {
      getItem.mockRestore();
    }
  });
});
