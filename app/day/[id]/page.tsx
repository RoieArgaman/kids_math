import { DayScreen } from "@/components/screens/DayScreen";
import type { DayId } from "@/lib/types";

export default function LegacyDayPage({ params }: { params: { id: string } }) {
  return <DayScreen grade="a" dayId={params.id as DayId} />;
}
