import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/**
 * Legacy Science level-picker route. Level selection now happens via the grade
 * picker (`/`) → subject picker (`/subjects/[grade]`). Redirect so old deep links
 * + the `scienceLevelPicker` builder still resolve. Preserves `previewAll`.
 */
export default function ScienceRedirectPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  redirect(routes.gradePicker({ searchParams }));
}
