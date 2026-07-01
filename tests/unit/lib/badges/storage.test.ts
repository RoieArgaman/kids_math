import { afterEach, describe, expect, it } from "vitest";
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
