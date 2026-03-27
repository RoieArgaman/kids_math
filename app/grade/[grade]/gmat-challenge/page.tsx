import { notFound } from "next/navigation";
import { GmatChallengeScreen } from "@/components/screens/GmatChallengeScreen";
import { parseGradeId } from "@/lib/grades";

export default function GmatChallengePage({ params }: { params: { grade: string } }) {
  const grade = parseGradeId(params.grade);
  if (!grade) {
    notFound();
  }
  return <GmatChallengeScreen grade={grade} />;
}
