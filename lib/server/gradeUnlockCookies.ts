import { NextResponse, type NextRequest } from "next/server";

import {
  GRADE_B_UNLOCK_COOKIE_VALUE,
  MATH_B_LEGACY_COOKIE,
  subjectGradeBUnlockCookieName,
} from "@/lib/gradeUnlock";
import { parseSubjectId, type Subject } from "@/lib/subjects";

/**
 * Server-only helpers that set/clear the per-subject grade-B unlock cookies.
 * Shared by the subject-aware routes (`/api/grade-b-unlock|lock`) and the legacy
 * math shims (`/api/unlock-grade-b|lock-grade-b`). Not edge-safe — route handlers
 * (Node runtime) only.
 */

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function isSecureRequest(request: NextRequest): boolean {
  // Prod Next can run over http (e.g. CI). Only mark `secure` on real https.
  return (
    request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https"
  );
}

async function readSubject(request: NextRequest, fallback: Subject): Promise<Subject> {
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "subject" in body) {
      const raw = (body as { subject?: unknown }).subject;
      if (typeof raw === "string") {
        const parsed = parseSubjectId(raw);
        if (parsed) return parsed;
      }
    }
  } catch {
    // No/invalid JSON body — legacy no-body callers default to math.
  }
  return fallback;
}

function cookieOpts(request: NextRequest, maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: isSecureRequest(request),
  };
}

/** Set the grade-B unlock cookie for a subject (defaults to math for legacy callers). */
export async function setSubjectGradeBUnlock(
  request: NextRequest,
  opts: { subject?: Subject } = {},
): Promise<NextResponse> {
  const subject = opts.subject ?? (await readSubject(request, "math"));
  const res = NextResponse.json({ ok: true, subject });
  res.cookies.set(subjectGradeBUnlockCookieName(subject), GRADE_B_UNLOCK_COOKIE_VALUE, cookieOpts(request, ONE_YEAR_SECONDS));
  if (subject === "math") {
    // Keep the legacy cookie in lock-step so returning users + cached clients agree.
    res.cookies.set(MATH_B_LEGACY_COOKIE, GRADE_B_UNLOCK_COOKIE_VALUE, cookieOpts(request, ONE_YEAR_SECONDS));
  }
  return res;
}

/** Clear the grade-B unlock cookie for a subject (defaults to math for legacy callers). */
export async function clearSubjectGradeBUnlock(
  request: NextRequest,
  opts: { subject?: Subject } = {},
): Promise<NextResponse> {
  const subject = opts.subject ?? (await readSubject(request, "math"));
  const res = NextResponse.json({ ok: true, subject });
  res.cookies.set(subjectGradeBUnlockCookieName(subject), "", cookieOpts(request, 0));
  if (subject === "math") {
    res.cookies.set(MATH_B_LEGACY_COOKIE, "", cookieOpts(request, 0));
  }
  return res;
}
