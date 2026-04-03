"use client";

import type { ReactNode } from "react";
import { AdminTtsProvider } from "@/components/providers/AdminTtsProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <AdminTtsProvider>{children}</AdminTtsProvider>;
}
