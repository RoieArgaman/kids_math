import { NextResponse, type NextRequest } from "next/server";
import {
  GRADE_B_UNLOCK_COOKIE_VALUE,
  MATH_B_LEGACY_COOKIE,
  subjectGradeBUnlockCookieName,
} from "@/lib/gradeUnlock";
import type { Subject } from "@/lib/subjects";
import { isPreviewAllEnabled } from "@/lib/utils/preview";

/**
 * Server-side grade-B gate. Each subject's grade-B subtree requires that subject's
 * unlock cookie; `/subjects/b` (grade picker) requires ANY subject unlocked.
 * Math also accepts the legacy single cookie. `previewAll` (dev/localhost QA) bypasses.
 *
 * EDGE runtime: only imports edge-safe modules (cookie names + preview param check).
 */

const SUBJECTS: readonly Subject[] = ["math", "english", "science"];

function isSubjectUnlocked(request: NextRequest, subject: Subject): boolean {
  if (request.cookies.get(subjectGradeBUnlockCookieName(subject))?.value === GRADE_B_UNLOCK_COOKIE_VALUE) {
    return true;
  }
  if (subject === "math" && request.cookies.get(MATH_B_LEGACY_COOKIE)?.value === GRADE_B_UNLOCK_COOKIE_VALUE) {
    return true;
  }
  return false;
}

const SUBJECT_SUBTREES: ReadonlyArray<{ prefix: string; lockedPath: string; subject: Subject }> = [
  { prefix: "/grade/b", lockedPath: "/grade/b/locked", subject: "math" },
  { prefix: "/english/b", lockedPath: "/english/b/locked", subject: "english" },
  { prefix: "/science/b", lockedPath: "/science/b/locked", subject: "science" },
];

const SUBJECTS_B_LOCKED_PATH = "/subjects/b/locked";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // QA bypass, consistent with the app-wide previewAll gate (no-op in production).
  if (isPreviewAllEnabled(request.nextUrl.searchParams.get("previewAll"))) {
    return NextResponse.next();
  }

  for (const { prefix, lockedPath, subject } of SUBJECT_SUBTREES) {
    if (pathname.startsWith(prefix)) {
      if (pathname.startsWith(lockedPath)) {
        return NextResponse.next();
      }
      if (!isSubjectUnlocked(request, subject)) {
        const url = request.nextUrl.clone();
        url.pathname = lockedPath;
        url.searchParams.set("next", `${pathname}${search}`);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
  }

  // Grade-level picker gate: /subjects/b needs at least one subject unlocked.
  if (pathname === "/subjects/b") {
    if (!SUBJECTS.some((subject) => isSubjectUnlocked(request, subject))) {
      const url = request.nextUrl.clone();
      url.pathname = SUBJECTS_B_LOCKED_PATH;
      url.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/grade/b/:path*", "/english/b/:path*", "/science/b/:path*", "/subjects/b"],
};
