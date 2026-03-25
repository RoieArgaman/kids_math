import { notFound } from "next/navigation";
import { PlanScreen } from "@/components/screens/PlanScreen";
import { parseGradeId } from "@/lib/grades";

export default function GradePlanPage({ params }: { params: { grade: string } }) {
  const grade = parseGradeId(params.grade);
  if (!grade) {
    notFound();
  }
  return <PlanScreen grade={grade} />;
}

