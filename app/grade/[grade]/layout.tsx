import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { parseGradeId } from "@/lib/grades";

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

  return children;
}

