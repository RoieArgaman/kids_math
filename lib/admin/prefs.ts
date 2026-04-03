export const ADMIN_PREFS_STORAGE_KEY = "kids_math.admin_prefs.v1";

export const ADMIN_PREFS_CHANGED_EVENT = "kids_math_admin_prefs_changed";

export type AdminPrefsV1 = {
  ttsEnabled: boolean;
};

const DEFAULT_PREFS: AdminPrefsV1 = {
  ttsEnabled: true,
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function parsePrefs(raw: string | null): AdminPrefsV1 {
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return { ...DEFAULT_PREFS };
    const ttsEnabled = (parsed as { ttsEnabled?: unknown }).ttsEnabled;
    if (typeof ttsEnabled !== "boolean") return { ...DEFAULT_PREFS };
    return { ttsEnabled };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function loadAdminPrefs(): AdminPrefsV1 {
  if (!isBrowser()) return { ...DEFAULT_PREFS };
  return parsePrefs(window.localStorage.getItem(ADMIN_PREFS_STORAGE_KEY));
}

export function saveAdminPrefs(next: Partial<AdminPrefsV1>): AdminPrefsV1 {
  if (!isBrowser()) return { ...DEFAULT_PREFS };
  const merged: AdminPrefsV1 = {
    ...loadAdminPrefs(),
    ...next,
  };
  window.localStorage.setItem(ADMIN_PREFS_STORAGE_KEY, JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent(ADMIN_PREFS_CHANGED_EVENT));
  return merged;
}
