import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { parseGradeId } from "@/lib/grades";

import GradePageShell from "./GradePageShell";

export default function GradeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { grade: string };
}) {
  const grade = parseGradeId(params.grade);
  if (!grade) {
    notFound();
  }

  return <GradePageShell>{children}</GradePageShell>;
}

