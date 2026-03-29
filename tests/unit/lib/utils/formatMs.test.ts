import { describe, expect, it } from "vitest";
import { formatMs } from "@/lib/utils/formatMs";

describe("formatMs", () => {
  it("formats mm:ss with zero padding", () => {
    expect(formatMs(65_000)).toBe("01:05");
    expect(formatMs(0)).toBe("00:00");
  });
});
