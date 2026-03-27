import { normalizeAnswerValue } from "@/lib/utils/exercise";

/** How many exercises may differ from the snapshot during section review (GMAT Focus: up to three answers per section). */
export const DEFAULT_MAX_REVIEW_DIVERGENCES = 3;

export function countReviewDivergences(
  answers: Record<string, string>,
  snapshot: Record<string, string>,
  itemIds: readonly string[],
): number {
  let n = 0;
  for (const id of itemIds) {
    const a = normalizeAnswerValue(answers[id] ?? "");
    const b = normalizeAnswerValue(snapshot[id] ?? "");
    if (a !== b) {
      n += 1;
    }
  }
  return n;
}

export function wouldExceedReviewLimit(
  answers: Record<string, string>,
  snapshot: Record<string, string>,
  itemIds: readonly string[],
  changedId: string,
  nextValue: string,
  maxDivergences: number,
): boolean {
  const nextAnswers = { ...answers, [changedId]: nextValue };
  return countReviewDivergences(nextAnswers, snapshot, itemIds) > maxDivergences;
}
