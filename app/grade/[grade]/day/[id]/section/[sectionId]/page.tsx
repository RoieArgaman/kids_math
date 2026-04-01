import { notFound } from "next/navigation";
import { SectionScreen } from "@/components/screens/SectionScreen";
import { parseGradeId } from "@/lib/grades";
import { parseDayId } from "@/lib/utils/parseDayId";
import { parseSectionId } from "@/lib/utils/parseSectionId";

export default function GradeSectionPage({
  params,
}: {
  params: { grade: string; id: string; sectionId: string };
}) {
  const grade = parseGradeId(params.grade);
  if (!grade) notFound();

  const dayId = parseDayId(params.id);
  if (!dayId) notFound();

  const sectionId = parseSectionId(params.sectionId);
  if (!sectionId) notFound();

  return <SectionScreen grade={grade} dayId={dayId} sectionId={sectionId} />;
}
