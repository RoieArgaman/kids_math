import { notFound } from "next/navigation";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { parseGradeId } from "@/lib/grades";

export default function GradeHomePage({ params }: { params: { grade: string } }) {
  const grade = parseGradeId(params.grade);
  if (!grade) {
    notFound();
  }
  return <HomeScreen grade={grade} />;
}

