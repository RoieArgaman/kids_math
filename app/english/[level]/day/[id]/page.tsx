import { notFound } from "next/navigation";
import { EnglishDayScreen } from "@/components/screens/english/EnglishDayScreen";
import { parseGradeId } from "@/lib/grades";
import { parseDayId } from "@/lib/utils/parseDayId";

export default function EnglishDayPage({ params }: { params: { level: string; id: string } }) {
  const level = parseGradeId(params.level);
  if (!level) notFound();

  const dayId = parseDayId(params.id);
  if (!dayId) notFound();

  return <EnglishDayScreen level={level} dayId={dayId} />;
}
