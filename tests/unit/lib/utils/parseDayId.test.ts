import { describe, expect, it } from "vitest";
import { parseDayId } from "@/lib/utils/parseDayId";

describe("parseDayId", () => {
  it("parses valid day-<positive integer> ids", () => {
    expect(parseDayId("day-1")).toBe("day-1");
    expect(parseDayId("day-22")).toBe("day-22");
    expect(parseDayId("day-29")).toBe("day-29");
    expect(parseDayId("day-999")).toBe("day-999");
    expect(parseDayId("Day-1")).toBe("day-1");
    expect(parseDayId("  day-5  ")).toBe("day-5");
    expect(parseDayId("day-01")).toBe("day-1");
    expect(parseDayId("day\u20112")).toBe("day-2"); // en dash in "day‑2"
  });

  it("rejects invalid ids", () => {
    expect(parseDayId("day-0")).toBeNull();
    expect(parseDayId("day-x")).toBeNull();
    expect(parseDayId("something")).toBeNull();
  });
});

