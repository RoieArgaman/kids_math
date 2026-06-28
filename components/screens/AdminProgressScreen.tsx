"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BackLink } from "@/components/ui/BackLink";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { Surface } from "@/components/ui/Surface";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";
import { saveFinalExamState } from "@/lib/final-exam/storage";
import { buildAdminForcedPassedFinalExamState } from "@/lib/admin/forcedFinalExam";
import { gradeLabel, type GradeId } from "@/lib/grades";
import {
  createInitialWorkbookProgressState,
  forceMarkDayComplete,
  forceMarkSectionComplete,
  resetSectionProgress,
} from "@/lib/progress/engine";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import type { DayId, Section, SectionId, WorkbookProgressState } from "@/lib/types";
import {
  resetAdminDayProgress,
  resetAdminEnglishDayProgress,
  resetAdminScienceDayProgress,
} from "@/lib/admin/resetDayProgress";
import { subjectLabel, type LearningTrack, type Subject } from "@/lib/subjects";
import { getWorkbookDays } from "@/lib/content/workbook";
import { getEnglishDays } from "@/lib/content/english-workbook";
import { getScienceDays } from "@/lib/content/science-workbook";
import { loadTrackProgress, saveTrackProgress } from "@/lib/track";
import { clearAdminSession, isAdminUnlocked, unlockAdminSession } from "@/lib/admin/session";
import { wipeGradeBClientState } from "@/lib/admin/wipeGradeBClientState";
import { useAdminTtsEnabled } from "@/lib/hooks/useAdminTtsEnabled";

type StatusState = { kind: "success" | "error"; message: string } | null;

/** One selectable sub-track (level) within a subject. `value` is the GradeId axis ("a"/"b"). */
type SubTrackOption = { value: GradeId; label: string };

/**
 * Sub-tracks (levels) per subject. Every subject has two levels keyed on the shared
 * GradeId axis: Math/Science by Israeli grade (א׳/ב׳), English by CEFR level
 * (Pre-A1/A1 — see lib/content/english-workbook.ts). When a subject grows more
 * levels, extend its list here and the admin sub-track dropdown updates automatically.
 */
function subTrackOptions(subject: Subject): SubTrackOption[] {
  if (subject === "english") {
    return [
      { value: "a", label: "Pre-A1" },
      { value: "b", label: "A1" },
    ];
  }
  // math + science both label by Israeli grade.
  return [
    { value: "a", label: `כיתה ${gradeLabel("a")}` },
    { value: "b", label: `כיתה ${gradeLabel("b")}` },
  ];
}

function sectionStatusLabel(section: Section, dayProgress: { correctAnswers: Record<string, boolean> } | undefined): string {
  if (!dayProgress || section.exercises.length === 0) {
    return "לא הושלם";
  }
  const correct = section.exercises.filter((ex) => dayProgress.correctAnswers[ex.id] === true).length;
  if (correct === section.exercises.length) {
    return "הושלם";
  }
  if (correct === 0) {
    return "לא הושלם";
  }
  return "חלקי";
}

