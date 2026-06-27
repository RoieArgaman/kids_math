import { notFound } from "next/navigation";
import { EnglishFinalExamScreen } from "@/components/screens/english/EnglishFinalExamScreen";
import { parseGradeId } from "@/lib/grades";

export default function EnglishExamPage({ params }: { params: { level: string } }) {
  const level = parseGradeId(params.level);
  if (!level) notFound();
  return <EnglishFinalExamScreen level={level} />;
}
