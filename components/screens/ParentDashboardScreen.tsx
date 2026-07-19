"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { isAdminUnlocked } from "@/lib/admin/session";
import { gradeLabel, type GradeId } from "@/lib/grades";
import type { Subject } from "@/lib/subjects";
import { subjectLabel } from "@/lib/subjects";
import { loadTrackProgress } from "@/lib/track";
import { getWorkbookDays } from "@/lib/content/workbook";
import { getEnglishDays } from "@/lib/content/english-workbook";
import { getScienceDays } from "@/lib/content/science-workbook";
import { loadReviewState } from "@/lib/review/storage";
import { loadStreakState } from "@/lib/streak/storage";
import { loadFinalExamState } from "@/lib/final-exam/storage";
import { loadEnglishFinalExamState } from "@/lib/english/final-exam/storage";
import { loadScienceFinalExamState } from "@/lib/science/final-exam/storage";
import {
  deriveAllMetrics,
  type ParentDashboardViewModels,
  type TrackInput,
  type ReviewInput,
  type ExamInput,
} from "@/lib/parent/metrics";
import { Card } from "@/components/ui/Card";
import { Tile } from "@/components/ui/Tile";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Chip } from "@/components/ui/Chip";
import { BackLink } from "@/components/ui/BackLink";
import { Ltr } from "@/components/ui/Ltr";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { formatHebrewDate, formatMinutes } from "@/lib/utils/format";

type SubjectFilter = "all" | Subject;

/** The six learning tracks, built once from localStorage reads. */
function buildViewModels(): ParentDashboardViewModels {
  const trackKeys: { subject: Subject; grade: GradeId }[] = [
    { subject: "math", grade: "a" },
    { subject: "math", grade: "b" },
    { subject: "english", grade: "a" },
    { subject: "english", grade: "b" },
    { subject: "science", grade: "a" },
    { subject: "science", grade: "b" },
  ];

  const tracks: TrackInput[] = trackKeys.map(({ subject, grade }) => {
    let progress;
    let days;
    if (subject === "math") {
      progress = loadTrackProgress({ subject: "math", grade });
      days = getWorkbookDays(grade);
    } else if (subject === "english") {
      progress = loadTrackProgress({ subject: "english" });
      days = getEnglishDays(grade);
    } else {
      progress = loadTrackProgress({ subject: "science" });
      days = getScienceDays(grade);
    }
    return { key: { subject, grade }, progress, days };
  });

  const reviews: ReviewInput[] = trackKeys.map(({ subject, grade }) => {
    const state =
      subject === "math"
        ? loadReviewState({ grade })
        : loadReviewState({ subject });
    return { key: { subject, grade }, state };
  });

  const exams: ExamInput[] = trackKeys.map(({ subject, grade }) => {
    const raw =
      subject === "math"
        ? loadFinalExamState(grade)
        : subject === "english"
          ? loadEnglishFinalExamState(grade)
          : loadScienceFinalExamState(grade);
    return {
      key: { subject, grade },
      passed: raw?.passed ?? null,
      scorePercent: raw?.scorePercent ?? null,
      submittedAt: raw?.submittedAt ?? null,
    };
  });

  const streak = loadStreakState();

  return deriveAllMetrics({ tracks, reviews, exams, streak });
}

/** Thin correctness bar. `correctPercent` is 0–100. */
function CorrectnessBar({ testId, correctPercent }: { testId: string; correctPercent: number }) {
  const clamped = Math.max(0, Math.min(100, correctPercent));
  return (
    <div
      data-testid={childTid(testId, "bar")}
      className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--track)]"
      aria-hidden
    >
      <div
        data-testid={childTid(testId, "barFill")}
        className="h-full rounded-full bg-[var(--accent-soft)]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

const SUBJECT_FILTERS: { value: SubjectFilter; label: string }[] = [
  { value: "all", label: "הכל" },
  { value: "math", label: subjectLabel("math") },
  { value: "english", label: subjectLabel("english") },
  { value: "science", label: subjectLabel("science") },
];

