/**
 * Type definitions — split into domain modules for easier navigation.
 * This barrel re-exports everything so existing imports continue to work unchanged.
 *
 * For new code, prefer importing directly from the domain module:
 *   import type { WorkbookDay } from "@/lib/types/curriculum"
 *   import type { WorkbookProgressState } from "@/lib/types/progress"
 *   import type { AnalyticsEvent } from "@/lib/types/analytics"
 */
export * from "./types/index";
