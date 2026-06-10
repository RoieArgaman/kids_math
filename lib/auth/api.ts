import type { AuthUser } from "./types";

export type LoginResult = { ok: true; user: AuthUser } | { ok: false; error: string };

export async function apiLogin(username: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const data = (await res.json()) as { user: AuthUser };
      return { ok: true, user: data.user };
    }
    if (res.status === 401) {
      return { ok: false, error: "שם המשתמש או הסיסמה שגויים" };
    }
    return { ok: false, error: "שגיאה בהתחברות, נסו שוב" };
  } catch {
    return { ok: false, error: "אין חיבור לאינטרנט, נסו שוב" };
  }
}

export async function apiLogout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore — cookie will expire naturally
  }
}

export async function apiMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return null;
    return (await res.json()) as AuthUser;
  } catch {
    return null;
  }
}
