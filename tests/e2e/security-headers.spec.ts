import { expect, test } from "@playwright/test";

/**
 * Roadmap S3 / Phase 0.3 — the security-header suite from `next.config.mjs` must be
 * present on every route. CSP ships in Report-Only first (it must NOT appear as an
 * enforcing `content-security-policy` header yet), so old cached clients / TTS / RTL
 * keep working while we observe violations.
 */

const ROUTES = ["/", "/grade/a"];

for (const route of ROUTES) {
  test(`security headers present on ${route}`, async ({ page }) => {
    const res = await page.goto(route);
    expect(res, `expected a response for ${route}`).not.toBeNull();
    const headers = res!.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["permissions-policy"]).toContain("camera=()");

    // CSP is Report-Only for now — assert the report-only header exists and that the
    // enforcing header is NOT set yet (flipping it is a later, deliberate step).
    expect(headers["content-security-policy-report-only"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toBeUndefined();
  });
}
