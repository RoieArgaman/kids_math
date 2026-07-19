"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { testIds } from "@/lib/testIds";
import { routes } from "@/lib/routes";

export function UserAvatar() {
  const { user, logout, logoutAll } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = user
    ? user.username.slice(0, 2).toUpperCase()
    : "";

  const handleLogout = useCallback(async () => {
    setOpen(false);
    await logout();
  }, [logout]);

  const handleLogoutEverywhere = useCallback(async () => {
    setOpen(false);
    await logoutAll();
  }, [logoutAll]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  if (!user) return null;

  return (
    <div
      data-testid={testIds.component.auth.avatar()}
      ref={dropdownRef}
      className="relative"
    >
      <button
        data-testid={testIds.component.auth.avatarButton()}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ede9fe] text-sm font-bold text-[var(--accent-strong)] transition hover:bg-[#e3d9fb] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent-soft)]"
      >
        {initials}
      </button>

      {open && (
        <div
          data-testid={testIds.component.auth.avatarDropdown()}
          // The trigger is pinned to the inline-end (visual left in RTL), so opening from
          // left-0 grows into the viewport. max-w clamp is a safety net against overflow.
          className="absolute left-0 top-full z-40 mt-1 min-w-[160px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#efe9f7] bg-white py-1 shadow-[0_2px_14px_rgba(80,60,140,0.10)]"
          role="menu"
        >
          <div data-testid="km.autogen.useravatar.node.idx.1" className="border-b border-[#efe9f7] px-4 py-2">
            <p data-testid="km.autogen.useravatar.node.idx.2" className="text-xs font-semibold text-[#9a93a8]">מחובר כ:</p>
            <p data-testid="km.autogen.useravatar.node.idx.3" className="truncate text-sm font-bold text-[var(--title)]" dir="ltr">{user.username}</p>
          </div>

          {user.role === "admin" && (
            <Link
              data-testid={testIds.component.auth.adminUsersLink()}
              href={routes.adminUsers()}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--accent-strong)] hover:bg-[#f3effb]"
              role="menuitem"
            >
              👥 ניהול משתמשים
            </Link>
          )}

          <button
            data-testid={testIds.component.auth.logoutButton()}
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#4f4860] hover:bg-[#f7f4fd]"
            role="menuitem"
          >
            🚪 התנתק
          </button>

          {/* "Log out everywhere" is an adult security concept — admin-only, kept out of a
              child's menu so a young student can't accidentally revoke all their sessions. */}
          {user.role === "admin" && (
            <button
              data-testid={testIds.component.auth.logoutEverywhereButton()}
              onClick={handleLogoutEverywhere}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#4f4860] hover:bg-[#f7f4fd]"
              role="menuitem"
            >
              🔒 התנתקות מכל המכשירים
            </button>
          )}
        </div>
      )}
    </div>
  );
}
