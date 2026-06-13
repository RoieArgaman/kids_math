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
    expect(routes.englishHome()).toBe("/english");
    // gradePicker() now resolves to the relocated Math grade picker.
    expect(routes.gradePicker()).toBe("/math");
  });

  it("preserves preview query through the new subject hops", () => {
    expect(routes.mathHome({ previewAll: true })).toBe("/math?previewAll=1");
    expect(routes.englishHome({ previewAll: true })).toBe("/english?previewAll=1");
  });
});
