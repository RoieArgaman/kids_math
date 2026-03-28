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
});
