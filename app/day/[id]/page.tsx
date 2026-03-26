import { notFound } from "next/navigation";
import { DayScreen } from "@/components/screens/DayScreen";
import { parseDayId } from "@/lib/utils/parseDayId";

export default function LegacyDayPage({ params }: { params: { id: string } }) {
  const dayId = parseDayId(params.id);
  if (!dayId) {
    notFound();
  }

  return <DayScreen grade="a" dayId={dayId} />;
}
