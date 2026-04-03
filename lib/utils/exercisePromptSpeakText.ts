import type { SplitMathExpressionResult } from "@/lib/utils/mathText";

/**
 * Text for TTS aligned with what the student sees: Hebrew prompt line + math line (when split).
 */
export function buildExercisePromptSpeakText(parts: SplitMathExpressionResult): string {
  const text = parts.text.replace(/\s+/g, " ").trim();
  const math = parts.math?.replace(/\s+/g, " ").trim();
  if (math) {
    return `${text} ${math}`.replace(/\s+/g, " ").trim();
  }
  return text;
}
