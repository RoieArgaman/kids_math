"use client";

import type { ReactNode } from "react";
import { AdminTtsProvider } from "@/components/providers/AdminTtsProvider";
import { AudioUnlockManager } from "@/components/providers/AudioUnlockManager";
import { AuthProvider } from "@/lib/auth/context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminTtsProvider>
        <AudioUnlockManager />
        {children}
      </AdminTtsProvider>
    </AuthProvider>
  );
}
