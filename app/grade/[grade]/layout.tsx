import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { parseGradeId } from "@/lib/grades";
import { ComingSoonScreen } from "@/components/screens/ComingSoonScreen";

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

  if (grade === "b") {
    return <ComingSoonScreen grade={grade} />;
  }

  return children;
}

