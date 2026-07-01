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

  it("builds the Math grade routes for every hop", () => {
    expect(routes.gradeHome("a")).toBe("/grade/a");
    expect(routes.gradePlan("b")).toBe("/grade/b/plan");
    expect(routes.gradeDay("a", "day-1")).toBe("/grade/a/day/day-1");
    expect(routes.gradeSection("b", "day-15", "day-15-section-0")).toBe(
      "/grade/b/day/day-15/section/day-15-section-0",
    );
    expect(routes.gradeGmatChallenge("a")).toBe("/grade/a/gmat-challenge");
    expect(routes.gradeBadges("b")).toBe("/grade/b/badges");
  });

  it("builds the Science routes mirroring the grade structure", () => {
    expect(routes.scienceLevelPicker()).toBe("/science");
    expect(routes.scienceHome("a")).toBe("/science/a");
    expect(routes.scienceDay("b", "day-3")).toBe("/science/b/day/day-3");
    expect(routes.scienceSection("a", "day-3", "day-3-section-1")).toBe(
      "/science/a/day/day-3/section/day-3-section-1",
    );
    expect(routes.scienceExam("b")).toBe("/science/b/exam");
  });

  it("builds the PIN-gated admin + parent routes", () => {
    expect(routes.adminHub()).toBe("/admin");
    expect(routes.adminProgress()).toBe("/admin/progress");
    expect(routes.adminUsers()).toBe("/admin/users");
    expect(routes.parentDashboard()).toBe("/admin/parent-dashboard");
  });

  it("preserves preview query across deep grade routes", () => {
    expect(routes.gradeDay("a", "day-1", { previewAll: true })).toBe("/grade/a/day/day-1?previewAll=1");
    expect(routes.scienceExam("b", { previewAll: true })).toBe("/science/b/exam?previewAll=1");
  });

  it("reads previewAll from an incoming searchParams bag and carries it forward", () => {
    // Default preserveKeys includes previewAll, so a "1" in the source URL survives the hop.
    expect(routes.gradeHome("a", { searchParams: { previewAll: "1" } })).toBe("/grade/a?previewAll=1");
    // Accepts a real URLSearchParams instance too.
    const sp = new URLSearchParams("previewAll=1");
    expect(routes.mathHome({ searchParams: sp })).toBe("/math?previewAll=1");
  });

  it("drops preview query when previewAll is explicitly false", () => {
    expect(routes.gradeHome("a", { searchParams: { previewAll: "1" }, previewAll: false })).toBe("/grade/a");
  });

  it("carries extra preserveKeys when asked, ignoring unlisted params", () => {
    expect(
      routes.adminProgress({ searchParams: { grade: "b", other: "x" }, preserveKeys: ["grade"] }),
    ).toBe("/admin/progress?grade=b");
  });
});
