import { AdminProgressScreen } from "@/components/screens/AdminProgressScreen";
import { parseGradeId } from "@/lib/grades";

export default function AdminProgressPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const gradeParam = typeof searchParams?.grade === "string" ? searchParams.grade : null;
  const initialGrade = gradeParam ? parseGradeId(gradeParam) ?? "a" : "a";
  return <AdminProgressScreen initialGrade={initialGrade} />;
}