export function AdminProgressScreen({
  initialGrade = "a",
  initialSubject = "math",
}: {
  initialGrade?: GradeId;
  initialSubject?: Subject;
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const [selectedGrade, setSelectedGrade] = useState<GradeId>(initialGrade);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(initialSubject);
  const [progress, setProgress] = useState<WorkbookProgressState>(createInitialWorkbookProgressState);
  const [status, setStatus] = useState<StatusState>(null);
  const [resetArmedDayId, setResetArmedDayId] = useState<string | null>(null);
  /** `dayId|sectionId` when section reset confirm is armed; mutually exclusive with day reset armed. */
  const [resetArmedSectionKey, setResetArmedSectionKey] = useState<string | null>(null);
  /** Day ids whose per-section lists are expanded (default: all collapsed). */
  const [expandedDaySectionLists, setExpandedDaySectionLists] = useState<Set<DayId>>(() => new Set());
  const [resetBusy, setResetBusy] = useState(false);
  const { ttsEnabled, setTtsEnabled, hydrated: ttsHydrated } = useAdminTtsEnabled();

  function toggleDaySectionsList(dayId: DayId): void {
    setExpandedDaySectionLists((prev) => {
      const willCollapse = prev.has(dayId);
      if (willCollapse) {
        setResetArmedSectionKey((k) => (k?.startsWith(`${dayId}|`) ? null : k));
      }
      const next = new Set(prev);
      if (willCollapse) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  }

  /** Resolved learning track + its testid/storage discriminator. */
  const isMath = selectedSubject === "math";
  const track: LearningTrack =
    selectedSubject === "english"
      ? { subject: "english" }
      : selectedSubject === "science"
        ? { subject: "science" }
        : { subject: "math", grade: selectedGrade };
  /** testid token: math uses the grade ("a"/"b"); other subjects use their name ("english"/"science"). */
  const trackKey = isMath ? selectedGrade : selectedSubject;
  const subTrackLabel = subTrackOptions(selectedSubject).find((o) => o.value === selectedGrade)?.label ?? "";
  const trackLabel = isMath
    ? `כיתה ${gradeLabel(selectedGrade)}`
    : `${subjectLabel(selectedSubject)} — ${subTrackLabel}`;

  useEffect(() => {
    setSelectedGrade(initialGrade);
    setSelectedSubject(initialSubject);
    setIsUnlocked(isAdminUnlocked());
  }, [initialGrade, initialSubject]);

  useEffect(() => {
    if (!isUnlocked) return;
    setProgress(loadTrackProgress(track));
    // `track` is derived from selectedSubject/selectedGrade; those drive reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked, selectedSubject, selectedGrade]);

  // Keep the unlock alive across in-app (client-side) navigation between admin
  // screens. `pagehide` still clears it on tab close / reload / hard exit, and the
  // session carries a TTL. We deliberately do NOT clear on unmount — otherwise
  // returning to the hub (or moving to the parent dashboard) would wipe the unlock
  // and re-prompt the PIN. Back here returns to the hub (still unlocked); the
  // unlock is cleared explicitly only when leaving the admin area from the hub
  // via "חזרה למסך הראשי".
  useEffect(() => {
    const onPageHide = () => {
      clearAdminSession();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  // Days are resolved per sub-track (level): Math by grade, English/Science by their
  // level (GradeId axis). English/Science persist both levels in one store with
  // disjoint day IDs, so the level only filters which days are shown here.
  const days = useMemo(() => {
    if (selectedSubject === "english") return getEnglishDays(selectedGrade);
    if (selectedSubject === "science") return getScienceDays(selectedGrade);
    return getWorkbookDays(selectedGrade);
  }, [selectedSubject, selectedGrade]);
  const regularDays = useMemo(() => days.filter((day) => day.id !== FINAL_EXAM_DAY_ID), [days]);
  const allRegularDaysComplete = useMemo(
    () => regularDays.every((day) => Boolean(progress.days[day.id as DayId]?.isComplete)),
    [progress, regularDays],
  );

  function createSeed(): string {
    return `admin-${Date.now()}-${Math.random()}`;
  }

  function persistNext(next: WorkbookProgressState, successMessage: string): void {
    saveTrackProgress(next, track);
    setProgress(next);
    setStatus({ kind: "success", message: successMessage });
  }

  function handleRefresh(): void {
    // Soft refresh: re-read the current track's progress from storage in place.
    // A full document reload would fire `pagehide` → clearAdminSession() and
    // re-prompt for the PIN, so we deliberately avoid window.location.reload().
    setResetArmedDayId(null);
    setResetArmedSectionKey(null);
    setProgress(loadTrackProgress(track));
    setStatus({ kind: "success", message: "הנתונים עודכנו." });
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
    setResetArmedSectionKey(null);
    persistNext(next, `יום ${dayId} סומן כהושלם.`);
  }

  function handleMarkSectionComplete(dayId: string, sectionId: SectionId): void {
    const day = days.find((item) => item.id === dayId);
    if (!day) {
      return;
    }
    const next = forceMarkSectionComplete(progress, dayId as DayId, sectionId, { day });
    setResetArmedDayId(null);
    setResetArmedSectionKey(null);
    const sectionTitle = day.sections.find((s) => s.id === sectionId)?.title ?? sectionId;
    persistNext(next, `מקטע סומן כהושלם: ${sectionTitle}`);
  }

  function handleResetSection(dayId: string, section: Section): void {
    const day = days.find((item) => item.id === dayId);
    if (!day || section.exercises.length === 0) {
      return;
    }
    const totalExercises = day.sections.reduce((n, s) => n + s.exercises.length, 0);
    const exerciseIds = section.exercises.map((e) => e.id);
    const next = resetSectionProgress(progress, dayId as DayId, section.id, exerciseIds, totalExercises);
    setResetArmedSectionKey(null);
    setResetArmedDayId(null);
    persistNext(next, `מקטע אופס: ${section.title}`);
  }

  async function handleReset(dayId: string): Promise<void> {
    // English / Science: isolated stores, no final-exam / GMAT / grade-B side effects.
    if (!isMath) {
      const isolatedResult =
        selectedSubject === "english"
          ? resetAdminEnglishDayProgress(progress, dayId as DayId)
          : resetAdminScienceDayProgress(progress, dayId as DayId);
      if (!isolatedResult) {
        setResetArmedDayId(null);
        setStatus({ kind: "error", message: `היום ${dayId} לא נמצא במחברת ${trackLabel}.` });
        return;
      }
      setResetArmedDayId(null);
      setResetArmedSectionKey(null);
      persistNext(isolatedResult.nextState, `התקדמות מיום ${dayId} ועד סוף המחברת אופסה.`);
      return;
    }

    const result = resetAdminDayProgress(progress, dayId as DayId, selectedGrade);
    if (!result) {
      setResetArmedDayId(null);
      setStatus({ kind: "error", message: `היום ${dayId} לא נמצא במחברת של כיתה ${gradeLabel(selectedGrade)}.` });
      return;
    }

    const { nextState, shouldRevokeGradeBUnlock } = result;
    saveTrackProgress(nextState, track);
    setProgress(nextState);
    setResetArmedDayId(null);
    setResetArmedSectionKey(null);

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
    setResetArmedSectionKey(null);
    persistNext(next, `כל ימי הלימוד ב${trackLabel} סומנו כהושלמו.`);
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
      saveTrackProgress(nextProgress, track);
      return nextProgress;
    });
    setResetArmedDayId(null);
    setResetArmedSectionKey(null);

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
            <label data-testid={childTid(rootTid, "pinLabel")} htmlFor="admin-pin" className="block text-sm font-semibold text-[#4f4860]">
              קוד גישה
            </label>
            <input
              id="admin-pin"
              data-testid={testIds.screen.adminProgress.pinInput()}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]"
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
                className="text-sm font-semibold text-[#b91c1c]"
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
        <BackLink
          data-testid={testIds.screen.adminProgress.navBack()}
          href={routes.adminHub()}
        >
          חזרה לאזור הורים
        </BackLink>
      </div>

      <Surface data-testid={childTid(rootTid, "panel")} className="space-y-4 p-5">
        <header data-testid={childTid(rootTid, "header")} className="space-y-1">
          <h1 data-testid={childTid(rootTid, "title")} className="text-2xl font-bold text-[#2c2348]">
            ניהול התקדמות
          </h1>
          <p data-testid={childTid(rootTid, "subtitle")} className="text-sm text-[#8a8298]">
            בחרו מסלול וסמנו לכל יום אם הושלם או אופס.
          </p>
        </header>

        <div data-testid={childTid(rootTid, "body")} className="space-y-4">
          <section data-testid={childTid(rootTid, "gradeSelector")} className="flex flex-wrap gap-4 px-4">
            <div data-testid={childTid(rootTid, "subjectField")} className="min-w-[12rem] flex-1 space-y-2">
              <label
                data-testid={childTid(rootTid, "subjectLabel")}
                htmlFor="admin-subject"
                className="block text-sm font-semibold text-slate-700"
              >
                מקצוע
              </label>
              <select
                id="admin-subject"
                data-testid={testIds.screen.adminProgress.subjectSelect()}
                className="w-full max-w-md rounded-xl border border-slate-300 bg-white px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                value={selectedSubject}
                onChange={(event) => {
                  setResetArmedDayId(null);
                  setResetArmedSectionKey(null);
                  setExpandedDaySectionLists(new Set());
                  setStatus(null);
                  setSelectedSubject(event.target.value as Subject);
                  // Reset to the first sub-track (level) when switching subjects.
                  setSelectedGrade("a");
                }}
              >
                <option data-testid={childTid(rootTid, "subjectOption", "math")} value="math">
                  {subjectLabel("math")}
                </option>
                <option data-testid={childTid(rootTid, "subjectOption", "english")} value="english">
                  {subjectLabel("english")}
                </option>
                <option data-testid={childTid(rootTid, "subjectOption", "science")} value="science">
                  {subjectLabel("science")}
                </option>
              </select>
            </div>

            <div data-testid={childTid(rootTid, "subTrackField")} className="min-w-[12rem] flex-1 space-y-2">
              <label
                data-testid={childTid(rootTid, "gradeLabel")}
                htmlFor="admin-grade"
                className="block text-sm font-semibold text-slate-700"
              >
                מסלול
              </label>
              <select
                id="admin-grade"
                data-testid={testIds.screen.adminProgress.gradeSelect()}
                className="w-full max-w-md rounded-xl border border-slate-300 bg-white px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                value={selectedGrade}
                onChange={(event) => {
                  setResetArmedDayId(null);
                  setResetArmedSectionKey(null);
                  setExpandedDaySectionLists(new Set());
                  setStatus(null);
                  setSelectedGrade(event.target.value as GradeId);
                }}
              >
                {subTrackOptions(selectedSubject).map((opt) => (
                  <option
                    key={opt.value}
                    data-testid={childTid(rootTid, "gradeOption", opt.value)}
                    value={opt.value}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {ttsHydrated ? (
            <section data-testid={childTid(rootTid, "ttsPanel")} className="flex flex-wrap items-center gap-3 px-4">
              <label
                data-testid={childTid(rootTid, "ttsLabel")}
                htmlFor="admin-tts-toggle"
                className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-800"
              >
                <input
                  id="admin-tts-toggle"
                  type="checkbox"
                  data-testid={testIds.screen.adminProgress.ttsToggle()}
                  className="h-5 w-5 rounded border-slate-300"
                  checked={ttsEnabled}
                  onChange={(event) => setTtsEnabled(event.target.checked)}
                />
                השמעה אוטומטית של הנחיות בקול (למכשיר זה בלבד)
              </label>
            </section>
          ) : null}

          <section data-testid={childTid(rootTid, "gradeActions")} className="flex flex-wrap items-center gap-3 px-4">
            <Button
              data-testid={testIds.screen.adminProgress.refresh()}
              variant="outline"
              onClick={handleRefresh}
            >
              רענן נתונים
            </Button>
            <Button
              data-testid={testIds.screen.adminProgress.markAllDaysComplete(trackKey)}
              onClick={handleMarkAllDaysComplete}
            >
              סמן את כל הימים כהושלמו
            </Button>
            {isMath ? (
              <Button
                data-testid={testIds.screen.adminProgress.forceFinalExamComplete(trackKey)}
                variant="outline"
                disabled={!allRegularDaysComplete}
                onClick={() => {
                  void handleForceFinalExamComplete();
                }}
              >
                סמן מבחן מסכם כהושלם
              </Button>
            ) : null}
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
              const rowTid = testIds.screen.adminProgress.dayRow(trackKey, day.id);
              const dayIdTyped = day.id as DayId;
              const isComplete = Boolean(progress.days[dayIdTyped]?.isComplete);
              const isResetArmed = resetArmedDayId === day.id;
              const dayProgress = progress.days[dayIdTyped];
              const sectionsExpanded = expandedDaySectionLists.has(dayIdTyped);
              const sectionsPanelId = `admin-sections-panel-${trackKey}-${day.id}`;
              return (
                <article data-testid={rowTid} key={day.id} className="rounded-2xl border border-slate-200 p-4">
                  <div data-testid={childTid(rowTid, "header")} className="mb-2 flex items-start justify-between gap-3">
                    <h2 data-testid={childTid(rowTid, "title")} className="text-base font-semibold text-slate-800">
                      יום {day.dayNumber}: {day.title}
                    </h2>
                    <span
                      data-testid={testIds.screen.adminProgress.dayState(trackKey, day.id)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${isComplete ? "bg-[#d1fae5] text-[#047857]" : "bg-[#f3effb] text-[#6b6577]"}`}
                    >
                      {isComplete ? "הושלם" : "לא הושלם"}
                    </span>
                  </div>

                  <p data-testid={childTid(rowTid, "objective")} className="mb-3 text-sm text-slate-600">
                    {day.objective}
                  </p>

                  {day.sections.length > 0 ? (
                    <div
                      data-testid={childTid(rowTid, "sectionsWrap")}
                      className="mb-3 border-t border-slate-100 pt-3"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        className="mb-2 flex min-h-[44px] w-full items-center justify-between gap-2 px-3 text-sm font-semibold"
                        data-testid={testIds.screen.adminProgress.daySectionsToggle(trackKey, day.id)}
                        aria-expanded={sectionsExpanded}
                        aria-controls={sectionsPanelId}
                        onClick={() => toggleDaySectionsList(dayIdTyped)}
                      >
                        <span data-testid={childTid(rowTid, "sectionsToggleLabel")}>
                          מקטעים ({day.sections.length})
                        </span>
                        <span data-testid={childTid(rowTid, "sectionsToggleHint")}>
                          {sectionsExpanded ? "הסתר מקטעים" : "הצג מקטעים"}
                        </span>
                      </Button>
                      {sectionsExpanded ? (
                        <ul
                          id={sectionsPanelId}
                          role="region"
                          aria-label={`מקטעים ליום ${day.dayNumber}`}
                          data-testid={childTid(rowTid, "sections")}
                          className="space-y-2"
                        >
                          {day.sections.map((section) => {
                            const secRowTid = testIds.screen.adminProgress.sectionRow(trackKey, day.id, section.id);
                            const sectionKey = `${day.id}|${section.id}`;
                            const isSectionResetArmed = resetArmedSectionKey === sectionKey;
                            return (
                              <li
                                key={section.id}
                                data-testid={secRowTid}
                                className="rounded-xl bg-slate-50/80 px-3 py-2 text-right"
                              >
                                <div
                                  data-testid={childTid(secRowTid, "header")}
                                  className="mb-2 flex flex-wrap items-start justify-between gap-2"
                                >
                                  <span data-testid={childTid(secRowTid, "title")} className="text-sm font-semibold text-slate-800">
                                    {section.title}
                                  </span>
                                  <span
                                    data-testid={testIds.screen.adminProgress.sectionState(trackKey, day.id, section.id)}
                                    className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#8a8298]"
                                  >
                                    {sectionStatusLabel(section, dayProgress)}
                                  </span>
                                </div>
                                <div data-testid={childTid(secRowTid, "actions")} className="flex flex-wrap items-center gap-2">
                                  <Button
                                    data-testid={testIds.screen.adminProgress.markSectionComplete(trackKey, day.id, section.id)}
                                    className="min-h-[44px] shrink-0 text-sm"
                                    onClick={() => handleMarkSectionComplete(day.id, section.id)}
                                  >
                                    סמן מקטע
                                  </Button>
                                  {!isSectionResetArmed ? (
                                    <Button
                                      data-testid={testIds.screen.adminProgress.resetSection(trackKey, day.id, section.id)}
                                      className="min-h-[44px] shrink-0 text-sm"
                                      variant="outline"
                                      disabled={resetBusy}
                                      onClick={() => {
                                        setResetArmedDayId(null);
                                        setResetArmedSectionKey(sectionKey);
                                      }}
                                    >
                                      אפס מקטע
                                    </Button>
                                  ) : (
                                    <div data-testid={childTid(secRowTid, "resetConfirmPanel")} className="flex flex-wrap items-center gap-2">
                                      <Button
                                        data-testid={testIds.screen.adminProgress.resetSectionCancel(trackKey, day.id, section.id)}
                                        className="min-h-[44px] text-sm"
                                        variant="outline"
                                        disabled={resetBusy}
                                        onClick={() => setResetArmedSectionKey(null)}
                                      >
                                        ביטול
                                      </Button>
                                      <Button
                                        data-testid={testIds.screen.adminProgress.resetSectionConfirm(trackKey, day.id, section.id)}
                                        className="min-h-[44px] text-sm"
                                        disabled={resetBusy}
                                        onClick={() => handleResetSection(day.id, section)}
                                      >
                                        אישור איפוס מקטע
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}

                  <div data-testid={childTid(rowTid, "actions")} className="flex flex-wrap items-center gap-3">
                    <Button
                      data-testid={testIds.screen.adminProgress.markComplete(trackKey, day.id)}
                      onClick={() => handleMarkComplete(day.id)}
                    >
                      סמן כהושלם
                    </Button>

                    {!isResetArmed ? (
                      <Button
                        data-testid={testIds.screen.adminProgress.reset(trackKey, day.id)}
                        variant="outline"
                        disabled={resetBusy}
                        onClick={() => {
                          setResetArmedSectionKey(null);
                          setResetArmedDayId(day.id);
                        }}
                      >
                        אפס התקדמות יום
                      </Button>
                    ) : (
                      <div data-testid={childTid(rowTid, "resetConfirmPanel")} className="flex items-center gap-3">
                        <Button
                          data-testid={testIds.screen.adminProgress.resetCancel(trackKey, day.id)}
                          variant="outline"
                          disabled={resetBusy}
                          onClick={() => setResetArmedDayId(null)}
                        >
                          ביטול
                        </Button>
                        <Button
                          data-testid={testIds.screen.adminProgress.resetConfirm(trackKey, day.id)}
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
