import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CookiesPrivacyLink } from "@/components/legal/CookiesPrivacyLink";
import { PrivacyCookieHint } from "@/components/legal/PrivacyCookieHint";
import { childTid } from "@/lib/testIds";

const BASE = "km.test.legalhint";

describe("legal link helpers", () => {
  it("CookiesPrivacyLink points at the privacy route", () => {
    render(<CookiesPrivacyLink baseTestId={BASE} />);
    expect(screen.getByTestId(childTid(BASE, "link", "privacy"))).toHaveAttribute("href", "/privacy");
  });

  it("PrivacyCookieHint points at the cookies route", () => {
    render(<PrivacyCookieHint baseTestId={BASE} />);
    expect(screen.getByTestId(childTid(BASE, "link", "cookies"))).toHaveAttribute("href", "/cookies");
  });
});
