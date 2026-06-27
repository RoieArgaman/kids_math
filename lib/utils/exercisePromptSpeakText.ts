import type { SplitMathExpressionResult } from "@/lib/utils/mathText";

/**
 * Emoji (and their variation selectors / ZWJ joiners / keycap parts) are decorative
 * in prompts. They must NOT reach the speech engine: a Hebrew voice either skips them
 * or reads their name aloud — and many prompts use an emoji that depicts the answer
 * (e.g. "מָה מְאִירָה בַּיּוֹם? ☀️" → would speak "שמש"), which both clutters the sentence
 * and leaks the answer. We strip them from the spoken string only; the on-screen
 * prompt keeps its emoji.
 *
 * Matched without the regex `u` flag (the project's tsconfig target predates ES6
 * unicode regex): astral emoji via surrogate pairs (U+1F000–U+1FFFF), plus the BMP
 * symbol/dingbat blocks (☀ ⭐ ☂ …), the variation selector (U+FE0F), the zero-width
 * joiner (U+200D) and the combining enclosing keycap (U+20E3).
 */
const EMOJI_FOR_SPEECH =
  /\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF]|[←-➿⬀-⯿️‍⃣]/g;

function stripEmojiForSpeech(input: string): string {
  return input.replace(EMOJI_FOR_SPEECH, " ").replace(/\s+/g, " ").trim();
}

/**
 * Text for TTS aligned with what the student sees: Hebrew prompt line + math line (when
 * split). Decorative emoji are removed so the engine speaks only the Hebrew sentence.
 */
export function buildExercisePromptSpeakText(parts: SplitMathExpressionResult): string {
  const text = stripEmojiForSpeech(parts.text);
  const math = parts.math?.replace(/\s+/g, " ").trim();
  if (math) {
    return `${text} ${math}`.replace(/\s+/g, " ").trim();
  }
  return text;
}
