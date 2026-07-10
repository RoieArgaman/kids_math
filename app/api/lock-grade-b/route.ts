import { type NextRequest } from "next/server";

import { clearSubjectGradeBUnlock } from "@/lib/server/gradeUnlockCookies";

/**
 * Legacy math-only lock. Kept as a thin shim (subject = math) so cached clients
 * keep working. New code posts to `/api/grade-b-lock` with an explicit `{ subject }`.
 */
export async function POST(request: NextRequest) {
  return clearSubjectGradeBUnlock(request, { subject: "math" });
}
