import { describe, expect, it, vi } from "vitest";
import { pickGmatChallengeItems } from "@/lib/gmat-challenge/picker";
import {
  createInitialRulesState,
  createStateAfterPick,
  clearGmatChallengeState,
  loadGmatChallengeState,
  saveGmatChallengeState,
} from "@/lib/gmat-challenge/storage";

describe("gmat-challenge storage", () => {
  it("save/load round-trip for pickOrder phase", () => {
    const items = pickGmatChallengeItems({ grade: "a", seed: "stor", pickerVersion: 6 });
    const state = createStateAfterPick({ grade: "a", itemsBySection: items });
    saveGmatChallengeState("a", state);
    const loaded = loadGmatChallengeState("a");
    expect(loaded).not.toBeNull();
    expect(loaded!.phase).toBe("pickOrder");
    expect(loaded!.itemsBySection.quant.length).toBe(7);
  });

  it("allows rules phase with empty items", () => {
    const s = createInitialRulesState("a");
    saveGmatChallengeState("a", s);
    const loaded = loadGmatChallengeState("a");
    expect(loaded?.phase).toBe("rules");
  });

  it("stamps updatedAt on save and preserves it on load", () => {
    const s = createInitialRulesState("a");
    expect(s.updatedAt).toBeUndefined();
    saveGmatChallengeState("a", s);
    const loaded = loadGmatChallengeState("a");
    expect(loaded?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("loads legacy state without updatedAt (backward compat)", () => {
    const legacy = createInitialRulesState("a");
    window.localStorage.setItem("kids_math.gmat_challenge.v1.grade.a", JSON.stringify(legacy));
    const loaded = loadGmatChallengeState("a");
    expect(loaded).not.toBeNull();
    expect(loaded?.updatedAt).toBeUndefined();
  });

  it("clearGmatChallengeState removes the grade key", () => {
    saveGmatChallengeState("a", createInitialRulesState("a"));
    expect(window.localStorage.getItem("kids_math.gmat_challenge.v1.grade.a")).toBeTruthy();
    clearGmatChallengeState("a");
    expect(window.localStorage.getItem("kids_math.gmat_challenge.v1.grade.a")).toBeNull();
  });

  it("clearGmatChallengeState only removes the requested grade", () => {
    saveGmatChallengeState("a", createInitialRulesState("a"));
    saveGmatChallengeState("b", createInitialRulesState("b"));
    clearGmatChallengeState("a");
    expect(window.localStorage.getItem("kids_math.gmat_challenge.v1.grade.a")).toBeNull();
    expect(window.localStorage.getItem("kids_math.gmat_challenge.v1.grade.b")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Loader rejection paths.
//
// loadGmatChallengeState is the trust boundary for persisted learner data: a
// half-finished GMAT session that survived a deploy, a browser that truncated
// a write, or a hand-edited localStorage value all arrive here. Each guard
// below is a "reject rather than resume a corrupt exam" decision, and each one
// is load-bearing in both directions — a guard that is too loose resumes a
// session with impossible state, and one that is too tight silently discards
// a child's in-progress exam. These tests pin the exact boundary.
// ---------------------------------------------------------------------------

const KEY_A = "kids_math.gmat_challenge.v1.grade.a";

/** Write an arbitrary (possibly corrupt) payload under grade a's key. */
function writeRaw(payload: unknown): void {
  window.localStorage.setItem(KEY_A, JSON.stringify(payload));
}

/** A structurally valid pickOrder state, as the object literal the loader sees. */
function validPickOrderPayload(): Record<string, unknown> {
  const items = pickGmatChallengeItems({ grade: "a", seed: "reject", pickerVersion: 6 });
  return { ...createStateAfterPick({ grade: "a", itemsBySection: items }) } as Record<
    string,
    unknown
  >;
}

describe("loadGmatChallengeState — envelope rejection", () => {
  // Control. Every rejection test below mutates one field of
  // validPickOrderPayload() and asserts null. Without this, a payload that was
  // already unloadable for an unrelated reason would make all of them pass
  // vacuously and prove nothing.
  it("loads the unmutated baseline payload (control for the rejection tests)", () => {
    writeRaw(validPickOrderPayload());
    const loaded = loadGmatChallengeState("a");
    expect(loaded).not.toBeNull();
    expect(loaded!.phase).toBe("pickOrder");
  });

  it("returns null when nothing is stored", () => {
    window.localStorage.removeItem(KEY_A);
    expect(loadGmatChallengeState("a")).toBeNull();
  });

  it("returns null on malformed JSON rather than throwing", () => {
    window.localStorage.setItem(KEY_A, "{not json");
    expect(loadGmatChallengeState("a")).toBeNull();
  });

  it.each([
    ["a JSON array", []],
    ["a bare string", "nope"],
    ["null", null],
    ["a number", 42],
  ])("returns null when the payload is %s", (_label, payload) => {
    writeRaw(payload);
    expect(loadGmatChallengeState("a")).toBeNull();
  });

  it("returns null on a future/unknown version", () => {
    writeRaw({ ...validPickOrderPayload(), version: 2 });
    expect(loadGmatChallengeState("a")).toBeNull();
  });

  it("returns null when the stored grade does not match the requested grade", () => {
    // Guards against grade-b progress being resurrected into a grade-a session.
    writeRaw({ ...validPickOrderPayload(), grade: "b" });
    expect(loadGmatChallengeState("a")).toBeNull();
  });

  it("returns null on a stale pickerVersion", () => {
    // The item bank changed, so the stored exercise ids may no longer exist.
    writeRaw({ ...validPickOrderPayload(), pickerVersion: 5 });
    expect(loadGmatChallengeState("a")).toBeNull();
  });

  it.each([["notAPhase"], [""], [123]])(
    "returns null when phase is %p",
    (phase) => {
      writeRaw({ ...validPickOrderPayload(), phase });
      expect(loadGmatChallengeState("a")).toBeNull();
    },
  );
});

describe("loadGmatChallengeState — sectionOrder sanitizer", () => {
  it("returns null when sectionOrder is not an array", () => {
    writeRaw({ ...validPickOrderPayload(), sectionOrder: "quant,verbal,data" });
    expect(loadGmatChallengeState("a")).toBeNull();
  });

  it("returns null when sectionOrder has fewer than three sections", () => {
    writeRaw({ ...validPickOrderPayload(), sectionOrder: ["quant", "verbal"] });
    expect(loadGmatChallengeState("a")).toBeNull();
  });

  it("returns null when sectionOrder contains a duplicate", () => {
    // Length is 3 but a section would be sat twice and another skipped.
    writeRaw({ ...validPickOrderPayload(), sectionOrder: ["quant", "quant", "verbal"] });
    expect(loadGmatChallengeState("a")).toBeNull();
  });

  it("returns null when sectionOrder contains an unknown section key", () => {
    writeRaw({ ...validPickOrderPayload(), sectionOrder: ["quant", "verbal", "essay"] });
    expect(loadGmatChallengeState("a")).toBeNull();
  });

  it("accepts a valid non-default section order", () => {
    writeRaw({ ...validPickOrderPayload(), sectionOrder: ["data", "quant", "verbal"] });
    expect(loadGmatChallengeState("a")?.sectionOrder).toEqual(["data", "quant", "verbal"]);
  });
});

describe("loadGmatChallengeState — itemsBySection sanitizer", () => {
  it("returns null when itemsBySection is missing a section key", () => {
    const p = validPickOrderPayload();
    const items = { ...(p.itemsBySection as Record<string, unknown>) };
    delete items.data;
    writeRaw({ ...p, itemsBySection: items });
    expect(loadGmatChallengeState("a")).toBeNull();
  });

  it("returns null when itemsBySection is not an object", () => {
    writeRaw({ ...validPickOrderPayload(), itemsBySection: [] });
    expect(loadGmatChallengeState("a")).toBeNull();
  });

  it("returns null when a section holds more items than the exam allows", () => {
    // An over-long section would render questions the timer was never sized for.
    const p = validPickOrderPayload();
    const items = p.itemsBySection as Record<string, string[]>;
    writeRaw({
      ...p,
      itemsBySection: { ...items, quant: [...items.quant, ...items.quant] },
    });
    expect(loadGmatChallengeState("a")).toBeNull();
  });

  it("drops non-string ids inside a section instead of rejecting the whole state", () => {
    const p = validPickOrderPayload();
    const items = p.itemsBySection as Record<string, string[]>;
    writeRaw({ ...p, itemsBySection: { ...items, verbal: [items.verbal[0], 7, null] } });
    expect(loadGmatChallengeState("a")?.itemsBySection.verbal).toEqual([items.verbal[0]]);
  });

  it("allows an over-long section in the rules phase, where items are not yet meaningful", () => {
    // The length cap is deliberately skipped before the pick happens.
    const p = validPickOrderPayload();
    const items = p.itemsBySection as Record<string, string[]>;
    writeRaw({
      ...p,
      phase: "rules",
      itemsBySection: { ...items, quant: [...items.quant, ...items.quant] },
    });
    expect(loadGmatChallengeState("a")).not.toBeNull();
  });
});

describe("loadGmatChallengeState — field-level coercion", () => {
  it.each([
    ["negative", -1],
    ["past the last section", 3],
    ["non-numeric", "1"],
    ["NaN", Number.NaN],
  ])("clamps an out-of-range orderIndex (%s) to 0", (_label, orderIndex) => {
    writeRaw({ ...validPickOrderPayload(), orderIndex });
    expect(loadGmatChallengeState("a")?.orderIndex).toBe(0);
  });

  it("preserves a valid orderIndex", () => {
    writeRaw({ ...validPickOrderPayload(), orderIndex: 2 });
    expect(loadGmatChallengeState("a")?.orderIndex).toBe(2);
  });

  it("returns null when reviewSnapshot is present but not an object", () => {
    writeRaw({ ...validPickOrderPayload(), reviewSnapshot: "snapshot" });
    expect(loadGmatChallengeState("a")).toBeNull();
  });

  it("treats a null reviewSnapshot as absent", () => {
    writeRaw({ ...validPickOrderPayload(), reviewSnapshot: null });
    expect(loadGmatChallengeState("a")?.reviewSnapshot).toBeNull();
  });

  it("keeps a well-formed reviewSnapshot", () => {
    writeRaw({ ...validPickOrderPayload(), reviewSnapshot: { "ex-1": "12" } });
    expect(loadGmatChallengeState("a")?.reviewSnapshot).toEqual({ "ex-1": "12" });
  });

  it.each([
    ["sectionEndsAt", "sectionEndsAt"],
    ["breakEndsAt", "breakEndsAt"],
  ])("nulls a non-numeric %s so a stale timer cannot expire instantly", (_l, field) => {
    writeRaw({ ...validPickOrderPayload(), [field]: "soon" });
    expect(loadGmatChallengeState("a")?.[field as "sectionEndsAt"]).toBeNull();
  });

  it("preserves numeric timer deadlines", () => {
    writeRaw({ ...validPickOrderPayload(), sectionEndsAt: 1700, breakEndsAt: 1800 });
    const loaded = loadGmatChallengeState("a");
    expect(loaded?.sectionEndsAt).toBe(1700);
    expect(loaded?.breakEndsAt).toBe(1800);
  });

  it("falls back to a fresh createdAt when the stored one is not a string", () => {
    writeRaw({ ...validPickOrderPayload(), createdAt: 12345 });
    expect(loadGmatChallengeState("a")?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it.each([
    ["below the floor", 0],
    ["above the ceiling", 6],
    ["non-numeric", "hard"],
  ])("resets an out-of-range adaptiveDifficulty (%s) to the mid value", (_l, adaptiveDifficulty) => {
    writeRaw({ ...validPickOrderPayload(), adaptiveDifficulty });
    expect(loadGmatChallengeState("a")?.adaptiveDifficulty).toBe(3);
  });

  it("preserves an in-range adaptiveDifficulty", () => {
    writeRaw({ ...validPickOrderPayload(), adaptiveDifficulty: 5 });
    expect(loadGmatChallengeState("a")?.adaptiveDifficulty).toBe(5);
  });

  it("resets a negative sectionQuestionIndex to 0", () => {
    writeRaw({ ...validPickOrderPayload(), sectionQuestionIndex: -3 });
    expect(loadGmatChallengeState("a")?.sectionQuestionIndex).toBe(0);
  });
});

describe("loadGmatChallengeState — score sanitizers", () => {
  it("drops scoreBySection when a section score is non-numeric", () => {
    writeRaw({
      ...validPickOrderPayload(),
      scoreBySection: { quant: 80, verbal: "70", data: 90 },
    });
    expect(loadGmatChallengeState("a")?.scoreBySection).toBeUndefined();
  });

  it("drops scoreBySection when it is not an object", () => {
    writeRaw({ ...validPickOrderPayload(), scoreBySection: 80 });
    expect(loadGmatChallengeState("a")?.scoreBySection).toBeUndefined();
  });

  it("keeps a complete scoreBySection", () => {
    writeRaw({ ...validPickOrderPayload(), scoreBySection: { quant: 80, verbal: 70, data: 90 } });
    expect(loadGmatChallengeState("a")?.scoreBySection).toEqual({
      quant: 80,
      verbal: 70,
      data: 90,
    });
  });

  it.each([
    ["a negative count", { quant: -1, verbal: 2, data: 3 }],
    ["a non-numeric count", { quant: "3", verbal: 2, data: 3 }],
    ["a missing section", { quant: 3, verbal: 2 }],
    ["a non-object", "3/7"],
  ])("drops correctBySection with %s", (_label, correctBySection) => {
    writeRaw({ ...validPickOrderPayload(), correctBySection });
    expect(loadGmatChallengeState("a")?.correctBySection).toBeUndefined();
  });

  it("keeps a valid correctBySection, including zeroes", () => {
    writeRaw({ ...validPickOrderPayload(), correctBySection: { quant: 0, verbal: 5, data: 7 } });
    expect(loadGmatChallengeState("a")?.correctBySection).toEqual({
      quant: 0,
      verbal: 5,
      data: 7,
    });
  });

  it("drops a non-finite scorePercent", () => {
    writeRaw({ ...validPickOrderPayload(), scorePercent: Number.POSITIVE_INFINITY });
    expect(loadGmatChallengeState("a")?.scorePercent).toBeUndefined();
  });

  it("drops a non-numeric totalQuestions", () => {
    writeRaw({ ...validPickOrderPayload(), totalQuestions: "22" });
    expect(loadGmatChallengeState("a")?.totalQuestions).toBeUndefined();
  });

  it("keeps valid scorePercent and totalQuestions", () => {
    writeRaw({ ...validPickOrderPayload(), scorePercent: 73, totalQuestions: 22 });
    const loaded = loadGmatChallengeState("a");
    expect(loaded?.scorePercent).toBe(73);
    expect(loaded?.totalQuestions).toBe(22);
  });
});

describe("loadGmatChallengeState — poolBySection and bookmarks", () => {
  it("drops poolBySection when a section key is missing", () => {
    writeRaw({ ...validPickOrderPayload(), poolBySection: { quant: [], verbal: [] } });
    expect(loadGmatChallengeState("a")?.poolBySection).toBeUndefined();
  });

  it("drops poolBySection when it is not an object", () => {
    writeRaw({ ...validPickOrderPayload(), poolBySection: "pool" });
    expect(loadGmatChallengeState("a")?.poolBySection).toBeUndefined();
  });

  it("keeps a complete poolBySection", () => {
    writeRaw({
      ...validPickOrderPayload(),
      poolBySection: { quant: ["x"], verbal: ["y"], data: ["z"] },
    });
    expect(loadGmatChallengeState("a")?.poolBySection).toEqual({
      quant: ["x"],
      verbal: ["y"],
      data: ["z"],
    });
  });

  it("falls back to empty bookmarks when the field is not an object", () => {
    // Bookmarks are a convenience, not exam state, so they degrade rather than reject.
    writeRaw({ ...validPickOrderPayload(), bookmarks: "none" });
    expect(loadGmatChallengeState("a")?.bookmarks).toEqual({ quant: [], verbal: [], data: [] });
  });

  it("keeps bookmarks and drops non-string entries", () => {
    writeRaw({
      ...validPickOrderPayload(),
      bookmarks: { quant: ["ex-1", 5], verbal: [], data: ["ex-9"] },
    });
    expect(loadGmatChallengeState("a")?.bookmarks).toEqual({
      quant: ["ex-1"],
      verbal: [],
      data: ["ex-9"],
    });
  });

  it("tolerates a bookmarks object missing a section", () => {
    writeRaw({ ...validPickOrderPayload(), bookmarks: { quant: ["ex-1"] } });
    expect(loadGmatChallengeState("a")?.bookmarks).toEqual({
      quant: ["ex-1"],
      verbal: [],
      data: [],
    });
  });
});

describe("gmat-challenge storage — server-side rendering", () => {
  // Follows the window-deletion pattern from tests/unit/lib/utils/guards.test.ts.
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

  it("loadGmatChallengeState returns null instead of touching localStorage", () => {
    withoutWindow(() => {
      expect(loadGmatChallengeState("a")).toBeNull();
    });
  });

  it("saveGmatChallengeState is a no-op rather than a crash", () => {
    withoutWindow(() => {
      expect(() => saveGmatChallengeState("a", createInitialRulesState("a"))).not.toThrow();
    });
  });

  it("clearGmatChallengeState is a no-op rather than a crash", () => {
    withoutWindow(() => {
      expect(() => clearGmatChallengeState("a")).not.toThrow();
    });
  });
});

describe("saveGmatChallengeState — failure tolerance", () => {
  it("does not throw when localStorage rejects the write (quota / private mode)", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    try {
      expect(() => saveGmatChallengeState("a", createInitialRulesState("a"))).not.toThrow();
    } finally {
      setItem.mockRestore();
    }
  });
});

describe("clearGmatChallengeState — failure tolerance", () => {
  it("does not throw when localStorage rejects the removal", () => {
    const removeItem = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("SecurityError");
      });
    try {
      expect(() => clearGmatChallengeState("a")).not.toThrow();
    } finally {
      removeItem.mockRestore();
    }
  });
});
