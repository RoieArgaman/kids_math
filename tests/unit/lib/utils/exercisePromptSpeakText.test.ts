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

  it("strips decorative emoji so the engine never speaks (or leaks) them", () => {
    // Answer-depicting emoji must not be spoken.
    expect(buildExercisePromptSpeakText({ text: "מָה מְאִירָה אֶת הַשָּׁמַיִם בַּיּוֹם? ☀️" })).toBe(
      "מָה מְאִירָה אֶת הַשָּׁמַיִם בַּיּוֹם?",
    );
    // Variation-selector + multi-codepoint emoji fully removed, no leftover spaces.
    expect(buildExercisePromptSpeakText({ text: "בְּאֵיזֶה אֵיבָר רוֹאִים? 👁️" })).toBe(
      "בְּאֵיזֶה אֵיבָר רוֹאִים?",
    );
    expect(buildExercisePromptSpeakText({ text: "מָה אוֹכֵל הָאַרְנָב? 🐰" })).toBe("מָה אוֹכֵל הָאַרְנָב?");
  });

  it("keeps Hebrew, digits and math operators (only emoji are removed)", () => {
    expect(buildExercisePromptSpeakText({ text: "כַּמָּה? 🍎", math: "3 + 2" })).toBe("כַּמָּה? 3 + 2");
  });
});
