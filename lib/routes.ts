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
  gradePicker: (opts?: Omit<RouteOpts, "grade">) => withQuery("/", opts),
  gradeHome: (grade: GradeId, opts?: Omit<RouteOpts, "grade">) => withQuery(`/grade/${grade}`, opts),
  gradePlan: (grade: GradeId, opts?: Omit<RouteOpts, "grade">) => withQuery(`/grade/${grade}/plan`, opts),
  gradeDay: (grade: GradeId, dayId: string, opts?: Omit<RouteOpts, "grade">) =>
    withQuery(`/grade/${grade}/day/${dayId}`, opts),
  gradeGmatChallenge: (grade: GradeId, opts?: Omit<RouteOpts, "grade">) =>
    withQuery(`/grade/${grade}/gmat-challenge`, opts),
  adminProgress: (opts?: RouteOpts) => withQuery("/admin/progress", opts),
  privacy: (opts?: RouteOpts) => withQuery("/privacy", opts),
  cookies: (opts?: RouteOpts) => withQuery("/cookies", opts),
};

