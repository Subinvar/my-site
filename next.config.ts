import type { NextConfig } from "next";

const self = "'self'";
const data = 'data:';
const blob = 'blob:';
const vercelApps = 'https://*.vercel.app';
const openStreetMap = 'https://www.openstreetmap.org https://tile.openstreetmap.org';
const github = 'https://github.com https://api.github.com';
const isProduction = process.env.NODE_ENV === "production";

type ContentSecurityPolicyOptions = {
  allowInlineScripts?: boolean;
  allowInlineStyles?: boolean;
};

const buildContentSecurityPolicy = (options: ContentSecurityPolicyOptions = {}): string =>
  [
    `default-src ${self}`,
    `img-src ${self} ${data} ${blob} ${vercelApps} ${openStreetMap}`,
    `font-src ${self} ${data}`,
    `connect-src ${self} ${vercelApps} ${github} https://vitals.vercel-insights.com`,
    `frame-src https://www.openstreetmap.org`,
    `style-src ${self}${options.allowInlineStyles ? " 'unsafe-inline'" : ''}`,
    `script-src ${options.allowInlineScripts ? `${self} 'unsafe-inline' 'unsafe-eval'` : self}`,
    `base-uri ${self}`,
    `form-action ${self}`,
    "frame-ancestors 'none'",
  ].join('; ');

const createSecurityHeaders = (options?: ContentSecurityPolicyOptions) => [
  {
    key: 'Content-Security-Policy',
    value: buildContentSecurityPolicy(options),
  },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(), camera=(), microphone=(), payment=(), usb=()',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingExcludes: {
    '*': [
      './.next/cache/webpack/**',
      './.next/cache/swc/**',
    ],
  },
  async headers() {
    return [
      {
        source: '/keystatic/:path*',
        headers: createSecurityHeaders({ allowInlineScripts: true, allowInlineStyles: true }),
      },
      {
        source: '/api/keystatic/:path*',
        headers: createSecurityHeaders({ allowInlineScripts: true, allowInlineStyles: true }),
      },
      {
        source: '/:path*',
        headers: createSecurityHeaders({ allowInlineScripts: !isProduction, allowInlineStyles: !isProduction }),
      },
    ];
  },
  reactCompiler: false,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  env: {
    KEYSTATIC_GITHUB_CLIENT_ID: process.env.KEYSTATIC_GITHUB_CLIENT_ID ?? "stub-client-id",
    KEYSTATIC_GITHUB_CLIENT_SECRET: process.env.KEYSTATIC_GITHUB_CLIENT_SECRET ?? "stub-client-secret",
    KEYSTATIC_SECRET: process.env.KEYSTATIC_SECRET ?? "stub-keystatic-secret",
  },
};

export default nextConfig;