export const ADMIN_PIN = "2109";
export const ADMIN_SESSION_KEY = "kids_math.admin.v1";
export const ADMIN_TTL_MS = 60 * 60 * 1000;

type AdminSession = {
  unlockedAt: number;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function parseSession(raw: string | null): AdminSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AdminSession>;
    if (typeof parsed.unlockedAt !== "number") return null;
    return { unlockedAt: parsed.unlockedAt };
  } catch {
    return null;
  }
}

export function isAdminUnlocked(now = Date.now()): boolean {
  if (!isBrowser()) return false;
  const session = parseSession(window.sessionStorage.getItem(ADMIN_SESSION_KEY));
  if (!session) return false;
  const isValid = now - session.unlockedAt <= ADMIN_TTL_MS;
  if (!isValid) {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return false;
  }
  return true;
}

export function unlockAdminSession(pin: string): boolean {
  if (!isBrowser()) return false;
  if (pin !== ADMIN_PIN) return false;
  window.sessionStorage.setItem(
    ADMIN_SESSION_KEY,
    JSON.stringify({
      unlockedAt: Date.now(),
    } satisfies AdminSession),
  );
  return true;
}

export function clearAdminSession(): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
