import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  getCookieConsentAccepted,
  setCookieConsentAccepted,
} from "@/lib/cookieConsent/storage";

describe("cookieConsent storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("returns false when key is missing", () => {
    expect(getCookieConsentAccepted()).toBe(false);
  });

  it("returns true after setCookieConsentAccepted", () => {
    setCookieConsentAccepted();
    expect(localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toBe("1");
    expect(getCookieConsentAccepted()).toBe(true);
  });

  it("returns false when localStorage throws", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getCookieConsentAccepted()).toBe(false);
    spy.mockRestore();
  });
});
