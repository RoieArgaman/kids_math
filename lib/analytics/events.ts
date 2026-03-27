import type {
  AnalyticsEvent,
  AnalyticsEventName,
  DayId,
  ExerciseId,
  SectionId,
} from "@/lib/types";

const ANALYTICS_STORAGE_KEY = "kids_math.analytics_events.v1";
const ANALYTICS_SCHEMA_VERSION = 1;
const DEFAULT_EVENT_CAP = 1000;

const VALID_EVENT_NAMES: ReadonlySet<AnalyticsEventName> = new Set<AnalyticsEventName>([
  "home_viewed",
  "grade_selected",
  "plan_viewed",
  "day_card_clicked",
  "day_viewed",
  "answer_submitted",
  "completion_gate_blocked",
  "completion_gate_passed",
  "day_completed",
  "state_loaded",
  "state_saved",
  "state_load_failed",
  "gmat_challenge_rules_viewed",
  "gmat_challenge_started",
  "gmat_challenge_section_completed",
  "gmat_challenge_completed",
]);

interface LogEventInput {
  dayId?: DayId;
  sectionId?: SectionId;
  exerciseId?: ExerciseId;
  payload?: Record<string, string | number | boolean | null>;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && VALID_EVENT_NAMES.has(value as AnalyticsEventName);
}

function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.schemaVersion === ANALYTICS_SCHEMA_VERSION &&
    isAnalyticsEventName(value.name) &&
    typeof value.timestamp === "string"
  );
}

function makeEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readEventsFromStorage(): AnalyticsEvent[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isAnalyticsEvent);
  } catch {
    return [];
  }
}

export function loadEvents(): AnalyticsEvent[] {
  return readEventsFromStorage();
}

export function saveEvents(events: AnalyticsEvent[]): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Intentionally no-op.
  }
}

export function logEvent(name: AnalyticsEventName, input: LogEventInput = {}): AnalyticsEvent {
  const event: AnalyticsEvent = {
    id: makeEventId(),
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    name,
    dayId: input.dayId,
    sectionId: input.sectionId,
    exerciseId: input.exerciseId,
    payload: input.payload,
    timestamp: new Date().toISOString(),
  };

  const events = readEventsFromStorage();
  const nextEvents = [...events, event].slice(-DEFAULT_EVENT_CAP);
  saveEvents(nextEvents);
  return event;
}

export function clearEvents(): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.removeItem(ANALYTICS_STORAGE_KEY);
  } catch {
    // Intentionally no-op.
  }
}
