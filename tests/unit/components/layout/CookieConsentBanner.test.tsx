import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { getCookieConsentAccepted, setCookieConsentAccepted } from "@/lib/cookieConsent/storage";
import { childTid, testIds } from "@/lib/testIds";

const root = testIds.layout.cookieConsent.root();

afterEach(() => window.localStorage.clear());

describe("CookieConsentBanner", () => {
  it("shows the banner and links when consent has not been given", () => {
    render(<CookieConsentBanner />);
    expect(screen.getByTestId(root)).toBeInTheDocument();
    expect(screen.getByTestId(childTid(root, "link", "cookies"))).toHaveAttribute("href", "/cookies");
    expect(screen.getByTestId(childTid(root, "link", "privacy"))).toHaveAttribute("href", "/privacy");
  });

  it("persists consent and hides the banner on accept", async () => {
    render(<CookieConsentBanner />);
    await userEvent.click(screen.getByTestId(childTid(root, "cta", "accept")));
    expect(getCookieConsentAccepted()).toBe(true);
    expect(screen.queryByTestId(root)).toBeNull();
  });

  it("stays hidden when consent was already accepted", () => {
    setCookieConsentAccepted();
    render(<CookieConsentBanner />);
    expect(screen.queryByTestId(root)).toBeNull();
  });
});
