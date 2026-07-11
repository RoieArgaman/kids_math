/** @type {import('next').NextConfig} */

// Content-Security-Policy shipped in REPORT-ONLY first (roadmap S3 / Phase 0.3): the app
// relies on inline styles (`next/font`, React `style={{…}}`) and Next App Router's inline
// hydration scripts, and there is no nonce infra yet — so `'unsafe-inline'` is required and
// we observe violations before switching to an enforcing policy in a later soak. Audio/TTS
// is same-origin (`media-src 'self'`); no third-party origins are loaded at runtime.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "media-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  // HSTS is STAGED: short max-age, no includeSubDomains/preload, so the browser commitment
  // is short-lived and self-heals. Ramp to a year only after a soak confirms all traffic is
  // HTTPS — this avoids a sticky lock-in that could strand an old client.
  { key: "Strict-Transport-Security", value: "max-age=86400" },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig = {
  // Production installs omit devDependencies (e.g. Firebase App Hosting). Lint still runs in CI via `npm run lint`.
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
