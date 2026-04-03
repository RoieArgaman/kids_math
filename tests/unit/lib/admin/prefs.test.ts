import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_PREFS_STORAGE_KEY,
  loadAdminPrefs,
  saveAdminPrefs,
} from "@/lib/admin/prefs";

describe("admin prefs", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("defaults ttsEnabled to true", () => {
    expect(loadAdminPrefs()).toEqual({ ttsEnabled: true });
  });

  it("loads valid saved prefs", () => {
    localStorage.setItem(ADMIN_PREFS_STORAGE_KEY, JSON.stringify({ ttsEnabled: true }));
    expect(loadAdminPrefs()).toEqual({ ttsEnabled: true });
  });

  it("ignores invalid JSON", () => {
    localStorage.setItem(ADMIN_PREFS_STORAGE_KEY, "{");
    expect(loadAdminPrefs()).toEqual({ ttsEnabled: true });
  });

  it("merges saveAdminPrefs", () => {
    saveAdminPrefs({ ttsEnabled: true });
    expect(JSON.parse(localStorage.getItem(ADMIN_PREFS_STORAGE_KEY) ?? "{}")).toEqual({ ttsEnabled: true });
    saveAdminPrefs({ ttsEnabled: false });
    expect(loadAdminPrefs().ttsEnabled).toBe(false);
  });
});
