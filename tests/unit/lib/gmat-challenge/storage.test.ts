import { describe, expect, it } from "vitest";
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
