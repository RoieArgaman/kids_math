import { describe, expect, it } from "vitest";
import { buildExercisePromptSpeakText } from "@/lib/utils/exercisePromptSpeakText";

describe("buildExercisePromptSpeakText", () => {
  it("returns trimmed text when there is no math split", () => {
    expect(buildExercisePromptSpeakText({ text: "  בִּחְרוּ: שָׁלוֹשׁ  " })).toBe("בִּחְרוּ: שָׁלוֹשׁ");
  });

  it("concatenates text and math like the visible prompt + math line", () => {
    expect(
      buildExercisePromptSpeakText({
        text: "חַשְׁבוּ",
        math: "5 + 7",
      }),
    ).toBe("חַשְׁבוּ 5 + 7");
  });
});
