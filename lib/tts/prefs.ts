export const STUDENT_TTS_PREFS_KEY = "kids_math.tts_prefs.v1";
export const STUDENT_TTS_PREFS_CHANGED_EVENT = "kids_math_student_tts_prefs_changed";

export type StudentTtsPrefsV1 = {
  autoPlay: boolean;
};

const DEFAULT_STUDENT_TTS_PREFS: StudentTtsPrefsV1 = {
  autoPlay: false,
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function parseStudentTtsPrefs(raw: string | null): StudentTtsPrefsV1 {
  if (!raw) return { ...DEFAULT_STUDENT_TTS_PREFS };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return { ...DEFAULT_STUDENT_TTS_PREFS };
    const autoPlay = (parsed as { autoPlay?: unknown }).autoPlay;
    if (typeof autoPlay !== "boolean") return { ...DEFAULT_STUDENT_TTS_PREFS };
    return { autoPlay };
  } catch {
    return { ...DEFAULT_STUDENT_TTS_PREFS };
  }
}

export function loadStudentTtsPrefs(): StudentTtsPrefsV1 {
  if (!isBrowser()) return { ...DEFAULT_STUDENT_TTS_PREFS };
  return parseStudentTtsPrefs(window.localStorage.getItem(STUDENT_TTS_PREFS_KEY));
}

export function saveStudentTtsPrefs(next: Partial<StudentTtsPrefsV1>): StudentTtsPrefsV1 {
  if (!isBrowser()) return { ...DEFAULT_STUDENT_TTS_PREFS };
  const merged: StudentTtsPrefsV1 = { ...loadStudentTtsPrefs(), ...next };
  window.localStorage.setItem(STUDENT_TTS_PREFS_KEY, JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent(STUDENT_TTS_PREFS_CHANGED_EVENT));
  return merged;
}
