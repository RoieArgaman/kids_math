import { describe, expect, it } from "vitest";
import { buildWorkedExampleSpeakChunks } from "@/lib/utils/workedExampleSpeakText";
import type { WorkedExample } from "@/lib/types";

const sample: WorkedExample = {
  title: "דֻּגְמָה פְּתוּרָה",
  prompt: "דֻּגְמָה: 26 + 10 = 36. עַכְשָׁיו חַשְׁבוּ:",
  steps: ["קוֹרְאִים אֶת הַשְּׁאֵלָה.", "פּוֹתְרִים בְּצַעֲדִים קְטַנִּים."],
  takeaway: "בּוֹדְקִים שֶׁהַתּוֹצָאָה הִגְיוֹנִית.",
};

describe("buildWorkedExampleSpeakChunks", () => {
  it("includes title, prompt, labeled steps, and takeaway", () => {
    const chunks = buildWorkedExampleSpeakChunks(sample);
    expect(chunks[0]).toBe("דֻּגְמָה פְּתוּרָה");
    expect(chunks[1]).toContain("26");
    expect(chunks[2]).toBe("שָׁלָב רִאשׁוֹן: קוֹרְאִים אֶת הַשְּׁאֵלָה.");
    expect(chunks[3]).toBe("שָׁלָב שֵׁנִי: פּוֹתְרִים בְּצַעֲדִים קְטַנִּים.");
    expect(chunks[4]).toBe("בּוֹדְקִים שֶׁהַתּוֹצָאָה הִגְיוֹנִית.");
  });

  it("supports steps-only when title and prompt are empty", () => {
    const chunks = buildWorkedExampleSpeakChunks({
      title: "",
      prompt: "",
      steps: ["שלב אחד"],
    });
    expect(chunks).toEqual(["שלב אחד"]);
  });
});
