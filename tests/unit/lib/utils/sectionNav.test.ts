import { describe, expect, it } from "vitest";
import { getNextUnlockedSection } from "@/lib/utils/sectionNav";
import type { ExerciseId, SectionId, WorkbookDay } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeExId(sectionIdx: number, exIdx: number): ExerciseId {
  return `day-1-section-${sectionIdx + 1}-exercise-${exIdx + 1}` as ExerciseId;
}

function makeSectionId(idx: number): SectionId {
  return `day-1-section-${idx + 1}` as SectionId;
}

function makeDay(sectionCount: number): WorkbookDay {
  return {
    id: "day-1",
    dayNumber: 1,
    title: "Test",
    week: 1,
    objective: "test",
    spiralReviewTags: [],
    unlockThresholdPercent: 100,
    sections: Array.from({ length: sectionCount }, (_, i) => ({
      id: makeSectionId(i),
      title: `Section ${i + 1}`,
      type: i === 0 ? ("warmup" as const) : ("arithmetic" as const),
      learningGoal: "test",
      prerequisiteSkillTags: [],
      exercises: [
        {
          id: makeExId(i, 0),
          kind: "number_input" as const,
          prompt: "1 + 1 = ?",
          answer: 2,
          meta: { skillTags: [], difficulty: 1 as const, representation: "abstract" as const },
        },
      ],
    })),
  };
}

function allCorrect(day: WorkbookDay, sectionIdx: number): Record<ExerciseId, boolean> {
  const result: Record<ExerciseId, boolean> = {} as Record<ExerciseId, boolean>;
  day.sections[sectionIdx].exercises.forEach((ex) => {
    result[ex.id] = true;
  });
  return result;
}

function allSectionsCorrect(
  day: WorkbookDay,
  upToIdx: number,
): Record<ExerciseId, boolean> {
  const result: Record<ExerciseId, boolean> = {} as Record<ExerciseId, boolean>;
  for (let i = 0; i <= upToIdx; i++) {
    day.sections[i].exercises.forEach((ex) => {
      result[ex.id] = true;
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getNextUnlockedSection", () => {
  it("returns section 1 when warmup (index 0) is complete and section 1 is not the last", () => {
    const day = makeDay(3); // sections: [0, 1, 2]
    const correctAnswers = allCorrect(day, 0); // warmup done
    const next = getNextUnlockedSection(day, 0, correctAnswers);
    expect(next).not.toBeNull();
    expect(next?.id).toBe(makeSectionId(1));
  });

  it("returns null when current section is the last section", () => {
    const day = makeDay(3); // sections: [0, 1, 2]
    const correctAnswers = allSectionsCorrect(day, 1); // warmup + section 1 done
    const next = getNextUnlockedSection(day, 2, correctAnswers); // at last (idx=2)
    expect(next).toBeNull();
  });

  it("returns null when next section would be last but not all prior sections are done", () => {
    const day = makeDay(3); // sections: [0, 1, 2]
    // Only warmup done; section 1 not done → last section (2) stays locked
    const correctAnswers = allCorrect(day, 0);
    const next = getNextUnlockedSection(day, 1, correctAnswers); // at middle (idx=1), next=last(idx=2)
    expect(next).toBeNull();
  });

  it("returns last section when all prior sections are done", () => {
    const day = makeDay(3); // sections: [0, 1, 2]
    const correctAnswers = allSectionsCorrect(day, 1); // warmup + section 1 done
    const next = getNextUnlockedSection(day, 1, correctAnswers); // at middle (idx=1), next=last(idx=2)
    expect(next).not.toBeNull();
    expect(next?.id).toBe(makeSectionId(2));
  });

  it("returns null when warmup is not done (middle section is locked)", () => {
    const day = makeDay(3);
    const correctAnswers: Record<ExerciseId, boolean> = {} as Record<ExerciseId, boolean>; // nothing done
    const next = getNextUnlockedSection(day, 0, correctAnswers); // at warmup (idx=0), next=middle(idx=1)
    expect(next).toBeNull();
  });

  it("handles a 2-section day: warmup done → next is last section when all prior done", () => {
    const day = makeDay(2); // sections: [0, 1]
    const correctAnswers = allCorrect(day, 0); // warmup done
    // With 2 sections, section at idx=1 IS the last. idx=0 → nextIdx=1 → isNextLast=true
    // allPriorComplete = sections.slice(0,-1).every() = sections[0] done = true
    const next = getNextUnlockedSection(day, 0, correctAnswers);
    expect(next).not.toBeNull();
    expect(next?.id).toBe(makeSectionId(1));
  });
});
