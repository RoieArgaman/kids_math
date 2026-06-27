import { notFound } from "next/navigation";
import { ScienceFinalExamScreen } from "@/components/screens/science/ScienceFinalExamScreen";
import { parseGradeId } from "@/lib/grades";

export default function ScienceExamPage({ params }: { params: { level: string } }) {
  const level = parseGradeId(params.level);
  if (!level) notFound();
  return <ScienceFinalExamScreen level={level} />;
}
