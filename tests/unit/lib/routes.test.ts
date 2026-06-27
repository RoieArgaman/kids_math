import { describe, expect, it } from "vitest";
import { routes } from "@/lib/routes";

describe("routes", () => {
  it("exposes stable legal page paths", () => {
    expect(routes.privacy()).toBe("/privacy");
    expect(routes.cookies()).toBe("/cookies");
  });

  it("preserves preview query on legal routes when requested", () => {
    expect(routes.privacy({ searchParams: { previewAll: "1" } })).toBe("/privacy?previewAll=1");
  });

  it("maps the subject-first IA to the expected paths", () => {
    expect(routes.subjectPicker()).toBe("/");
    expect(routes.mathHome()).toBe("/math");
    expect(routes.englishLevelPicker()).toBe("/english");
    // English levels mirror the grade structure: picker → per-level home/day/exam.
    expect(routes.englishHome("a")).toBe("/english/a");
    expect(routes.englishHome("b")).toBe("/english/b");
    expect(routes.englishDay("a", "day-1")).toBe("/english/a/day/day-1");
    expect(routes.englishSection("b", "day-15", "day-15-section-0")).toBe(
      "/english/b/day/day-15/section/day-15-section-0",
    );
    expect(routes.englishExam("a")).toBe("/english/a/exam");
    // gradePicker() now resolves to the relocated Math grade picker.
    expect(routes.gradePicker()).toBe("/math");
  });

  it("preserves preview query through the new subject hops", () => {
    expect(routes.mathHome({ previewAll: true })).toBe("/math?previewAll=1");
    expect(routes.englishLevelPicker({ previewAll: true })).toBe("/english?previewAll=1");
    expect(routes.englishHome("a", { previewAll: true })).toBe("/english/a?previewAll=1");
  });
});
