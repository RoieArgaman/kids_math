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
