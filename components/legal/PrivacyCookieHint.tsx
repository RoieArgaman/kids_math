import Link from "next/link";
import { routes } from "@/lib/routes";
import { childTid } from "@/lib/testIds";

export function PrivacyCookieHint({ baseTestId }: { baseTestId: string }) {
  return (
    <p data-testid={childTid(baseTestId, "p", "cookieHint")} className="leading-relaxed">
      עשויים לשמש עוגיות טכניות לצורך תפקוד האפליקציה (למשל זכירת הרשאת גישה לתכנים לאחר השלמת מבחן מסכם). פירוט נוסף מופיע ב{" "}
      <Link
        data-testid={childTid(baseTestId, "link", "cookies")}
        className="font-semibold text-violet-800 underline"
        href={routes.cookies()}
      >
        מדיניות העוגיות
      </Link>
      .
    </p>
  );
}
