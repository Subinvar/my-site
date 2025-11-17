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
    const self = "'self'";
    const data = "data:";
    const blob = "blob:";
    const vercelApps = "https://*.vercel.app";
    const openStreetMap = "https://www.openstreetmap.org https://tile.openstreetmap.org";
    const github = "https://github.com https://api.github.com";

    const csp = [
      `default-src ${self}`,
      `img-src ${self} ${data} ${blob} ${vercelApps} ${openStreetMap}`,
      `font-src ${self} ${data}`,
      `connect-src ${self} ${vercelApps} ${github} https://vitals.vercel-insights.com`,
      `frame-src https://www.openstreetmap.org`,
      `style-src ${self} 'unsafe-inline'`,
      `script-src ${self}`,
      `base-uri ${self}`,
      `form-action ${self}`,
      "frame-ancestors 'none'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), camera=(), microphone=(), payment=(), usb=()',
          },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
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