import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  flushSync,
  registerSyncCallback,
  resumeSync,
  scheduleSync,
  suspendSync,
  unregisterSyncCallback,
} from "@/lib/auth/serverSync";

describe("serverSync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    unregisterSyncCallback(); // start clean
    resumeSync(); // ensure not suspended between tests
  });

  afterEach(() => {
    unregisterSyncCallback();
    resumeSync();
    vi.useRealTimers();
  });

  describe("scheduleSync — no callback registered", () => {
    it("is a complete no-op before any registration", () => {
      const spy = vi.fn();
      scheduleSync(); // should not throw, should not call anything
      vi.runAllTimers();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("scheduleSync — callback registered", () => {
    it("fires callback after 2000ms debounce", () => {
      const spy = vi.fn();
      registerSyncCallback(spy);
      scheduleSync();
      expect(spy).not.toHaveBeenCalled(); // not yet
      vi.advanceTimersByTime(2001);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("debounces — 3 rapid calls fire callback exactly once", () => {
      const spy = vi.fn();
      registerSyncCallback(spy);
      scheduleSync();
      scheduleSync();
      scheduleSync();
      vi.advanceTimersByTime(2001);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("debounces — second call resets the timer", () => {
      const spy = vi.fn();
      registerSyncCallback(spy);
      scheduleSync();
      vi.advanceTimersByTime(1500); // not yet fired
      expect(spy).not.toHaveBeenCalled();
      scheduleSync(); // resets the 2000ms window
      vi.advanceTimersByTime(1999); // still within new window
      expect(spy).not.toHaveBeenCalled();
      vi.advanceTimersByTime(2); // now past 2000ms from second call
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("fires again on subsequent scheduleSync calls after timer fires", () => {
      const spy = vi.fn();
      registerSyncCallback(spy);
      scheduleSync();
      vi.advanceTimersByTime(2001);
      expect(spy).toHaveBeenCalledTimes(1);
      scheduleSync();
      vi.advanceTimersByTime(2001);
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe("unregisterSyncCallback", () => {
    it("prevents callback from firing after unregister", () => {
      const spy = vi.fn();
      registerSyncCallback(spy);
      scheduleSync();
      unregisterSyncCallback(); // cancel before timer fires
      vi.runAllTimers();
      expect(spy).not.toHaveBeenCalled();
    });

    it("is safe to call multiple times without error", () => {
      expect(() => {
        unregisterSyncCallback();
        unregisterSyncCallback();
        unregisterSyncCallback();
      }).not.toThrow();
    });
  });

  describe("suspendSync / resumeSync", () => {
    it("scheduleSync is a no-op while suspended (timer not armed)", () => {
      const spy = vi.fn();
      registerSyncCallback(spy);
      suspendSync();
      scheduleSync();
      vi.runAllTimers();
      expect(spy).not.toHaveBeenCalled();
    });

    it("resumes debounced sync after resumeSync", () => {
      const spy = vi.fn();
      registerSyncCallback(spy);
      suspendSync();
      scheduleSync();
      vi.runAllTimers();
      expect(spy).not.toHaveBeenCalled();

      resumeSync();
      scheduleSync();
      vi.advanceTimersByTime(2001);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("flushSync", () => {
    it("fires the callback immediately and clears the pending timer", () => {
      const spy = vi.fn();
      registerSyncCallback(spy);
      scheduleSync(); // arms 2000ms timer
      flushSync(); // should fire now, synchronously
      expect(spy).toHaveBeenCalledTimes(1);

      // Timer was cleared — advancing does not fire again.
      vi.advanceTimersByTime(5000);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("is a no-op when no timer is pending", () => {
      const spy = vi.fn();
      registerSyncCallback(spy);
      flushSync();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("registerSyncCallback — replacement", () => {
    it("replaces existing callback — only new callback fires", () => {
      const first = vi.fn();
      const second = vi.fn();
      registerSyncCallback(first);
      registerSyncCallback(second); // replaces first
      scheduleSync();
      vi.advanceTimersByTime(2001);
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });
  });
});
