import type { GradeId } from "@/lib/grades";
import { isPreviewAllEnabled } from "@/lib/utils/preview";

type SearchParamValue = string | string[] | undefined;
export type SearchParamsLike = URLSearchParams | Record<string, SearchParamValue> | undefined;

export type RouteOpts = {
  grade?: GradeId;
  searchParams?: SearchParamsLike;
  previewAll?: boolean;
  preserveKeys?: readonly string[];
};

const DEFAULT_PRESERVE_KEYS = ["previewAll"] as const;

function readParam(sp: SearchParamsLike, key: string): string | null {
  if (!sp) return null;
  if (sp instanceof URLSearchParams) return sp.get(key);

  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0] ?? null;
  return null;
}

export function getPreviewAllFromSearchParams(sp?: SearchParamsLike): boolean {
  return isPreviewAllEnabled(readParam(sp, "previewAll"));
}

function buildQuery(opts?: RouteOpts): URLSearchParams {
  const preserveKeys = opts?.preserveKeys ?? DEFAULT_PRESERVE_KEYS;
  const out = new URLSearchParams();

  for (const k of preserveKeys) {
    const v = readParam(opts?.searchParams, k);
    if (v != null) out.set(k, v);
  }

  if (typeof opts?.previewAll === "boolean") {
    if (opts.previewAll) out.set("previewAll", "1");
    else out.delete("previewAll");
  }

  if (opts?.grade) {
    out.set("grade", opts.grade);
  }

  return out;
}

function withQuery(pathname: string, opts?: RouteOpts): string {
  const qs = buildQuery(opts).toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export const routes = {
  /** Top-level "what do you want to learn" picker (Math / English). */
  subjectPicker: (opts?: Omit<RouteOpts, "grade">) => withQuery("/", opts),
  /** Math subject home (grade picker). */
  mathHome: (opts?: Omit<RouteOpts, "grade">) => withQuery("/math", opts),
  /** English level picker (שלב א׳ / שלב ב׳) — the English analog of the grade picker. */
  englishLevelPicker: (opts?: Omit<RouteOpts, "grade">) => withQuery("/english", opts),
  /** Home for a single English level (its lessons + that level's exam). */
  englishHome: (level: GradeId, opts?: Omit<RouteOpts, "grade">) => withQuery(`/english/${level}`, opts),
  englishDay: (level: GradeId, dayId: string, opts?: Omit<RouteOpts, "grade">) =>
    withQuery(`/english/${level}/day/${dayId}`, opts),
  englishSection: (level: GradeId, dayId: string, sectionId: string, opts?: Omit<RouteOpts, "grade">) =>
    withQuery(`/english/${level}/day/${dayId}/section/${sectionId}`, opts),
  englishExam: (level: GradeId, opts?: Omit<RouteOpts, "grade">) => withQuery(`/english/${level}/exam`, opts),
  /**
   * Math grade picker. Now lives at /math (the home "/" is the subject picker).
   * All existing "back to grade selection" links resolve here automatically.
   */
  gradePicker: (opts?: Omit<RouteOpts, "grade">) => withQuery("/math", opts),
  gradeHome: (grade: GradeId, opts?: Omit<RouteOpts, "grade">) => withQuery(`/grade/${grade}`, opts),
  gradePlan: (grade: GradeId, opts?: Omit<RouteOpts, "grade">) => withQuery(`/grade/${grade}/plan`, opts),
  gradeDay: (grade: GradeId, dayId: string, opts?: Omit<RouteOpts, "grade">) =>
    withQuery(`/grade/${grade}/day/${dayId}`, opts),
  gradeSection: (grade: GradeId, dayId: string, sectionId: string, opts?: Omit<RouteOpts, "grade">) =>
    withQuery(`/grade/${grade}/day/${dayId}/section/${sectionId}`, opts),
  gradeGmatChallenge: (grade: GradeId, opts?: Omit<RouteOpts, "grade">) =>
    withQuery(`/grade/${grade}/gmat-challenge`, opts),
  gradeBadges: (grade: GradeId, opts?: Omit<RouteOpts, "grade">) =>
    withQuery(`/grade/${grade}/badges`, opts),
  adminProgress: (opts?: RouteOpts) => withQuery("/admin/progress", opts),
  adminUsers: (opts?: RouteOpts) => withQuery("/admin/users", opts),
  privacy: (opts?: RouteOpts) => withQuery("/privacy", opts),
  cookies: (opts?: RouteOpts) => withQuery("/cookies", opts),
};

