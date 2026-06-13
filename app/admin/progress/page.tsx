import { AdminProgressScreen } from "@/components/screens/AdminProgressScreen";
import { parseGradeId } from "@/lib/grades";
import { parseSubjectId } from "@/lib/subjects";

export default function AdminProgressPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const gradeParam = typeof searchParams?.grade === "string" ? searchParams.grade : null;
  const initialGrade = gradeParam ? parseGradeId(gradeParam) ?? "a" : "a";
  const subjectParam = typeof searchParams?.subject === "string" ? searchParams.subject : null;
  const initialSubject = subjectParam ? parseSubjectId(subjectParam) ?? "math" : "math";
  return <AdminProgressScreen initialGrade={initialGrade} initialSubject={initialSubject} />;
}
