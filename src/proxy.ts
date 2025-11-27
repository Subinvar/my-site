import { NextResponse, type NextRequest } from 'next/server';

import { proxy as applyLocaleProxy } from './lib/locale-middleware';

const self = "'self'";
const data = 'data:';
const blob = 'blob:';
const vercelApps = 'https://*.vercel.app';
const openStreetMap = 'https://www.openstreetmap.org https://tile.openstreetmap.org';
const github = 'https://github.com https://api.github.com';

type SecurityOptions = {
  allowInlineScripts?: boolean;
  allowInlineStyles?: boolean;
};

const baseSecurityHeaders = {
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
} as const;

const buildCsp = (options: SecurityOptions = {}): string => {
  const scriptSrc = options.allowInlineScripts ? `${self} 'unsafe-inline' 'unsafe-eval'` : self;
  const styleSrc = options.allowInlineStyles ? `${self} 'unsafe-inline'` : self;

  return [
    `default-src ${self}`,
    `img-src ${self} ${data} ${blob} ${vercelApps} ${openStreetMap}`,
    `font-src ${self} ${data}`,
    `connect-src ${self} ${vercelApps} ${github} https://vitals.vercel-insights.com`,
    `frame-src https://www.openstreetmap.org`,
    `style-src ${styleSrc}`,
    `script-src ${scriptSrc}`,
    `base-uri ${self}`,
    `form-action ${self}`,
    "frame-ancestors 'none'",
  ].join('; ');
};

const applySecurityHeaders = (response: NextResponse, options?: SecurityOptions): void => {
  response.headers.set('Content-Security-Policy', buildCsp(options));
  for (const [key, value] of Object.entries(baseSecurityHeaders)) {
    response.headers.set(key, value);
  }
};

function isKeystaticRequest(pathname: string): boolean {
  return pathname === '/keystatic' || pathname.startsWith('/keystatic/') || pathname.startsWith('/api/keystatic');
}
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isKeystatic = isKeystaticRequest(pathname);
  const isProd = process.env.NODE_ENV === 'production';

  if (isKeystatic) {
    const response = NextResponse.next();
    applySecurityHeaders(response, { allowInlineScripts: true, allowInlineStyles: true });
    return response;
  }

  const response = applyLocaleProxy(request);
  const allowInline = !isProd;
  applySecurityHeaders(response, { allowInlineScripts: allowInline, allowInlineStyles: allowInline });
  return response;
}