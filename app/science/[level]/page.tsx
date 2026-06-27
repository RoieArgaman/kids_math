import { notFound } from "next/navigation";
import { ScienceHomeScreen } from "@/components/screens/science/ScienceHomeScreen";
import { parseGradeId } from "@/lib/grades";

export default function ScienceLevelHomePage({ params }: { params: { level: string } }) {
  const level = parseGradeId(params.level);
  if (!level) notFound();
  return <ScienceHomeScreen level={level} />;
}
