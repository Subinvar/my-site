import type { NextConfig } from "next";
import createMarkdocPlugin from "@markdoc/next.js";

const withMarkdoc = createMarkdocPlugin({
  schemaPath: './markdoc/config.ts',
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {},
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; img-src 'self' data: https://tile.openstreetmap.org https://*.tile.openstreetmap.org; frame-src https://www.openstreetmap.org; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'",
          },
        ],
      },
    ];
  },
  env: {
    KEYSTATIC_GITHUB_CLIENT_ID: process.env.KEYSTATIC_GITHUB_CLIENT_ID ?? "stub-client-id",
    KEYSTATIC_GITHUB_CLIENT_SECRET: process.env.KEYSTATIC_GITHUB_CLIENT_SECRET ?? "stub-client-secret",
    KEYSTATIC_SECRET: process.env.KEYSTATIC_SECRET ?? "stub-keystatic-secret",
  },
};

export default withMarkdoc(nextConfig);