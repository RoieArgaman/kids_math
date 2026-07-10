import { type NextRequest } from "next/server";

import { setSubjectGradeBUnlock } from "@/lib/server/gradeUnlockCookies";

/**
 * Legacy math-only unlock. Kept as a thin shim (subject = math) so cached clients
 * from before the subject-aware split keep working. New code posts to
 * `/api/grade-b-unlock` with an explicit `{ subject }`.
 */
export async function POST(request: NextRequest) {
  return setSubjectGradeBUnlock(request, { subject: "math" });
}
