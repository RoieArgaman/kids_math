import type { DayId, ExerciseId, SectionId } from "./curriculum";

export type AnalyticsEventName =
  | "home_viewed"
  | "grade_selected"
  | "plan_viewed"
  | "day_card_clicked"
  | "day_viewed"
  | "answer_submitted"
  | "completion_gate_blocked"
  | "completion_gate_passed"
  | "day_completed"
  | "state_loaded"
  | "state_saved"
  | "state_load_failed"
  | "storage_quota_warning"
  | "gmat_challenge_rules_viewed"
  | "gmat_challenge_started"
  | "gmat_challenge_section_completed"
  | "gmat_challenge_completed";

export interface AnalyticsEvent {
  id: string;
  schemaVersion: 1;
  name: AnalyticsEventName;
  dayId?: DayId;
  sectionId?: SectionId;
  exerciseId?: ExerciseId;
  payload?: Record<string, string | number | boolean | null>;
  timestamp: string;
}
