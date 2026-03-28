"use client";

import type { ReactNode } from "react";

import { StorageErrorBoundary } from "@/components/ui/StorageErrorBoundary";

export default function GradePageShell({ children }: { children: ReactNode }) {
  return <StorageErrorBoundary>{children}</StorageErrorBoundary>;
}
