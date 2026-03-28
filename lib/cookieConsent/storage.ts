/** Local acknowledgment of cookie notice (essential + local storage); not a substitute for legal advice. */
export const COOKIE_CONSENT_STORAGE_KEY = "kids_math.cookie_consent.v1";

const ACCEPTED = "1";

export function getCookieConsentAccepted(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) === ACCEPTED;
  } catch {
    return false;
  }
}

export function setCookieConsentAccepted(): void {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, ACCEPTED);
  } catch {
    /* ignore quota / private mode */
  }
}
