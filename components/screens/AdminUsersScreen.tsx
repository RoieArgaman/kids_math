"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { useStatusMessage } from "@/lib/hooks/useStatusMessage";
import { useAuth } from "@/lib/auth/context";
import { testIds } from "@/lib/testIds";

interface UserRecord {
  userId: string;
  username: string;
  role: "user" | "admin";
  createdAt: string;
  /** True when the account is currently in a login lockout (server-computed). */
  isLocked?: boolean;
}

export function AdminUsersScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { status: statusMsg, setStatus: setStatusMsg } = useStatusMessage<string>({
    initial: "",
    autoDismissMs: 3000,
  });

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [newOverridePolicy, setNewOverridePolicy] = useState(false);
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [changePwUserId, setChangePwUserId] = useState<string | null>(null);
  const [changePwValue, setChangePwValue] = useState("");
  const [changePwOverride, setChangePwOverride] = useState(false);
  const [changePwBusy, setChangePwBusy] = useState(false);
  const [changePwError, setChangePwError] = useState("");

  const isAdminUser = !authLoading && user?.role === "admin";

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
    if (isAdminUser) {
      void fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAdminUser, fetchUsers]);

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
            overridePolicy: newOverridePolicy,
          }),
        });
        if (res.status === 409) {
          setAddError("שם המשתמש כבר קיים");
          return;
        }
        if (res.status === 400) {
          setAddError("הסיסמה קצרה מדי (לפחות 6 תווים). לסיסמה פשוטה סמנו 'אפשר סיסמה פשוטה'.");
          return;
        }
        if (!res.ok) {
          setAddError("שגיאה ביצירת המשתמש");
          return;
        }
        setNewUsername("");
        setNewPassword("");
        setNewIsAdmin(false);
        setNewOverridePolicy(false);
        setStatusMsg("המשתמש נוסף בהצלחה ✓");
        await fetchUsers();
      } catch {
        setAddError("שגיאה ביצירת המשתמש");
      } finally {
        setAdding(false);
      }
    },
    [newUsername, newPassword, newIsAdmin, newOverridePolicy, fetchUsers, setStatusMsg],
  );

  const handleUnlock = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, action: "unlock" }),
        });
        if (!res.ok) {
          setError("שגיאה בשחרור החשבון");
          return;
        }
        setStatusMsg("החשבון שוחרר ✓");
        await fetchUsers();
      } catch {
        setError("שגיאה בשחרור החשבון");
      }
    },
    [fetchUsers, setStatusMsg],
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
        await fetchUsers();
      } catch {
        setError("שגיאה במחיקת המשתמש");
      }
    },
    [fetchUsers, setStatusMsg],
  );

  const openChangePw = useCallback((userId: string) => {
    setChangePwUserId(userId);
    setChangePwValue("");
    setChangePwOverride(false);
    setChangePwError("");
    setConfirmDeleteId(null);
  }, []);

  const cancelChangePw = useCallback(() => {
    setChangePwUserId(null);
    setChangePwValue("");
    setChangePwOverride(false);
    setChangePwError("");
  }, []);

  const handleChangePassword = useCallback(
    async (userId: string) => {
      if (!changePwValue) return;
      setChangePwBusy(true);
      setChangePwError("");
      try {
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, password: changePwValue, overridePolicy: changePwOverride }),
        });
        if (res.status === 400) {
          setChangePwError("הסיסמה קצרה מדי (לפחות 6 תווים). לסיסמה פשוטה סמנו 'אפשר סיסמה פשוטה'.");
          return;
        }
        if (!res.ok) {
          setChangePwError("שגיאה בשינוי הסיסמה");
          return;
        }
        setChangePwUserId(null);
        setChangePwValue("");
        setChangePwOverride(false);
        setStatusMsg("הסיסמה עודכנה ✓");
      } catch {
        setChangePwError("שגיאה בשינוי הסיסמה");
      } finally {
        setChangePwBusy(false);
      }
    },
    [changePwValue, changePwOverride, setStatusMsg],
  );

  if (!isAdminUser) {
    return (
      <main data-testid={testIds.component.adminUsers.root()} className="p-6 text-center">
        <p data-testid="km.autogen.adminusersscreen.node.idx.0" className="text-slate-600">אין הרשאה לעמוד זה</p>
      </main>
    );
  }

  return (
    <main data-testid={testIds.component.adminUsers.root()} className="mx-auto max-w-2xl p-6">
      <h1 data-testid="km.autogen.adminusersscreen.node.idx.1" className="mb-6 text-2xl font-bold text-slate-800">ניהול משתמשים</h1>

      {statusMsg && (
        <Alert data-testid="km.autogen.adminusersscreen.node.idx.2" tone="success" className="mb-4">
          {statusMsg}
        </Alert>
      )}

      {/* Add user form */}
      <section data-testid="km.autogen.adminusersscreen.node.idx.3" className="surface mb-6 rounded-2xl p-5">
        <h2 data-testid="km.autogen.adminusersscreen.node.idx.4" className="mb-4 text-lg font-bold text-slate-700">הוספת משתמש חדש</h2>
        <form
          data-testid={testIds.component.adminUsers.addForm()}
          onSubmit={handleAdd}
          noValidate
        >
          <Field
            data-testid="km.autogen.adminusersscreen.node.idx.5"
            labelTestId="km.autogen.adminusersscreen.node.idx.6"
            label="שם משתמש"
          >
            <input
              data-testid={testIds.component.adminUsers.usernameInput()}
              type="text"
              dir="ltr"
              value={newUsername}
              onChange={(e) => { setNewUsername(e.target.value); setAddError(""); }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#a78bfa] focus:outline-hidden focus:ring-2 focus:ring-[#cdbff2]"
              disabled={adding}
            />
          </Field>
          <Field
            data-testid="km.autogen.adminusersscreen.node.idx.7"
            labelTestId="km.autogen.adminusersscreen.node.idx.8"
            label="סיסמה"
          >
            <input
              data-testid={testIds.component.adminUsers.passwordInput()}
              type="text"
              dir="ltr"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setAddError(""); }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#a78bfa] focus:outline-hidden focus:ring-2 focus:ring-[#cdbff2]"
              disabled={adding}
            />
          </Field>
          <div data-testid="km.autogen.adminusersscreen.node.idx.9" className="mb-4 flex items-center gap-2">
            <input
              data-testid={testIds.component.adminUsers.adminToggle()}
              id="km-new-user-admin"
              type="checkbox"
              checked={newIsAdmin}
              onChange={(e) => setNewIsAdmin(e.target.checked)}
              className="h-4 w-4 rounded-sm accent-[#8b75cc]"
              disabled={adding}
            />
            <label data-testid="km.autogen.adminusersscreen.node.idx.10" htmlFor="km-new-user-admin" className="text-sm font-medium text-slate-700">
              הרשאות מנהל
            </label>
          </div>

          <div data-testid="km.autogen.adminusersscreen.node.overridewrap" className="mb-4 flex items-center gap-2">
            <input
              data-testid={testIds.component.adminUsers.overridePolicyToggle()}
              id="km-new-user-override"
              type="checkbox"
              checked={newOverridePolicy}
              onChange={(e) => { setNewOverridePolicy(e.target.checked); setAddError(""); }}
              className="h-4 w-4 rounded-sm accent-[#8b75cc]"
              disabled={adding}
            />
            <label data-testid="km.autogen.adminusersscreen.node.overridelabel" htmlFor="km-new-user-override" className="text-sm font-medium text-slate-700">
              אפשר סיסמה פשוטה (למשל קוד ספרתי לילד)
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
                className="py-3"
              >
                <div data-testid="km.autogen.adminusersscreen.node.idx.18" className="flex items-center justify-between gap-3">
                  <div data-testid="km.autogen.adminusersscreen.node.idx.19" className="min-w-0">
                    <p data-testid="km.autogen.adminusersscreen.node.idx.20" className="flex items-center gap-2 truncate font-semibold text-slate-800" dir="ltr">
                      <span data-testid="km.autogen.adminusersscreen.node.uname" className="truncate">{u.username}</span>
                      {u.isLocked && (
                        <span
                          data-testid={testIds.component.adminUsers.lockedBadge(u.userId)}
                          className="shrink-0 rounded-full bg-[#fef3c7] px-2 py-0.5 text-[11px] font-semibold text-[#92400e]"
                          dir="rtl"
                        >
                          🔒 נעול
                        </span>
                      )}
                    </p>
                    <p data-testid="km.autogen.adminusersscreen.node.idx.21" className="text-xs text-slate-500">
                      {u.role === "admin" ? "מנהל" : "משתמש"} · {new Date(u.createdAt).toLocaleDateString("he-IL")}
                    </p>
                  </div>

                  {confirmDeleteId === u.userId ? (
                    <div data-testid="km.autogen.adminusersscreen.node.idx.22" className="flex shrink-0 gap-2">
                      <button
                        data-testid={testIds.component.adminUsers.deleteConfirm(u.userId)}
                        onClick={() => handleDelete(u.userId)}
                        className="rounded-lg bg-[#dc2626] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#b91c1c]"
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
                  ) : changePwUserId !== u.userId ? (
                    <div data-testid="km.autogen.adminusersscreen.node.idx.23" className="flex shrink-0 gap-2">
                      {u.isLocked && (
                        <button
                          data-testid={testIds.component.adminUsers.unlockButton(u.userId)}
                          onClick={() => handleUnlock(u.userId)}
                          className="rounded-lg border border-[#fcd34d] bg-[#fffbeb] px-3 py-1.5 text-xs font-semibold text-[#92400e] hover:bg-[#fef3c7]"
                        >
                          שחרר חשבון
                        </button>
                      )}
                      <button
                        data-testid={testIds.component.adminUsers.changePasswordButton(u.userId)}
                        onClick={() => openChangePw(u.userId)}
                        className="rounded-lg border border-[#e7defb] px-3 py-1.5 text-xs font-semibold text-[#6d28d9] hover:bg-[#f3effb]"
                      >
                        שנה סיסמה
                      </button>
                      <button
                        data-testid={testIds.component.adminUsers.deleteButton(u.userId)}
                        onClick={() => setConfirmDeleteId(u.userId)}
                        disabled={u.userId === user?.userId}
                        className="rounded-lg border border-[#fecaca] px-3 py-1.5 text-xs font-semibold text-[#dc2626] hover:bg-red-50 disabled:opacity-40"
                      >
                        מחק
                      </button>
                    </div>
                  ) : null}
                </div>

                {changePwUserId === u.userId && (
                  <div data-testid="km.autogen.adminusersscreen.node.idx.24" className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      data-testid={testIds.component.adminUsers.changePasswordInput(u.userId)}
                      type="text"
                      dir="ltr"
                      placeholder="סיסמה חדשה"
                      value={changePwValue}
                      onChange={(e) => { setChangePwValue(e.target.value); setChangePwError(""); }}
                      className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:border-[#a78bfa] focus:outline-hidden focus:ring-2 focus:ring-[#cdbff2]"
                      disabled={changePwBusy}
                      autoFocus
                    />
                    <button
                      data-testid={testIds.component.adminUsers.changePasswordSubmit(u.userId)}
                      onClick={() => handleChangePassword(u.userId)}
                      disabled={!changePwValue || changePwBusy}
                      className="rounded-lg bg-[#8b75cc] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7c6fcd] disabled:opacity-50"
                    >
                      {changePwBusy ? "..." : "שמור"}
                    </button>
                    <button
                      data-testid={testIds.component.adminUsers.changePasswordCancel(u.userId)}
                      onClick={cancelChangePw}
                      disabled={changePwBusy}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      ביטול
                    </button>
                    <label data-testid={`km.autogen.adminusersscreen.node.pwoverride.${u.userId}`} className="flex w-full items-center gap-2 text-xs font-medium text-slate-600">
                      <input
                        data-testid={testIds.component.adminUsers.changePasswordOverride(u.userId)}
                        type="checkbox"
                        checked={changePwOverride}
                        onChange={(e) => { setChangePwOverride(e.target.checked); setChangePwError(""); }}
                        className="h-4 w-4 rounded-sm accent-[#8b75cc]"
                        disabled={changePwBusy}
                      />
                      אפשר סיסמה פשוטה
                    </label>
                    {changePwError && (
                      <p data-testid="km.autogen.adminusersscreen.node.idx.25" className="text-xs font-medium text-red-600">{changePwError}</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
