import { notFound } from "next/navigation";
import { DayScreen } from "@/components/screens/DayScreen";
import { parseGradeId } from "@/lib/grades";
import { parseDayId } from "@/lib/utils/parseDayId";

export default function GradeDayPage({ params }: { params: { grade: string; id: string } }) {
  const grade = parseGradeId(params.grade);
  if (!grade) {
    notFound();
  }

  const dayId = parseDayId(params.id);
  if (!dayId) {
    notFound();
  }

  // Day existence validation (vs just format) happens inside the screen today (keeps behavior identical).
  return <DayScreen grade={grade} dayId={dayId} />;
}

