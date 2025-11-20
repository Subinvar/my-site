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
};

const baseSecurityHeaders = {
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
} as const;

const buildCsp = (options: SecurityOptions = {}): string => {
  const scriptSrc = options.allowInlineScripts ? `${self} 'unsafe-inline'` : self;

  return [
    `default-src ${self}`,
    `img-src ${self} ${data} ${blob} ${vercelApps} ${openStreetMap}`,
    `font-src ${self} ${data}`,
    `connect-src ${self} ${vercelApps} ${github} https://vitals.vercel-insights.com`,
    `frame-src https://www.openstreetmap.org`,
    `style-src ${self} 'unsafe-inline'`,
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

const normalizeEnv = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const KEYSTATIC_USERNAME = normalizeEnv(process.env.KEYSTATIC_BASIC_USER) ?? 'admin';
const KEYSTATIC_PASSWORD =
  normalizeEnv(process.env.KEYSTATIC_BASIC_PASSWORD) ??
  normalizeEnv(process.env.KEYSTATIC_SECRET) ??
  'stub-keystatic-secret';

function isKeystaticRequest(pathname: string): boolean {
  return pathname === '/keystatic' || pathname.startsWith('/keystatic/') || pathname.startsWith('/api/keystatic');
}

function unauthorized(): NextResponse {
  const response = new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Keystatic CMS"',
    },
  });
  applySecurityHeaders(response, { allowInlineScripts: true });
  return response;
}

function withKeystaticAuth(request: NextRequest): NextResponse {
  if (!KEYSTATIC_PASSWORD) {
    return unauthorized();
  }

  const authorizationHeader = request.headers.get('authorization');
  if (authorizationHeader?.startsWith('Basic ')) {
    const authValue = authorizationHeader.split(' ')[1] ?? '';
    const decoded = atob(authValue);
    const [username, password] = decoded.split(':');
    if (username === KEYSTATIC_USERNAME && password === KEYSTATIC_PASSWORD) {
      const response = NextResponse.next();
      applySecurityHeaders(response, { allowInlineScripts: true });
      return response;
    }
  }
  return unauthorized();
}

export function proxy(request: NextRequest) {
  if (isKeystaticRequest(request.nextUrl.pathname)) {
    return withKeystaticAuth(request);
  }
  const response = applyLocaleProxy(request);
  applySecurityHeaders(response);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next|api|keystatic|.*\\.[^/]+$).*)',
    '/((?=.+\\.(?:xml|webmanifest)$).*)',
    '/keystatic/:path*',
    '/api/keystatic/:path*',
  ],
};
