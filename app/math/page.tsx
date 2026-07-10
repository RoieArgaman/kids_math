import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/**
 * Legacy math grade-picker route. The grade picker now lives at `/` (Grade →
 * Subject → Day). Redirect so old deep links + the `mathHome` builder still
 * resolve instead of dead-ending in the old order. Preserves `previewAll`.
 */
export default function MathRedirectPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  redirect(routes.gradePicker({ searchParams }));
}
