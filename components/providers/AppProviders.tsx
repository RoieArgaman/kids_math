"use client";

import type { ReactNode } from "react";
import { AdminTtsProvider } from "@/components/providers/AdminTtsProvider";
import { StudentTtsProvider } from "@/components/providers/StudentTtsProvider";
import { AuthProvider } from "@/lib/auth/context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminTtsProvider>
        <StudentTtsProvider>{children}</StudentTtsProvider>
      </AdminTtsProvider>
    </AuthProvider>
  );
}
