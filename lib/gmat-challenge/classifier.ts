import type { Exercise } from "@/lib/types";
import type { SkillTag } from "@/lib/types";
import type { GmatSectionKey } from "./types";

const VERBAL_TAGS = new Set<SkillTag>(["word-problems"]);

const DATA_TAGS = new Set<SkillTag>([
  "comparing",
  "measurement-length",
  "measurement-time",
  "measurement-area",
  "measurement-weight",
  "money-shekel",
  "fractions-parts",
  "patterns",
]);

export function classifyGmatSection(exercise: Exercise): GmatSectionKey {
  const tags = exercise.meta?.skillTags ?? [];
  if (tags.some((t) => VERBAL_TAGS.has(t))) {
    return "verbal";
  }
  if (tags.some((t) => DATA_TAGS.has(t))) {
    return "data";
  }
  return "quant";
}
