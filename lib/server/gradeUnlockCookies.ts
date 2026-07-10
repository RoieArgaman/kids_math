import { NextResponse, type NextRequest } from "next/server";

import {
  GRADE_B_UNLOCK_COOKIE_VALUE,
  MATH_B_LEGACY_COOKIE,
  subjectGradeBUnlockCookieName,
} from "@/lib/gradeUnlock";
import { parseSubjectId, SUBJECTS, type Subject } from "@/lib/subjects";

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

/**
 * Parse `{ subject }` from the request body. Returns `null` when the body is
 * absent/unparseable or the subject is invalid — the caller then rejects with a
 * 400 rather than silently acting on a default subject (which would let a
 * corrupted `{subject:"science"}` POST mis-grant math). Legacy no-body callers
 * hit the shim routes, which pass an explicit `subject` and never reach here.
 */
async function readSubject(request: NextRequest): Promise<Subject | null> {
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "subject" in body) {
      const raw = (body as { subject?: unknown }).subject;
      if (typeof raw === "string") {
        return parseSubjectId(raw);
      }
    }
  } catch {
    // No/invalid JSON body.
  }
  return null;
}

function invalidSubjectResponse(): NextResponse {
  return NextResponse.json({ ok: false, error: "invalid or missing subject" }, { status: 400 });
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

/** Set the grade-B unlock cookie for a subject. Body `{subject}`; legacy shims pass it explicitly. */
export async function setSubjectGradeBUnlock(
  request: NextRequest,
  opts: { subject?: Subject } = {},
): Promise<NextResponse> {
  const subject = opts.subject ?? (await readSubject(request));
  if (!subject) return invalidSubjectResponse();
  const res = NextResponse.json({ ok: true, subject });
  res.cookies.set(subjectGradeBUnlockCookieName(subject), GRADE_B_UNLOCK_COOKIE_VALUE, cookieOpts(request, ONE_YEAR_SECONDS));
  if (subject === "math") {
    // Keep the legacy cookie in lock-step so returning users + cached clients agree.
    res.cookies.set(MATH_B_LEGACY_COOKIE, GRADE_B_UNLOCK_COOKIE_VALUE, cookieOpts(request, ONE_YEAR_SECONDS));
  }
  return res;
}

/**
 * Clear EVERY subject's grade-B unlock cookie (+ the legacy math cookie) onto an
 * existing response. Used at logout so the next student on a shared device cannot
 * inherit the prior student's unlocked Grade B; the client reconcile re-heals
 * unlock for the legit user from their own hydrated completion.
 */
export function clearAllGradeBUnlockCookies(res: NextResponse, request: NextRequest): NextResponse {
  const opts = cookieOpts(request, 0);
  for (const subject of SUBJECTS) {
    res.cookies.set(subjectGradeBUnlockCookieName(subject), "", opts);
  }
  res.cookies.set(MATH_B_LEGACY_COOKIE, "", opts);
  return res;
}

/** Clear the grade-B unlock cookie for a subject. Body `{subject}`; legacy shims pass it explicitly. */
export async function clearSubjectGradeBUnlock(
  request: NextRequest,
  opts: { subject?: Subject } = {},
): Promise<NextResponse> {
  const subject = opts.subject ?? (await readSubject(request));
  if (!subject) return invalidSubjectResponse();
  const res = NextResponse.json({ ok: true, subject });
  res.cookies.set(subjectGradeBUnlockCookieName(subject), "", cookieOpts(request, 0));
  if (subject === "math") {
    res.cookies.set(MATH_B_LEGACY_COOKIE, "", cookieOpts(request, 0));
  }
  return res;
}
