"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { testIds } from "@/lib/testIds";
import { routes } from "@/lib/routes";

export function UserAvatar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = user
    ? user.username.slice(0, 2).toUpperCase()
    : "";

  const handleLogout = useCallback(async () => {
    setOpen(false);
    await logout();
  }, [logout]);

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
        className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700 transition hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-violet-400"
      >
        {initials}
      </button>

      {open && (
        <div
          data-testid={testIds.component.auth.avatarDropdown()}
          // The trigger is pinned to the inline-end (visual left in RTL), so opening from
          // left-0 grows into the viewport. max-w clamp is a safety net against overflow.
          className="absolute left-0 top-full z-40 mt-1 min-w-[160px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white py-1 shadow-lg"
          role="menu"
        >
          <div data-testid="km.autogen.useravatar.node.idx.1" className="border-b border-slate-100 px-4 py-2">
            <p data-testid="km.autogen.useravatar.node.idx.2" className="text-xs font-semibold text-slate-500">מחובר כ:</p>
            <p data-testid="km.autogen.useravatar.node.idx.3" className="truncate text-sm font-bold text-slate-800" dir="ltr">{user.username}</p>
          </div>

          {user.role === "admin" && (
            <Link
              data-testid={testIds.component.auth.adminUsersLink()}
              href={routes.adminUsers()}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-50"
              role="menuitem"
            >
              👥 ניהול משתמשים
            </Link>
          )}

          <button
            data-testid={testIds.component.auth.logoutButton()}
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            role="menuitem"
          >
            🚪 התנתק
          </button>
        </div>
      )}
    </div>
  );
}
