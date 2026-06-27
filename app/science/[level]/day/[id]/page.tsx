import { notFound } from "next/navigation";
import { ScienceDayScreen } from "@/components/screens/science/ScienceDayScreen";
import { parseGradeId } from "@/lib/grades";
import { parseDayId } from "@/lib/utils/parseDayId";

export default function ScienceDayPage({ params }: { params: { level: string; id: string } }) {
  const level = parseGradeId(params.level);
  if (!level) notFound();

  const dayId = parseDayId(params.id);
  if (!dayId) notFound();

  return <ScienceDayScreen level={level} dayId={dayId} />;
}
