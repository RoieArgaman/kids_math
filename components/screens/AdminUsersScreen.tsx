"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { isAdminUnlocked } from "@/lib/admin/session";
import { testIds } from "@/lib/testIds";
import { routes } from "@/lib/routes";

interface UserRecord {
  userId: string;
  username: string;
  role: "user" | "admin";
  createdAt: string;
}

export function AdminUsersScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isAdminUser = !authLoading && user?.role === "admin";
  const pinOk = isAdminUnlocked();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        setError("אין הרשאה לצפות במשתמשים");
        return;
      }
      setUsers((await res.json()) as UserRecord[]);
    } catch {
      setError("שגיאה בטעינת המשתמשים");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminUser && pinOk) {
      void fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAdminUser, pinOk, fetchUsers]);

  const handleAdd = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUsername.trim() || !newPassword) return;
      setAddError("");
      setAdding(true);
      try {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: newUsername.trim(),
            password: newPassword,
            role: newIsAdmin ? "admin" : "user",
          }),
        });
        if (res.status === 409) {
          setAddError("שם המשתמש כבר קיים");
          return;
        }
        if (!res.ok) {
          setAddError("שגיאה ביצירת המשתמש");
          return;
        }
        setNewUsername("");
        setNewPassword("");
        setNewIsAdmin(false);
        setStatusMsg("המשתמש נוסף בהצלחה ✓");
        setTimeout(() => setStatusMsg(""), 3000);
        await fetchUsers();
      } catch {
        setAddError("שגיאה ביצירת המשתמש");
      } finally {
        setAdding(false);
      }
    },
    [newUsername, newPassword, newIsAdmin, fetchUsers],
  );

  const handleDelete = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch("/api/admin/users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (!res.ok) {
          setError("שגיאה במחיקת המשתמש");
          return;
        }
        setConfirmDeleteId(null);
        setStatusMsg("המשתמש נמחק ✓");
        setTimeout(() => setStatusMsg(""), 3000);
        await fetchUsers();
      } catch {
        setError("שגיאה במחיקת המשתמש");
      }
    },
    [fetchUsers],
  );

  if (!isAdminUser || !pinOk) {
    return (
      <main data-testid={testIds.component.adminUsers.root()} className="p-6 text-center">
        <p data-testid="km.autogen.adminusersscreen.node.idx.0" className="mb-3 text-slate-600">
          {!isAdminUser ? "אין הרשאה לעמוד זה" : "נדרשת כניסת PIN של מנהל"}
        </p>
        {isAdminUser && !pinOk && (
          <Link
            href={routes.adminProgress()}
            className="text-sm font-semibold text-violet-600 hover:underline"
          >
            כניסה עם PIN ←
          </Link>
        )}
      </main>
    );
  }

  return (
    <main data-testid={testIds.component.adminUsers.root()} className="mx-auto max-w-2xl p-6">
      <h1 data-testid="km.autogen.adminusersscreen.node.idx.1" className="mb-6 text-2xl font-bold text-slate-800">ניהול משתמשים</h1>

      {statusMsg && (
        <p data-testid="km.autogen.adminusersscreen.node.idx.2" className="mb-4 rounded-xl bg-green-50 px-4 py-2.5 text-center text-sm font-medium text-green-700">
          {statusMsg}
        </p>
      )}

      {/* Add user form */}
      <section data-testid="km.autogen.adminusersscreen.node.idx.3" className="surface mb-6 rounded-2xl p-5">
        <h2 data-testid="km.autogen.adminusersscreen.node.idx.4" className="mb-4 text-lg font-bold text-slate-700">הוספת משתמש חדש</h2>
        <form
          data-testid={testIds.component.adminUsers.addForm()}
          onSubmit={handleAdd}
          noValidate
        >
          <div data-testid="km.autogen.adminusersscreen.node.idx.5" className="mb-3">
            <label data-testid="km.autogen.adminusersscreen.node.idx.6" className="mb-1 block text-sm font-semibold text-slate-600">שם משתמש</label>
            <input
              data-testid={testIds.component.adminUsers.usernameInput()}
              type="text"
              dir="ltr"
              value={newUsername}
              onChange={(e) => { setNewUsername(e.target.value); setAddError(""); }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
              disabled={adding}
            />
          </div>
          <div data-testid="km.autogen.adminusersscreen.node.idx.7" className="mb-3">
            <label data-testid="km.autogen.adminusersscreen.node.idx.8" className="mb-1 block text-sm font-semibold text-slate-600">סיסמה</label>
            <input
              data-testid={testIds.component.adminUsers.passwordInput()}
              type="text"
              dir="ltr"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setAddError(""); }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
              disabled={adding}
            />
          </div>
          <div data-testid="km.autogen.adminusersscreen.node.idx.9" className="mb-4 flex items-center gap-2">
            <input
              data-testid={testIds.component.adminUsers.adminToggle()}
              id="km-new-user-admin"
              type="checkbox"
              checked={newIsAdmin}
              onChange={(e) => setNewIsAdmin(e.target.checked)}
              className="h-4 w-4 rounded accent-violet-600"
              disabled={adding}
            />
            <label data-testid="km.autogen.adminusersscreen.node.idx.10" htmlFor="km-new-user-admin" className="text-sm font-medium text-slate-700">
              הרשאות מנהל
            </label>
          </div>

          {addError && (
            <p data-testid="km.autogen.adminusersscreen.node.idx.11" className="mb-3 text-sm font-medium text-red-600">{addError}</p>
          )}

          <button
            data-testid={testIds.component.adminUsers.submitButton()}
            type="submit"
            disabled={!newUsername.trim() || !newPassword || adding}
            className="touch-button btn-accent disabled:opacity-50"
          >
            {adding ? "מוסיף..." : "הוסף משתמש"}
          </button>
        </form>
      </section>

      {/* User list */}
      <section data-testid="km.autogen.adminusersscreen.node.idx.12" className="surface rounded-2xl p-5">
        <h2 data-testid="km.autogen.adminusersscreen.node.idx.13" className="mb-4 text-lg font-bold text-slate-700">
          משתמשים רשומים {!loading && `(${users.length})`}
        </h2>

        {error && <p data-testid="km.autogen.adminusersscreen.node.idx.14" className="mb-3 text-sm font-medium text-red-600">{error}</p>}

        {loading ? (
          <p data-testid="km.autogen.adminusersscreen.node.idx.15" className="text-center text-sm text-slate-500">טוען...</p>
        ) : users.length === 0 ? (
          <p data-testid="km.autogen.adminusersscreen.node.idx.16" className="text-center text-sm text-slate-500">אין משתמשים עדיין</p>
        ) : (
          <ul data-testid="km.autogen.adminusersscreen.node.idx.17" className="divide-y divide-slate-100">
            {users.map((u) => (
              <li
                key={u.userId}
                data-testid={testIds.component.adminUsers.userRow(u.userId)}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div data-testid="km.autogen.adminusersscreen.node.idx.18" className="min-w-0">
                  <p data-testid="km.autogen.adminusersscreen.node.idx.19" className="truncate font-semibold text-slate-800" dir="ltr">{u.username}</p>
                  <p data-testid="km.autogen.adminusersscreen.node.idx.20" className="text-xs text-slate-500">
                    {u.role === "admin" ? "מנהל" : "משתמש"} · {new Date(u.createdAt).toLocaleDateString("he-IL")}
                  </p>
                </div>

                {confirmDeleteId === u.userId ? (
                  <div data-testid="km.autogen.adminusersscreen.node.idx.21" className="flex shrink-0 gap-2">
                    <button
                      data-testid={testIds.component.adminUsers.deleteConfirm(u.userId)}
                      onClick={() => handleDelete(u.userId)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      אשר מחיקה
                    </button>
                    <button
                      data-testid={testIds.component.adminUsers.deleteCancel(u.userId)}
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      ביטול
                    </button>
                  </div>
                ) : (
                  <button
                    data-testid={testIds.component.adminUsers.deleteButton(u.userId)}
                    onClick={() => setConfirmDeleteId(u.userId)}
                    disabled={u.userId === user?.userId}
                    className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                  >
                    מחק
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
