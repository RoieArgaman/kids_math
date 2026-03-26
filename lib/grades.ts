export type GradeId = "a" | "b";

export const DEFAULT_GRADE: GradeId = "a";

export function parseGradeId(input: string): GradeId | null {
  const g = input.trim().toLowerCase();
  if (g === "a" || g === "b") {
    return g;
  }
  return null;
}

export function gradeLabel(grade: GradeId): string {
  return grade === "a" ? "א׳" : "ב׳";
}

