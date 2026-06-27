import { ButtonLink } from "@/components/ui/Button";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { routes } from "@/lib/routes";
import { testIds } from "@/lib/testIds";

/**
 * Global 404. Without this file Next.js serves its built-in (English, LTR,
 * no app chrome) 404, which is inconsistent with the in-app "not found"
 * panels (e.g. an unknown day) and breaks the RTL Hebrew experience.
 * Rendered inside the root layout, so it inherits `<html dir="rtl">`,
 * the TopBar and the footer automatically.
 */
export default function NotFound() {
  return (
    <main dir="rtl" lang="he" data-testid={testIds.screen.notFound.root()}>
      <CenteredPanel
        emoji="🔍"
        title="הַדַּף לֹא נִמְצָא."
        actions={
          <ButtonLink href={routes.subjectPicker()} className="w-full text-center">
            חֲזָרָה לַדַּף הָרָאשִׁי
          </ButtonLink>
        }
      />
    </main>
  );
}
