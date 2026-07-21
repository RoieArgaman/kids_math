"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
  /** Absent on every pre-Phase-3 doc, which must read as active. */
  status?: "active" | "deactivated" | "deleted";
}

function isDeleted(u: UserRecord): boolean {
  return u.status === "deleted";
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
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [changePwUserId, setChangePwUserId] = useState<string | null>(null);
  const [changePwValue, setChangePwValue] = useState("");
  const [changePwOverride, setChangePwOverride] = useState(false);
  const [changePwBusy, setChangePwBusy] = useState(false);
  const [changePwError, setChangePwError] = useState("");

  const isAdminUser = !authLoading && user?.role === "admin";

  // Deleted accounts are hidden by default so the everyday list stays small — they accumulate
  // forever until Phase 4 adds real erasure.
  const deletedCount = users.filter(isDeleted).length;
  const visibleUsers = showDeleted ? users : users.filter((u) => !isDeleted(u));

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

  const handleLifecycle = useCallback(
    async (userId: string, action: "deactivate" | "restore") => {
      try {
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, action }),
        });
        if (!res.ok) {
          setError(action === "restore" ? "שגיאה בשחזור המשתמש" : "שגיאה בהשבתת המשתמש");
          return;
        }
        setStatusMsg(action === "restore" ? "המשתמש שוחזר ✓" : "המשתמש הושבת ✓");
        await fetchUsers();
      } catch {
        setError(action === "restore" ? "שגיאה בשחזור המשתמש" : "שגיאה בהשבתת המשתמש");
      }
    },
    [fetchUsers, setStatusMsg],
  );

  const handleDelete = useCallback(
    async (userId: string) => {
      setDeleteBusy(true);
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
      } finally {
        setDeleteBusy(false);
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
        <p data-testid={testIds.component.adminUsers.noAccessNotice()} className="text-[var(--muted)]">אין הרשאה לעמוד זה</p>
      </main>
    );
  }

  return (
    <main data-testid={testIds.component.adminUsers.root()} className="screen-wide p-6">
      <h1 data-testid={testIds.component.adminUsers.heading()} className="mb-6 text-2xl font-bold text-[var(--title)]">ניהול משתמשים</h1>

      {statusMsg && (
        <Alert data-testid={testIds.component.adminUsers.successAlert()} tone="success" className="mb-4">
          {statusMsg}
        </Alert>
      )}

      {/* Add user form */}
      <section data-testid={testIds.component.adminUsers.addFormSection()} className="surface mb-6 rounded-card p-5">
        <h2 data-testid={testIds.component.adminUsers.addFormHeading()} className="mb-4 text-lg font-bold text-[var(--title)]">הוספת משתמש חדש</h2>
        <form
          data-testid={testIds.component.adminUsers.addForm()}
          onSubmit={handleAdd}
          noValidate
        >
          <Field
            data-testid={testIds.component.adminUsers.usernameField()}
            labelTestId={testIds.component.adminUsers.usernameLabel()}
            label="שם משתמש"
          >
            <input
              data-testid={testIds.component.adminUsers.usernameInput()}
              type="text"
              dir="ltr"
              value={newUsername}
              onChange={(e) => { setNewUsername(e.target.value); setAddError(""); }}
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--accent-soft)] focus:outline-hidden focus:ring-2 focus:ring-[#cdbff2]"
              disabled={adding}
            />
          </Field>
          <Field
            data-testid={testIds.component.adminUsers.passwordField()}
            labelTestId={testIds.component.adminUsers.passwordLabel()}
            label="סיסמה"
          >
            <input
              data-testid={testIds.component.adminUsers.passwordInput()}
              type="text"
              dir="ltr"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setAddError(""); }}
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--accent-soft)] focus:outline-hidden focus:ring-2 focus:ring-[#cdbff2]"
              disabled={adding}
            />
          </Field>
          <div data-testid={testIds.component.adminUsers.adminToggleRow()} className="mb-4 flex items-center gap-2">
            <input
              data-testid={testIds.component.adminUsers.adminToggle()}
              id="km-new-user-admin"
              type="checkbox"
              checked={newIsAdmin}
              onChange={(e) => setNewIsAdmin(e.target.checked)}
              className="h-4 w-4 rounded-sm accent-[var(--accent)]"
              disabled={adding}
            />
            <label data-testid={testIds.component.adminUsers.adminToggleLabel()} htmlFor="km-new-user-admin" className="text-sm font-medium text-[var(--title)]">
              הרשאות מנהל
            </label>
          </div>

          <div data-testid={testIds.component.adminUsers.overrideToggleRow()} className="mb-4 flex items-center gap-2">
            <input
              data-testid={testIds.component.adminUsers.overridePolicyToggle()}
              id="km-new-user-override"
              type="checkbox"
              checked={newOverridePolicy}
              onChange={(e) => { setNewOverridePolicy(e.target.checked); setAddError(""); }}
              className="h-4 w-4 rounded-sm accent-[var(--accent)]"
              disabled={adding}
            />
            <label data-testid={testIds.component.adminUsers.overrideToggleLabel()} htmlFor="km-new-user-override" className="text-sm font-medium text-[var(--title)]">
              אפשר סיסמה פשוטה (למשל קוד ספרתי לילד)
            </label>
          </div>

          {addError && (
            <p data-testid={testIds.component.adminUsers.addFormError()} className="mb-3 text-sm font-medium text-red-600">{addError}</p>
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

      <ConfirmDialog
        open={confirmDeleteId !== null}
        busy={deleteBusy}
        title="למחוק את המשתמש?"
        destructive
        confirmLabel="מחק"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        testIds={{
          root: testIds.component.adminUsers.deleteDialog(),
          title: testIds.component.adminUsers.deleteDialogTitle(),
          confirm: confirmDeleteId
            ? testIds.component.adminUsers.deleteConfirm(confirmDeleteId)
            : undefined,
          cancel: confirmDeleteId
            ? testIds.component.adminUsers.deleteCancel(confirmDeleteId)
            : undefined,
        }}
      >
        <p data-testid={testIds.component.adminUsers.deleteDialogName()}>
          <strong data-testid={testIds.component.adminUsers.deleteDialogUsername()} dir="ltr">{users.find((u) => u.userId === confirmDeleteId)?.username}</strong>
        </p>
        <p data-testid={testIds.component.adminUsers.deleteDialogBody()}>
          הכניסה והסנכרון ייחסמו מיד, וההתקדמות תישמר. אם המכשיר מחובר לרשת, המידע המקומי יימחק ממנו בטעינה הבאה. ניתן לשחזר את החשבון בהמשך.
        </p>
      </ConfirmDialog>

      {/* User list */}
      <section data-testid={testIds.component.adminUsers.listSection()} className="surface rounded-card p-5">
        <div data-testid={testIds.component.adminUsers.listHeader()} className="mb-4 flex items-center justify-between gap-3">
          <h2 data-testid={testIds.component.adminUsers.listHeading()} className="text-lg font-bold text-[var(--title)]">
            משתמשים רשומים {!loading && `(${visibleUsers.length})`}
          </h2>
          {deletedCount > 0 && (
            <label
              data-testid={testIds.component.adminUsers.showDeletedLabel()}
              className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--muted)]"
            >
              <input
                data-testid={testIds.component.adminUsers.showDeletedToggle()}
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
              />
              הצג מחוקים ({deletedCount})
            </label>
          )}
        </div>

        {error && <p data-testid={testIds.component.adminUsers.listError()} className="mb-3 text-sm font-medium text-red-600">{error}</p>}

        {loading ? (
          <p data-testid={testIds.component.adminUsers.listLoading()} className="text-center text-sm text-[var(--muted)]">טוען...</p>
        ) : visibleUsers.length === 0 ? (
          <p data-testid={testIds.component.adminUsers.listEmpty()} className="text-center text-sm text-[var(--muted)]">אין משתמשים עדיין</p>
        ) : (
          <ul data-testid={testIds.component.adminUsers.list()} className="divide-y divide-[var(--border)]">
            {visibleUsers.map((u) => (
              <li
                key={u.userId}
                data-testid={testIds.component.adminUsers.userRow(u.userId)}
                className={isDeleted(u) ? "py-3 is-locked" : "py-3"}
              >
                <div data-testid={testIds.component.adminUsers.rowMain(u.userId)} className="flex items-center justify-between gap-3">
                  <div data-testid={testIds.component.adminUsers.rowInfo(u.userId)} className="min-w-0">
                    <p data-testid={testIds.component.adminUsers.rowNameLine(u.userId)} className="flex items-center gap-2 truncate font-semibold text-[var(--title)]" dir="ltr">
                      <span data-testid={testIds.component.adminUsers.rowUsername(u.userId)} className="truncate">{u.username}</span>
                      {u.status && u.status !== "active" && (
                        <span
                          data-testid={testIds.component.adminUsers.statusBadge(u.userId)}
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isDeleted(u)
                              ? "bg-[#fee2e2] text-[#991b1b]"
                              : "bg-[var(--background)] text-[var(--muted)]"
                          }`}
                          dir="rtl"
                        >
                          {isDeleted(u) ? "מחוק" : "מושבת"}
                        </span>
                      )}
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
                    <p data-testid={testIds.component.adminUsers.rowMeta(u.userId)} className="text-xs text-[var(--muted)]">
                      {u.role === "admin" ? "מנהל" : "משתמש"} · {new Date(u.createdAt).toLocaleDateString("he-IL")}
                    </p>
                  </div>

                  {isDeleted(u) ? (
                    <div data-testid={testIds.component.adminUsers.rowActionsPrimary(u.userId)} className="flex shrink-0 gap-2">
                      <button
                        data-testid={testIds.component.adminUsers.restoreButton(u.userId)}
                        onClick={() => handleLifecycle(u.userId, "restore")}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-semibold text-[#166534] hover:bg-[#dcfce7]"
                      >
                        שחזר
                      </button>
                      <a
                        data-testid={testIds.component.adminUsers.exportButton(u.userId)}
                        href={`/api/admin/users/export?userId=${encodeURIComponent(u.userId)}`}
                        download
                        className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#bfdbfe] px-3 py-1.5 text-xs font-semibold text-[#1d4ed8] hover:bg-[#eff6ff]"
                      >
                        ייצוא נתונים
                      </a>
                    </div>
                  ) : changePwUserId !== u.userId ? (
                    <div data-testid={testIds.component.adminUsers.rowActionsSecondary(u.userId)} className="flex shrink-0 gap-2">
                      {u.isLocked && (
                        <button
                          data-testid={testIds.component.adminUsers.unlockButton(u.userId)}
                          onClick={() => handleUnlock(u.userId)}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#fcd34d] bg-[#fffbeb] px-3 py-1.5 text-xs font-semibold text-[#92400e] hover:bg-[#fef3c7]"
                        >
                          שחרר חשבון
                        </button>
                      )}
                      <button
                        data-testid={testIds.component.adminUsers.changePasswordButton(u.userId)}
                        onClick={() => openChangePw(u.userId)}
                        disabled={u.status === "deactivated"}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#e7defb] px-3 py-1.5 text-xs font-semibold text-[var(--accent-strong)] hover:bg-[#f3effb] disabled:opacity-40"
                      >
                        שנה סיסמה
                      </button>
                      {/* Guardian data export (Phase 3.2) — admin-operated. A plain download link:
                          the cookie rides along and the browser saves the file, no JS needed. */}
                      <a
                        data-testid={testIds.component.adminUsers.exportButton(u.userId)}
                        href={`/api/admin/users/export?userId=${encodeURIComponent(u.userId)}`}
                        download
                        className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#bfdbfe] px-3 py-1.5 text-xs font-semibold text-[#1d4ed8] hover:bg-[#eff6ff]"
                      >
                        ייצוא נתונים
                      </a>
                      <button
                        data-testid={
                          u.status === "deactivated"
                            ? testIds.component.adminUsers.restoreButton(u.userId)
                            : testIds.component.adminUsers.deactivateButton(u.userId)
                        }
                        onClick={() =>
                          handleLifecycle(u.userId, u.status === "deactivated" ? "restore" : "deactivate")
                        }
                        disabled={u.userId === user?.userId}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--background)] disabled:opacity-40"
                      >
                        {u.status === "deactivated" ? "הפעל מחדש" : "השבת"}
                      </button>
                      <button
                        data-testid={testIds.component.adminUsers.deleteButton(u.userId)}
                        onClick={() => setConfirmDeleteId(u.userId)}
                        disabled={u.userId === user?.userId}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#fecaca] px-3 py-1.5 text-xs font-semibold text-[#dc2626] hover:bg-red-50 disabled:opacity-40"
                      >
                        מחק
                      </button>
                    </div>
                  ) : null}
                </div>

                {changePwUserId === u.userId && (
                  <div data-testid={testIds.component.adminUsers.rowChangePwRow(u.userId)} className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      data-testid={testIds.component.adminUsers.changePasswordInput(u.userId)}
                      type="text"
                      dir="ltr"
                      placeholder="סיסמה חדשה"
                      value={changePwValue}
                      onChange={(e) => { setChangePwValue(e.target.value); setChangePwError(""); }}
                      className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-[var(--border)] px-3 py-1.5 text-sm focus:border-[var(--accent-soft)] focus:outline-hidden focus:ring-2 focus:ring-[#cdbff2]"
                      disabled={changePwBusy}
                      autoFocus
                    />
                    <button
                      data-testid={testIds.component.adminUsers.changePasswordSubmit(u.userId)}
                      onClick={() => handleChangePassword(u.userId)}
                      disabled={!changePwValue || changePwBusy}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--accent-strong)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7c6fcd] disabled:opacity-50"
                    >
                      {changePwBusy ? "..." : "שמור"}
                    </button>
                    <button
                      data-testid={testIds.component.adminUsers.changePasswordCancel(u.userId)}
                      onClick={cancelChangePw}
                      disabled={changePwBusy}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--background)]"
                    >
                      ביטול
                    </button>
                    <label data-testid={testIds.component.adminUsers.rowChangePwOverrideLabel(u.userId)} className="flex w-full items-center gap-2 text-xs font-medium text-[var(--muted)]">
                      <input
                        data-testid={testIds.component.adminUsers.changePasswordOverride(u.userId)}
                        type="checkbox"
                        checked={changePwOverride}
                        onChange={(e) => { setChangePwOverride(e.target.checked); setChangePwError(""); }}
                        className="h-4 w-4 rounded-sm accent-[var(--accent)]"
                        disabled={changePwBusy}
                      />
                      אפשר סיסמה פשוטה
                    </label>
                    {changePwError && (
                      <p data-testid={testIds.component.adminUsers.rowError(u.userId)} className="text-xs font-medium text-red-600">{changePwError}</p>
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
