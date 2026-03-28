import Link from "next/link";
import { routes } from "@/lib/routes";
import { childTid } from "@/lib/testIds";

export function CookiesPrivacyLink({ baseTestId }: { baseTestId: string }) {
  return (
    <p data-testid={childTid(baseTestId, "p", "privacyLink")} className="leading-relaxed">
      לפרטים כלליים ראו{" "}
      <Link
        data-testid={childTid(baseTestId, "link", "privacy")}
        className="font-semibold text-violet-800 underline"
        href={routes.privacy()}
      >
        מדיניות הפרטיות
      </Link>
      .
    </p>
  );
}
