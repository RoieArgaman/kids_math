import type { WorkedExample } from "@/lib/types";
import { buildExercisePromptSpeakText } from "@/lib/utils/exercisePromptSpeakText";
import { splitMathExpression } from "@/lib/utils/mathText";

/** One speak chunk per title, prompt, step, and optional takeaway (worked-example TTS). */
export function buildWorkedExampleSpeakChunks(example: WorkedExample): string[] {
  const chunks: string[] = [];
  const title = example.title.trim();
  if (title) chunks.push(title);

  const promptParts = splitMathExpression(example.prompt);
  const promptSpeak = buildExercisePromptSpeakText(promptParts);
  if (promptSpeak) chunks.push(promptSpeak);

  const steps = example.steps.map((s) => s.trim()).filter(Boolean);
  const stepLabels = ["שָׁלָב שֵׁנִי", "שָׁלָב שְׁלִישִׁי", "שָׁלָב רְבִיעִי", "שָׁלָב חֲמִישִׁי"];
  const labelSteps = chunks.length > 0;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const label = labelSteps ? stepLabels[i] : undefined;
    chunks.push(label ? `${label}: ${step}` : step);
  }

  const takeaway = example.takeaway?.trim();
  if (takeaway) chunks.push(takeaway);

  return chunks;
}
