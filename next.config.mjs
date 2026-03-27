/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production installs omit devDependencies (e.g. Firebase App Hosting). Lint still runs in CI via `npm run lint`.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
