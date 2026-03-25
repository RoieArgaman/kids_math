export type GradeId = "a" | "b";

export const DEFAULT_GRADE: GradeId = "a";

export function parseGradeId(input: string): GradeId | null {
  if (input === "a" || input === "b") {
    return input;
  }
  return null;
}

export function gradeLabel(grade: GradeId): string {
  return grade === "a" ? "א׳" : "ב׳";
}

