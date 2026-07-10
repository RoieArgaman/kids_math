import type { DayId, ExerciseId, SectionId } from "./curriculum";
import type { GradeId } from "@/lib/grades";
import type { Subject } from "@/lib/subjects";

export type AnalyticsEventName =
  | "home_viewed"
  | "grade_selected"
  | "subject_selected"
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
  | "gmat_challenge_completed"
  | "streak_updated"
  | "badge_earned"
  | "badge_unlocked"   // payload: { badgeId: string, grade: string }
  | "badges_viewed";   // payload: { grade: string, unlockedCount: number }

export interface AnalyticsEvent {
  id: string;
  schemaVersion: 1;
  name: AnalyticsEventName;
  dayId?: DayId;
  sectionId?: SectionId;
  exerciseId?: ExerciseId;
  /** Optional subject dimension — lets analytics disambiguate colliding day ids across tracks. */
  subject?: Subject;
  /** Optional grade dimension (a=Grade A / level A, b=Grade B / level B). */
  gradeId?: GradeId;
  payload?: Record<string, string | number | boolean | null>;
  timestamp: string;
}
