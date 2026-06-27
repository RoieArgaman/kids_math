import { notFound } from "next/navigation";
import { ScienceSectionScreen } from "@/components/screens/science/ScienceSectionScreen";
import { parseGradeId } from "@/lib/grades";
import { parseDayId } from "@/lib/utils/parseDayId";
import { parseSectionId } from "@/lib/utils/parseSectionId";

export default function ScienceSectionPage({
  params,
}: {
  params: { level: string; id: string; sectionId: string };
}) {
  const level = parseGradeId(params.level);
  if (!level) notFound();

  const dayId = parseDayId(params.id);
  if (!dayId) notFound();

  const sectionId = parseSectionId(params.sectionId);
  if (!sectionId) notFound();

  return <ScienceSectionScreen level={level} dayId={dayId} sectionId={sectionId} />;
}
