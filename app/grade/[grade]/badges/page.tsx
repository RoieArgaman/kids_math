import { parseGradeId } from "@/lib/grades";
import { notFound } from "next/navigation";
import { BadgeGalleryScreen } from "@/components/screens/BadgeGalleryScreen";

export default function BadgesPage({ params }: { params: { grade: string } }) {
  const grade = parseGradeId(params.grade);
  if (!grade) {
    notFound();
  }
  return <BadgeGalleryScreen grade={grade} />;
}
