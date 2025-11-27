// src/proxy.ts
import { NextResponse, type NextRequest } from 'next/server';
import { proxy as applyLocaleProxy } from './lib/locale-middleware';

const keystaticBasicAuthUser = process.env.KEYSTATIC_BASIC_AUTH_USER;
const keystaticBasicAuthPass = process.env.KEYSTATIC_BASIC_AUTH_PASS;

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

const isKeystaticPath = (pathname: string): boolean =>
  pathname === '/keystatic' ||
  pathname.startsWith('/keystatic/') ||
  pathname === '/api/keystatic' ||
  pathname.startsWith('/api/keystatic/');

const isAuthorizedForKeystatic = (request: NextRequest): boolean => {
  if (!keystaticBasicAuthUser || !keystaticBasicAuthPass) return true;

  const header = request.headers.get('authorization');
  if (!header?.startsWith('Basic ')) return false;

  try {
    const credentials = atob(header.slice('Basic '.length));
    const [user, pass] = credentials.split(':');
    return user === keystaticBasicAuthUser && pass === keystaticBasicAuthPass;
  } catch {
    return false;
  }
};

const unauthorizedResponse = (): NextResponse =>
  new NextResponse('Keystatic защищён Basic Auth. Разрешите диалог логина или введите правильные учетные данные.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Keystatic Admin", charset="UTF-8"',
    },
  });

export function proxy(request: NextRequest) {
  try {
    // Для Keystatic включаем явную Basic Auth, чтобы браузер показал диалог вместо пустого экрана
    if (isKeystaticPath(request.nextUrl.pathname) && !isAuthorizedForKeystatic(request)) {
      return unauthorizedResponse();
    }

    // Прогоняем ТОЛЬКО обычные страницы через locale-мидлвару
    const response = applyLocaleProxy(request);

    const isProd = process.env.NODE_ENV === 'production';
    const allowInline = !isProd;

    applySecurityHeaders(response, {
      allowInlineScripts: allowInline,
      allowInlineStyles: allowInline,
    });

    return response;
  } catch (error) {
    console.error('Middleware failed, falling back to pass-through response', error);
    return NextResponse.next();
  }
}