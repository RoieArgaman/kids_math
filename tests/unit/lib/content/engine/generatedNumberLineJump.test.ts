import { describe, expect, it } from "vitest";

import { generatedNumberLineJump } from "@/lib/content/engine/exercise-factories";
import {
  buildNumberLineJumpParams,
  knownNumberCeiling,
  numberLineJumpTail,
} from "@/lib/content/engine/number-range";
import { isAnswerCorrect } from "@/lib/utils/exercise";

function build(overrides?: Partial<Parameters<typeof generatedNumberLineJump>[0]>) {
  return generatedNumberLineJump({
    grade: "b",
    dayNumber: 9,
    sectionNumber: 2,
    exerciseNumber: 5,
    seedSuffix: "focus",
    leadIn: "עַל קַו הַמִּסְפָּרִים: ",
    tags: ["number-line", "patterns"],
    difficulty: 3,
    representation: "abstract",
    ...overrides,
  });
}

describe("generatedNumberLineJump", () => {
  it("builds a valid number_line_jump with the correct id and metadata", () => {
    const ex = build();
    expect(ex.kind).toBe("number_line_jump");
    expect(ex.id).toBe("day-9-section-2-exercise-5");
    expect(ex.meta.skillTags).toEqual(["number-line", "patterns"]);
    expect(ex.meta.difficulty).toBe(3);
    expect(ex.meta.representation).toBe("abstract");
  });

  it("uses the seeded generator's params bounded by the day's ceiling", () => {
    const ex = build();
    const ceiling = knownNumberCeiling("b", 9);
    const expected = buildNumberLineJumpParams("b|9|2|5|focus", ceiling);
    expect(ex.start).toBe(expected.start);
    expect(ex.end).toBe(expected.end);
    expect(ex.step).toBe(expected.step);
    expect(ex.answer).toBe(expected.jumps);
    expect(ex.end).toBeLessThanOrEqual(ceiling);
  });

  it("holds the number_line_jump invariants", () => {
    const ex = build();
    expect(ex.start).toBeLessThan(ex.end);
    expect((ex.end - ex.start) % ex.step).toBe(0);
    expect(ex.answer).toBe((ex.end - ex.start) / ex.step);
    expect(ex.answer).toBeGreaterThanOrEqual(2);
  });

  it("prompts with the lead-in followed by a tail whose numbers match the line", () => {
    const ex = build();
    const tail = numberLineJumpTail(ex.start, ex.end, ex.step);
    expect(ex.prompt).toBe(`עַל קַו הַמִּסְפָּרִים: ${tail}`);
  });

  it("grades the number of jumps as the correct answer", () => {
    const ex = build();
    expect(isAnswerCorrect(ex, String(ex.answer))).toBe(true);
    expect(isAnswerCorrect(ex, ex.answer)).toBe(true);
    expect(isAnswerCorrect(ex, String(ex.answer + 1))).toBe(false);
  });

  it("is deterministic across rebuilds", () => {
    expect(build()).toEqual(build());
  });

  it("gives distinct lines to sites sharing a coordinate via seedSuffix", () => {
    const a = build({ seedSuffix: "warmup" });
    const b = build({ seedSuffix: "focus" });
    expect(JSON.stringify({ s: a.start, e: a.end, st: a.step })).not.toBe(
      JSON.stringify({ s: b.start, e: b.end, st: b.step }),
    );
  });
});
