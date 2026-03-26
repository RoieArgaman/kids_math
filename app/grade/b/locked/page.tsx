import Link from "next/link";
import { FINAL_EXAM_DAY_ID, FINAL_EXAM_GRADE } from "@/lib/final-exam/config";
import { routes } from "@/lib/routes";

export default function GradeBLockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="surface mx-auto w-full max-w-md rounded-3xl p-8 text-center shadow-lg">
        <p className="mb-2 text-6xl" aria-hidden="true">
          🔒
        </p>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">כיתה ב׳ נעולה</h1>
        <p className="mb-6 text-sm text-gray-500">
          כדי לפתוח את כיתה ב׳ צריך לסיים את המבחן המסכם של כיתה א׳ ולקבל ציון של לפחות 85.
        </p>

        <div className="space-y-3">
          <Link
            href={routes.gradeHome("a")}
            className="touch-button btn-accent inline-block w-full rounded-2xl px-6 py-3 text-center font-semibold shadow-sm"
          >
            להמשיך בכיתה א׳
          </Link>
          <Link
            href={routes.gradeDay(FINAL_EXAM_GRADE, FINAL_EXAM_DAY_ID)}
            className="touch-button inline-block w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-800 hover:bg-slate-50"
          >
            ללכת למבחן המסכם
          </Link>
        </div>
      </div>
    </main>
  );
}

