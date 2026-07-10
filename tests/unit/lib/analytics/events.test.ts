import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearEvents, loadEvents, logEvent } from "@/lib/analytics/events";

const KEY = "kids_math.analytics_events.v1";

beforeEach(() => clearEvents());
afterEach(() => clearEvents());

describe("analytics events — subject/gradeId dimensions", () => {
  it("accepts and persists subject_selected with subject + gradeId", () => {
    const evt = logEvent("subject_selected", { subject: "english", gradeId: "b", payload: { grade: "b" } });
    expect(evt.name).toBe("subject_selected");
    expect(evt.subject).toBe("english");
    expect(evt.gradeId).toBe("b");

    const loaded = loadEvents();
    const found = loaded.find((e) => e.id === evt.id);
    expect(found?.subject).toBe("english");
    expect(found?.gradeId).toBe("b");
  });

  it("threads subject + gradeId onto day/answer events", () => {
    logEvent("day_completed", { dayId: "day-1", subject: "science", gradeId: "a" });
    const loaded = loadEvents();
    expect(loaded.at(-1)).toMatchObject({ name: "day_completed", subject: "science", gradeId: "a" });
  });

  it("BACK-COMPAT: old stored events without subject/gradeId still parse", () => {
    // Simulate a pre-change persisted event (schemaVersion 1, no subject/gradeId).
    const legacy = [
      {
        id: "evt_legacy",
        schemaVersion: 1,
        name: "grade_selected",
        payload: { grade: "a" },
        timestamp: new Date().toISOString(),
      },
    ];
    window.localStorage.setItem(KEY, JSON.stringify(legacy));

    const loaded = loadEvents();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatchObject({ id: "evt_legacy", name: "grade_selected" });
    expect(loaded[0].subject).toBeUndefined();
    expect(loaded[0].gradeId).toBeUndefined();
  });

  it("events without the new dimensions omit them (undefined, not null)", () => {
    const evt = logEvent("home_viewed", { payload: { grade: "a" } });
    expect(evt.subject).toBeUndefined();
    expect(evt.gradeId).toBeUndefined();
  });
});
