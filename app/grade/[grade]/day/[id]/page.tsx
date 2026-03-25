import { notFound } from "next/navigation";
import { DayScreen } from "@/components/screens/DayScreen";
import { parseGradeId } from "@/lib/grades";
import type { DayId } from "@/lib/types";

export default function GradeDayPage({ params }: { params: { grade: string; id: string } }) {
  const grade = parseGradeId(params.grade);
  if (!grade) {
    notFound();
  }

  // Day existence validation happens inside the screen today (keeps behavior identical).
  return <DayScreen grade={grade} dayId={params.id as DayId} />;
}