export function ParentDashboardScreen() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [vm, setVm] = useState<ParentDashboardViewModels | null>(null);
  const [filter, setFilter] = useState<SubjectFilter>("all");

  const rootTid = testIds.screen.parentDashboard.root();

  // Gate on admin unlock (post-hydration to avoid SSR/first-paint flash).
  useEffect(() => {
    setHydrated(true);
    if (!isAdminUnlocked()) {
      router.replace(routes.adminHub());
      return;
    }
    setUnlocked(true);
  }, [router]);

  // Compute metrics exactly once after unlock; never on render.
  useEffect(() => {
    if (!unlocked) return;
    setVm(buildViewModels());
  }, [unlocked]);

  // Sections ②–⑤ + exams may be scoped by subject. Aggregate counts in the
  // snapshot stay global; only the weak-skills + exam rows respect the filter
  // (low-risk, no recompute — we filter the already-derived view-models).
  const filteredWeakSkills = useMemo(() => {
    if (!vm) return [];
    if (filter === "all") return vm.weakSkills;
    return vm.weakSkills.filter((s) => s.subject === filter);
  }, [vm, filter]);

  const filteredExams = useMemo(() => {
    if (!vm) return [];
    if (filter === "all") return vm.examResults;
    return vm.examResults.filter((e) => e.key.subject === filter);
  }, [vm, filter]);

  if (!hydrated || !unlocked || !vm) {
    return (
      <main data-testid={rootTid} dir="rtl" className="mx-auto max-w-2xl p-6">
        <p data-testid={childTid(rootTid, "loading")} className="text-center text-sm text-[#8a8298]">
          טוען...
        </p>
      </main>
    );
  }

  const navBack = (
    <BackLink
      data-testid={testIds.screen.parentDashboard.navBack()}
      href={routes.adminHub()}
      variant="outline"
    >
      חזרה לאזור הורים
    </BackLink>
  );

  if (!vm.hasAnyData) {
    return (
      <main data-testid={rootTid} dir="rtl" className="mx-auto max-w-2xl p-6">
        <div data-testid={childTid(rootTid, "navWrap")} className="mb-4">
          {navBack}
        </div>
        <CenteredPanel
          data-testid={testIds.screen.parentDashboard.emptyState()}
          className="!min-h-0 py-16"
          emoji="🌱"
          title="עוד אין נתונים"
          description="כשהילד/ה יתחיל לתרגל, כאן יופיע מבט מלא על ההתקדמות."
        />
      </main>
    );
  }

  const { accuracy, streak, daysSections, daysSectionsByGrade, timeOnTask, reviewBacklog } = vm;
  const topWeak = vm.weakSkills[0];

  const encourageSentence =
    streak.current > 0
      ? `כבר ${streak.current} ימים ברצף — איזה כיף! 🌟`
      : topWeak
        ? `כל תרגול עוזר. כדאי לחזק קצת את ${topWeak.label} — לאט ובכיף.`
        : "כל צעד קטן הוא התקדמות גדולה. ממשיכים יחד! 🌟";

  const encourageStepLabel =
    reviewBacklog.due > 0
      ? `${reviewBacklog.due} תרגילים ממתינים לחזרה`
      : topWeak
        ? `תרגול ${topWeak.label}`
        : "להמשיך כך! 🌟";

  const snapshotTid = testIds.screen.parentDashboard.snapshot();
  const progressTid = testIds.screen.parentDashboard.progressSection();
  const weakTid = testIds.screen.parentDashboard.weakSkillsSection();
  const reviewTid = testIds.screen.parentDashboard.reviewSection();
  const encourageTid = testIds.screen.parentDashboard.encourageSection();
  const examTid = testIds.screen.parentDashboard.examSection();

  return (
    <main data-testid={rootTid} dir="rtl" className="mx-auto max-w-2xl space-y-6 p-6">
      <div data-testid={childTid(rootTid, "navWrap")}>{navBack}</div>

      {/* Subject filter */}
      <div
        role="group"
        aria-label="סינון לפי מקצוע"
        className="flex flex-wrap gap-2"
        data-testid={childTid(rootTid, "filterGroup")}
      >
        {SUBJECT_FILTERS.map((opt) => {
          const active = filter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={
                opt.value === "all"
                  ? testIds.screen.parentDashboard.subjectFilter()
                  : testIds.screen.parentDashboard.subjectFilterOption(opt.value)
              }
              onClick={() => setFilter(opt.value)}
              aria-pressed={active}
              className={[
                "min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[#e7defb] bg-white text-[var(--accent-strong)] hover:bg-[#f7f4fd]",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ① Snapshot */}
      <section data-testid={snapshotTid}>
        <SectionHeader
          data-testid={childTid(snapshotTid, "header")}
          titleTestId={childTid(snapshotTid, "title")}
          subtitleTestId={childTid(snapshotTid, "subtitle")}
          title="מבט מהיר 🌟"
          subtitle="סיכום קצר על ההתקדמות"
        />
        <div data-testid={childTid(snapshotTid, "tiles")} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile
            data-testid={testIds.screen.parentDashboard.metricAccuracy()}
            label="דיוק בניסיון ראשון"
          >
            {accuracy.overall === null ? "—" : <Ltr>{accuracy.overall}%</Ltr>}
          </Tile>
          <Tile
            data-testid={testIds.screen.parentDashboard.metricStreak()}
            label="ימים ברצף · בכל המקצועות"
          >
            <Ltr>🔥 {streak.current}</Ltr>
          </Tile>
          <Tile
            data-testid={testIds.screen.parentDashboard.metricDaysComplete()}
            label="ימים בכל המקצועות"
          >
            <Ltr>
              {daysSections.daysComplete}/{daysSections.totalDays}
            </Ltr>
          </Tile>
          <Tile
            data-testid={testIds.screen.parentDashboard.metricLastActive()}
            label="פעילות אחרונה"
          >
            <Ltr>{formatHebrewDate(vm.lastActiveIso)}</Ltr>
          </Tile>
        </div>

        {/* Per-subject accuracy */}
        <p data-testid={childTid(snapshotTid, "subjectCaption")} className="mb-2 mt-4 text-xs font-medium text-[#8a8298]">
          דיוק לפי מקצוע
        </p>
        <div data-testid={childTid(snapshotTid, "subjectTiles")} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.keys(accuracy.bySubject) as Subject[]).map((subject) => {
            const percent = accuracy.bySubject[subject];
            const testId = testIds.screen.parentDashboard.subjectAccuracy(subject);
            return (
              <div
                key={subject}
                data-testid={testId}
                className="flex items-center justify-between rounded-2xl border border-[#e7defb] bg-white/70 px-4 py-3"
              >
                <span data-testid={childTid(testId, "label")} className="text-sm font-semibold text-[#2c2348]">
                  {subjectLabel(subject)}
                </span>
                <span data-testid={childTid(testId, "value")} className="text-sm font-bold text-[var(--accent-strong)]">
                  {percent === null || percent === undefined ? "—" : <Ltr>{percent}%</Ltr>}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ② Progress over time */}
      <Card data-testid={progressTid} padding="md">
        <h2 data-testid={childTid(progressTid, "title")} className="mb-4 text-lg font-bold text-[#2c2348]">
          התקדמות לאורך זמן
        </h2>
        {/* Grade-first rollup: כיתה א׳ then כיתה ב׳ */}
        <div data-testid={childTid(progressTid, "gradeRollup")} className="mb-3 space-y-2">
          {(["a", "b"] as const).map((grade) => {
            const rollup = daysSectionsByGrade[grade];
            const rowTid = testIds.screen.parentDashboard.gradeRollupRow(grade);
            return (
              <div key={grade} data-testid={rowTid} className="flex items-center justify-between rounded-2xl border border-[#e7defb] bg-white/70 px-4 py-2 text-sm">
                <span data-testid={childTid(rowTid, "label")} className="font-semibold text-[#2c2348]">
                  כיתה {gradeLabel(grade)}
                </span>
                <span data-testid={childTid(rowTid, "value")} className="text-[#6b6577]">
                  <Ltr>
                    {rollup.daysComplete}/{rollup.totalDays}
                  </Ltr>{" "}
                  ימים ·{" "}
                  <Ltr>
                    {rollup.sectionsComplete}/{rollup.totalSections}
                  </Ltr>{" "}
                  מקטעים
                </span>
              </div>
            );
          })}
        </div>
        <div data-testid={childTid(progressTid, "rows")} className="space-y-2">
          <div data-testid={childTid(progressTid, "sectionsRow")} className="flex items-center justify-between text-sm">
            <span data-testid={childTid(progressTid, "sectionsLabel")} className="text-[#6b6577]">
              מקטעים שהושלמו
            </span>
            <span data-testid={childTid(progressTid, "sectionsValue")} className="font-bold text-[#2c2348]">
              <Ltr>
                {daysSections.sectionsComplete} / {daysSections.totalSections}
              </Ltr>
            </span>
          </div>
          <div data-testid={childTid(progressTid, "timeRow")} className="flex items-center justify-between text-sm">
            <span data-testid={childTid(progressTid, "timeLabel")} className="text-[#6b6577]">
              זמן תרגול השבוע (משוער)
            </span>
            <span data-testid={childTid(progressTid, "timeValue")} className="font-bold text-[#2c2348]">
              <Ltr>{formatMinutes(timeOnTask.approxWeeklyMs)}</Ltr>
            </span>
          </div>
        </div>
      </Card>

      {/* ③ Weak skills */}
      <Card data-testid={weakTid} padding="md">
        <h2 data-testid={childTid(weakTid, "title")} className="mb-1 text-lg font-bold text-[#2c2348]">
          מה כדאי לחזק 💪
        </h2>
        <p data-testid={childTid(weakTid, "subtitle")} className="mb-4 text-xs text-[#8a8298]">
          לפי מיומנות · ניסיון ראשון
        </p>
        {filteredWeakSkills.length === 0 ? (
          <p
            data-testid={testIds.screen.parentDashboard.weakSkillsEmpty()}
            className="text-sm text-[#8a8298]"
          >
            עוד אין מספיק נתונים כדי להעריך מיומנויות.
          </p>
        ) : (
          <ul data-testid={childTid(weakTid, "list")} className="space-y-3.5">
            {filteredWeakSkills.map((entry) => {
              const correctPercent = 100 - Math.round(entry.wrongRate * 100);
              const rowTid = testIds.screen.parentDashboard.weakSkillRow(entry.subject, entry.tag);
              return (
                <li key={`${entry.subject}-${entry.tag}`} data-testid={rowTid}>
                  <div data-testid={childTid(rowTid, "header")} className="flex items-center justify-between gap-2">
                    <span data-testid={childTid(rowTid, "label")} className="flex items-center gap-2 text-sm font-semibold text-[#2c2348]">
                      {entry.label}
                      <Chip tone="info">{subjectLabel(entry.subject)}</Chip>
                    </span>
                    <span data-testid={childTid(rowTid, "value")} className="text-sm font-bold text-[var(--accent-strong)]">
                      <Ltr>{correctPercent}% נכון</Ltr>
                    </span>
                  </div>
                  <CorrectnessBar testId={rowTid} correctPercent={correctPercent} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* ④ Review backlog */}
      <Card data-testid={reviewTid} padding="md">
        <h2 data-testid={childTid(reviewTid, "title")} className="mb-4 text-lg font-bold text-[#2c2348]">
          תרגול חוזר 🔁
        </h2>
        <div data-testid={childTid(reviewTid, "counters")} className="grid grid-cols-3 gap-3">
          <Tile
            data-testid={testIds.screen.parentDashboard.reviewDue()}
            label="ממתינים לחזרה"
            tone="warning"
          >
            <Ltr>{reviewBacklog.due}</Ltr>
          </Tile>
          <Tile
            data-testid={testIds.screen.parentDashboard.reviewPracticing()}
            label="עדיין בתרגול"
            tone="neutral"
          >
            <Ltr>{reviewBacklog.practicing}</Ltr>
          </Tile>
          <Tile
            data-testid={testIds.screen.parentDashboard.reviewMastered()}
            label="נשלטו 🎉"
            tone="success"
          >
            <Ltr>{reviewBacklog.mastered}</Ltr>
          </Tile>
        </div>
      </Card>

      {/* ⑤ Encourage next */}
      <Card data-testid={encourageTid} padding="md">
        <h2 data-testid={childTid(encourageTid, "title")} className="mb-4 text-lg font-bold text-[#2c2348]">
          מה לעודד עכשיו 🌱
        </h2>
        <p data-testid={childTid(encourageTid, "sentence")} className="mb-3 text-sm text-[#6b6577]">
          {encourageSentence}
        </p>
        <Chip
          data-testid={testIds.screen.parentDashboard.encourageStep()}
          tone="success"
          className="min-h-[44px] !px-4 !py-3 text-sm"
        >
          {encourageStepLabel}
        </Chip>
      </Card>

      {/* Exam results */}
      <Card data-testid={examTid} padding="md">
        <h2 data-testid={childTid(examTid, "title")} className="mb-4 text-lg font-bold text-[#2c2348]">
          תוצאות מבחן מסכם
        </h2>
        <ul data-testid={childTid(examTid, "list")} className="space-y-2">
          {filteredExams.map((exam) => {
            const examRowTid = testIds.screen.parentDashboard.examRow(exam.key.subject, exam.key.grade);
            const taken = exam.submittedAt !== null;
            return (
              <li
                key={`${exam.key.subject}-${exam.key.grade}`}
                data-testid={examRowTid}
                className="flex items-center justify-between gap-2 rounded-2xl border border-[#e7defb] bg-white/70 px-4 py-3"
              >
                <span data-testid={childTid(examRowTid, "label")} className="text-sm font-semibold text-[#2c2348]">
                  {subjectLabel(exam.key.subject)} · רמה {exam.key.grade.toUpperCase()}
                </span>
                {!taken ? (
                  <span data-testid={childTid(examRowTid, "pending")} className="text-sm text-[#8a8298]">
                    המבחן עוד לא נעשה
                  </span>
                ) : (
                  <span data-testid={childTid(examRowTid, "result")} className="flex items-center gap-2">
                    {exam.scorePercent !== null ? (
                      <span data-testid={childTid(examRowTid, "score")} className="text-sm font-bold text-[#2c2348]">
                        <Ltr>{exam.scorePercent}%</Ltr>
                      </span>
                    ) : null}
                    {exam.passed ? <Chip tone="success">עבר 🎉</Chip> : <Chip tone="info">הושלם</Chip>}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </main>
  );
}
