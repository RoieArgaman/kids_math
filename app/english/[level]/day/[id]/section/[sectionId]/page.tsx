import { notFound } from "next/navigation";
import { EnglishSectionScreen } from "@/components/screens/english/EnglishSectionScreen";
import { parseGradeId } from "@/lib/grades";
import { parseDayId } from "@/lib/utils/parseDayId";
import { parseSectionId } from "@/lib/utils/parseSectionId";

export default function EnglishSectionPage({
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

  return <EnglishSectionScreen level={level} dayId={dayId} sectionId={sectionId} />;
}
