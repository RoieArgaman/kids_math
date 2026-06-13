import { notFound } from "next/navigation";
import { EnglishSectionScreen } from "@/components/screens/english/EnglishSectionScreen";
import { parseDayId } from "@/lib/utils/parseDayId";
import { parseSectionId } from "@/lib/utils/parseSectionId";

export default function EnglishSectionPage({
  params,
}: {
  params: { id: string; sectionId: string };
}) {
  const dayId = parseDayId(params.id);
  if (!dayId) notFound();

  const sectionId = parseSectionId(params.sectionId);
  if (!sectionId) notFound();

  return <EnglishSectionScreen dayId={dayId} sectionId={sectionId} />;
}
