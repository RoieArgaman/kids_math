"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { Surface } from "@/components/ui/Surface";
import { getWorkbookDays } from "@/lib/content/workbook";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";
import { saveFinalExamState } from "@/lib/final-exam/storage";
import { buildAdminForcedPassedFinalExamState } from "@/lib/admin/forcedFinalExam";
import { gradeLabel, type GradeId } from "@/lib/grades";
import { forceMarkDayComplete, createInitialWorkbookProgressState } from "@/lib/progress/engine";
import { loadProgressState, saveProgressState } from "@/lib/progress/storage";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import type { DayId, WorkbookProgressState } from "@/lib/types";
import { resetAdminDayProgress } from "@/lib/admin/resetDayProgress";
import { clearAdminSession, isAdminUnlocked, unlockAdminSession } from "@/lib/admin/session";
import { wipeGradeBClientState } from "@/lib/admin/wipeGradeBClientState";

type StatusState = { kind: "success" | "error"; message: string } | null;

export function AdminProgressScreen({ initialGrade = "a" }: { initialGrade?: GradeId }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const [selectedGrade, setSelectedGrade] = useState<GradeId>(initialGrade);
  const [progress, setProgress] = useState<WorkbookProgressState>(createInitialWorkbookProgressState);
  const [status, setStatus] = useState<StatusState>(null);
  const [resetArmedDayId, setResetArmedDayId] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    setSelectedGrade(initialGrade);
    setIsUnlocked(isAdminUnlocked());
  }, [initialGrade]);

  useEffect(() => {
    if (!isUnlocked) return;
    setProgress(loadProgressState({ grade: selectedGrade }));
  }, [isUnlocked, selectedGrade]);

  useEffect(() => {
    const onPageHide = () => {
      clearAdminSession();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      clearAdminSession();
    };
  }, []);

  const days = useMemo(() => getWorkbookDays(selectedGrade), [selectedGrade]);
  const regularDays = useMemo(() => days.filter((day) => day.id !== FINAL_EXAM_DAY_ID), [days]);
  const allRegularDaysComplete = useMemo(
    () => regularDays.every((day) => Boolean(progress.days[day.id as DayId]?.isComplete)),
    [progress, regularDays],
  );

  function createSeed(): string {
    return `admin-${Date.now()}-${Math.random()}`;
  }

  function persistNext(next: WorkbookProgressState, successMessage: string): void {
    saveProgressState(next, { grade: selectedGrade });
    setProgress(next);
    setStatus({ kind: "success", message: successMessage });
  }

  function handlePinSubmit(): void {
    const ok = unlockAdminSession(pin);
    if (!ok) {
      setPinError("PIN שגוי, נסו שוב.");
      setStatus({ kind: "error", message: "הגישה נדחתה. הקוד שהוקלד שגוי." });
      return;
    }
    setPinError("");
    setPin("");
    setIsUnlocked(true);
    setStatus({ kind: "success", message: "גישה אושרה. אפשר לערוך התקדמות." });
  }

  function handleMarkComplete(dayId: string): void {
    if (dayId === FINAL_EXAM_DAY_ID) {
      void handleForceFinalExamComplete();
      return;
    }
    const day = days.find((item) => item.id === dayId);
    const next = forceMarkDayComplete(progress, dayId as DayId, { day, fillAnswers: true });
    setResetArmedDayId(null);
    persistNext(next, `יום ${dayId} סומן כהושלם.`);
  }

  async function handleReset(dayId: string): Promise<void> {
    const result = resetAdminDayProgress(progress, dayId as DayId, selectedGrade);
    if (!result) {
      setResetArmedDayId(null);
      setStatus({ kind: "error", message: `היום ${dayId} לא נמצא במחברת של כיתה ${gradeLabel(selectedGrade)}.` });
      return;
    }

    const { nextState, shouldRevokeGradeBUnlock } = result;
    saveProgressState(nextState, { grade: selectedGrade });
    setProgress(nextState);
    setResetArmedDayId(null);

    const baseMessage = `התקדמות מיום ${dayId} ועד סוף המחברת אופסה.`;

    if (!shouldRevokeGradeBUnlock) {
      setStatus({ kind: "success", message: baseMessage });
      return;
    }

    setResetBusy(true);
    try {
      const response = await fetch("/api/lock-grade-b", { method: "POST" });
      if (!response.ok) {
        setStatus({
          kind: "error",
          message: `${baseMessage} האיפוס נשמר, אבל נעילת כיתה ב׳ נכשלה (קוד ${response.status}). נסו שוב או רעננו את הדף.`,
        });
        return;
      }
      wipeGradeBClientState();
      setStatus({
        kind: "success",
        message: `${baseMessage} כיתה ב׳ ננעלה בדפדפן זה וכל ההתקדמות השמורה שלה נמחקה.`,
      });
    } catch {
      setStatus({
        kind: "error",
        message: `${baseMessage} האיפוס נשמר, אבל נעילת כיתה ב׳ נכשלה (בעיית רשת). נסו שוב.`,
      });
    } finally {
      setResetBusy(false);
    }
  }

  function handleMarkAllDaysComplete(): void {
    const next = regularDays.reduce(
      (acc, day) => forceMarkDayComplete(acc, day.id as DayId, { day, fillAnswers: true }),
      progress,
    );
    setResetArmedDayId(null);
    persistNext(next, `כל ימי הלימוד בכיתה ${gradeLabel(selectedGrade)} סומנו כהושלמו.`);
  }

  async function handleForceFinalExamComplete(): Promise<void> {
    if (!allRegularDaysComplete) {
      setStatus({
        kind: "error",
        message: "אפשר לסמן מבחן מסכם כהושלם רק אחרי שכל ימי הלימוד הושלמו.",
      });
      return;
    }

    const examDay = days.find((d) => d.id === FINAL_EXAM_DAY_ID);
    if (!examDay) {
      setStatus({
        kind: "error",
        message: "לא נמצא יום מבחן מסכם במחברת.",
      });
      return;
    }

    const passedExam = buildAdminForcedPassedFinalExamState({
      grade: selectedGrade,
      seed: createSeed(),
    });
    saveFinalExamState(selectedGrade, passedExam);

    if (selectedGrade === "a") {
      await fetch("/api/unlock-grade-b", { method: "POST" });
    }

    setProgress((prev) => {
      const nextProgress = forceMarkDayComplete(prev, FINAL_EXAM_DAY_ID, {
        day: examDay,
        fillAnswers: true,
      });
      saveProgressState(nextProgress, { grade: selectedGrade });
      return nextProgress;
    });
    setResetArmedDayId(null);

    setStatus({
      kind: "success",
      message: `המבחן המסכם לכיתה ${gradeLabel(selectedGrade)} סומן כהושלם.`,
    });
  }

  const rootTid = testIds.screen.adminProgress.root();

  if (!isUnlocked) {
    return (
      <CenteredPanel
        data-testid={rootTid}
        emoji="🔐"
        title="גישת אדמין"
        description="הכניסו קוד גישה כדי לנהל התקדמות ימים."
        actions={
          <div data-testid={childTid(rootTid, "pinPanel")} className="space-y-3 text-right">
            <label data-testid={childTid(rootTid, "pinLabel")} htmlFor="admin-pin" className="block text-sm font-semibold text-slate-700">
              קוד גישה
            </label>
            <input
              id="admin-pin"
              data-testid={testIds.screen.adminProgress.pinInput()}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              type="password"
              inputMode="numeric"
              dir="ltr"
              autoComplete="off"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handlePinSubmit();
              }}
              aria-invalid={pinError ? "true" : "false"}
              aria-describedby={pinError ? "admin-pin-error" : undefined}
            />
            {pinError ? (
              <p
                id="admin-pin-error"
                data-testid={testIds.screen.adminProgress.pinError()}
                className="text-sm font-semibold text-rose-700"
              >
                {pinError}
              </p>
            ) : null}
            <Button data-testid={testIds.screen.adminProgress.pinSubmit()} className="w-full" onClick={handlePinSubmit}>
              כניסה
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <main data-testid={rootTid} className="pb-10">
      <div data-testid={childTid(rootTid, "topNav")} className="mb-4 flex items-center gap-3">
        <ButtonLink data-testid={testIds.screen.adminProgress.navBack()} href={routes.gradePicker()}>
          חזרה למסך הראשי
        </ButtonLink>
      </div>

      <Surface data-testid={childTid(rootTid, "panel")} className="space-y-4 p-5">
        <header data-testid={childTid(rootTid, "header")} className="space-y-1">
          <h1 data-testid={childTid(rootTid, "title")} className="text-2xl font-bold text-slate-800">
            ניהול התקדמות
          </h1>
          <p data-testid={childTid(rootTid, "subtitle")} className="text-sm text-slate-600">
            בחרו כיתה וסמנו לכל יום אם הושלם או אופס.
          </p>
        </header>

        <div data-testid={childTid(rootTid, "body")} className="space-y-4">
          <section data-testid={childTid(rootTid, "gradeSelector")} className="space-y-2 px-4">
            <label data-testid={childTid(rootTid, "gradeLabel")} htmlFor="admin-grade" className="block text-sm font-semibold text-slate-700">
              כיתה
            </label>
            <select
              id="admin-grade"
              data-testid={testIds.screen.adminProgress.gradeSelect()}
              className="w-full max-w-md rounded-xl border border-slate-300 bg-white px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              value={selectedGrade}
              onChange={(event) => {
                setResetArmedDayId(null);
                setStatus(null);
                setSelectedGrade(event.target.value as GradeId);
              }}
            >
              <option data-testid={childTid(rootTid, "gradeOption", "a")} value="a">
                כיתה {gradeLabel("a")}
              </option>
              <option data-testid={childTid(rootTid, "gradeOption", "b")} value="b">
                כיתה {gradeLabel("b")}
              </option>
            </select>
          </section>

          <section data-testid={childTid(rootTid, "gradeActions")} className="flex flex-wrap items-center gap-3 px-4">
            <Button
              data-testid={testIds.screen.adminProgress.markAllDaysComplete(selectedGrade)}
              onClick={handleMarkAllDaysComplete}
            >
              סמן את כל הימים כהושלמו
            </Button>
            <Button
              data-testid={testIds.screen.adminProgress.forceFinalExamComplete(selectedGrade)}
              variant="outline"
              disabled={!allRegularDaysComplete}
              onClick={() => {
                void handleForceFinalExamComplete();
              }}
            >
              סמן מבחן מסכם כהושלם
            </Button>
          </section>

          <div data-testid={childTid(rootTid, "statusSlot")} className="min-h-6 px-4" role="status" aria-live="polite">
            {status ? (
              <p
                data-testid={testIds.screen.adminProgress.statusMessage()}
                className={`text-sm font-medium ${status.kind === "error" ? "text-rose-700" : "text-slate-700"}`}
              >
                {status.message}
              </p>
            ) : null}
          </div>

          <section data-testid={childTid(rootTid, "daysList")} className="space-y-3">
            {days.map((day) => {
              const rowTid = testIds.screen.adminProgress.dayRow(selectedGrade, day.id);
              const isComplete = Boolean(progress.days[day.id as DayId]?.isComplete);
              const isResetArmed = resetArmedDayId === day.id;
              return (
                <article data-testid={rowTid} key={day.id} className="rounded-2xl border border-slate-200 p-4">
                  <div data-testid={childTid(rowTid, "header")} className="mb-2 flex items-start justify-between gap-3">
                    <h2 data-testid={childTid(rowTid, "title")} className="text-base font-semibold text-slate-800">
                      יום {day.dayNumber}: {day.title}
                    </h2>
                    <span
                      data-testid={testIds.screen.adminProgress.dayState(selectedGrade, day.id)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${isComplete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}
                    >
                      {isComplete ? "הושלם" : "לא הושלם"}
                    </span>
                  </div>

                  <p data-testid={childTid(rowTid, "objective")} className="mb-3 text-sm text-slate-600">
                    {day.objective}
                  </p>

                  <div data-testid={childTid(rowTid, "actions")} className="flex flex-wrap items-center gap-3">
                    <Button
                      data-testid={testIds.screen.adminProgress.markComplete(selectedGrade, day.id)}
                      onClick={() => handleMarkComplete(day.id)}
                    >
                      סמן כהושלם
                    </Button>

                    {!isResetArmed ? (
                      <Button
                        data-testid={testIds.screen.adminProgress.reset(selectedGrade, day.id)}
                        variant="outline"
                        disabled={resetBusy}
                        onClick={() => setResetArmedDayId(day.id)}
                      >
                        אפס התקדמות יום
                      </Button>
                    ) : (
                      <div data-testid={childTid(rowTid, "resetConfirmPanel")} className="flex items-center gap-3">
                        <Button
                          data-testid={testIds.screen.adminProgress.resetCancel(selectedGrade, day.id)}
                          variant="outline"
                          disabled={resetBusy}
                          onClick={() => setResetArmedDayId(null)}
                        >
                          ביטול
                        </Button>
                        <Button
                          data-testid={testIds.screen.adminProgress.resetConfirm(selectedGrade, day.id)}
                          disabled={resetBusy}
                          onClick={() => {
                            void handleReset(day.id);
                          }}
                        >
                          אישור איפוס
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </Surface>
    </main>
  );
}
