import { notFound } from "next/navigation";
import { EnglishHomeScreen } from "@/components/screens/english/EnglishHomeScreen";
import { parseGradeId } from "@/lib/grades";

export default function EnglishLevelHomePage({ params }: { params: { level: string } }) {
  const level = parseGradeId(params.level);
  if (!level) notFound();
  return <EnglishHomeScreen level={level} />;
}
