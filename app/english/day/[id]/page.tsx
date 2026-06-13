import { notFound } from "next/navigation";
import { EnglishDayScreen } from "@/components/screens/english/EnglishDayScreen";
import { parseDayId } from "@/lib/utils/parseDayId";

export default function EnglishDayPage({ params }: { params: { id: string } }) {
  const dayId = parseDayId(params.id);
  if (!dayId) {
    notFound();
  }
  return <EnglishDayScreen dayId={dayId} />;
}
