import type { AnalyticsEvent, DayId } from "@/lib/types";

interface DayMetrics {
  startsProxy: number;
  completions: number;
  completionRateProxy: number;
  gateBlocked: number;
  gatePassed: number;
}

export interface AnalyticsRollups {
  perDay: Record<DayId, DayMetrics>;
  gateBlockedCount: number;
  gatePassedCount: number;
  firstPassAccuracy: number;
  attemptsPerExercise: Record<string, number>;
  dayToDayContinuation: number;
}

function toDayNumber(dayId: DayId): number | null {
  const match = /^day-(\d+)$/.exec(dayId);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

function clampRate(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function isStartProxyEvent(event: AnalyticsEvent): boolean {
  return event.name === "day_viewed" || event.name === "day_card_clicked";
}

export function computeAnalyticsRollups(events: AnalyticsEvent[]): AnalyticsRollups {
  const sortedEvents = [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const perDayAccumulator: Record<DayId, Omit<DayMetrics, "completionRateProxy">> = {};
  const attemptsPerExercise: Record<string, number> = {};
  const firstAttemptByExercise = new Map<string, boolean>();

  let gateBlockedCount = 0;
  let gatePassedCount = 0;

  const completionEvents: Array<{ dayId: DayId; timestamp: string }> = [];
  const startEventsByDayNumber = new Map<number, string[]>();

  for (const event of sortedEvents) {
    const dayId = event.dayId;
    if (dayId && !perDayAccumulator[dayId]) {
      perDayAccumulator[dayId] = {
        startsProxy: 0,
        completions: 0,
        gateBlocked: 0,
        gatePassed: 0,
      };
    }

    if (dayId && isStartProxyEvent(event)) {
      perDayAccumulator[dayId].startsProxy += 1;
      const dayNumber = toDayNumber(dayId);
      if (dayNumber !== null) {
        const existing = startEventsByDayNumber.get(dayNumber) ?? [];
        startEventsByDayNumber.set(dayNumber, [...existing, event.timestamp]);
      }
    }

    if (dayId && event.name === "day_completed") {
      perDayAccumulator[dayId].completions += 1;
      completionEvents.push({ dayId, timestamp: event.timestamp });
    }

    if (dayId && event.name === "completion_gate_blocked") {
      perDayAccumulator[dayId].gateBlocked += 1;
      gateBlockedCount += 1;
    }

    if (dayId && event.name === "completion_gate_passed") {
      perDayAccumulator[dayId].gatePassed += 1;
      gatePassedCount += 1;
    }

    if (event.name === "answer_submitted" && event.exerciseId) {
      attemptsPerExercise[event.exerciseId] =
        (attemptsPerExercise[event.exerciseId] ?? 0) + 1;

      if (!firstAttemptByExercise.has(event.exerciseId)) {
        const isCorrect = event.payload?.isCorrect;
        firstAttemptByExercise.set(event.exerciseId, isCorrect === true);
      }
    }
  }

  const perDay = Object.entries(perDayAccumulator).reduce<Record<DayId, DayMetrics>>(
    (acc, [dayId, metrics]) => {
      const starts = metrics.startsProxy;
      const completions = metrics.completions;
      acc[dayId as DayId] = {
        ...metrics,
        completionRateProxy: starts > 0 ? clampRate(completions / starts) : 0,
      };
      return acc;
    },
    {} as Record<DayId, DayMetrics>,
  );

  const firstAttempts = Array.from(firstAttemptByExercise.values());
  const firstPassAccuracy =
    firstAttempts.length > 0
      ? clampRate(firstAttempts.filter(Boolean).length / firstAttempts.length)
      : 0;

  let continuationChecks = 0;
  let continuationSuccesses = 0;
  for (const completion of completionEvents) {
    const currentDayNumber = toDayNumber(completion.dayId);
    if (currentDayNumber === null) {
      continue;
    }

    const nextDayStarts = startEventsByDayNumber.get(currentDayNumber + 1) ?? [];
    continuationChecks += 1;
    if (nextDayStarts.some((ts) => ts > completion.timestamp)) {
      continuationSuccesses += 1;
    }
  }

  const dayToDayContinuation =
    continuationChecks > 0 ? clampRate(continuationSuccesses / continuationChecks) : 0;

  return {
    perDay,
    gateBlockedCount,
    gatePassedCount,
    firstPassAccuracy,
    attemptsPerExercise,
    dayToDayContinuation,
  };
}
