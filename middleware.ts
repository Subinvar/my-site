// middleware.ts
import { proxy } from './src/proxy';

export const config = {
  matcher: [
    '/keystatic/:path*',
    '/api/keystatic/:path*',
    '/((?!_next|api|.*\\.[^/]+$).*)',
    '/((?=.+\\.(?:xml|webmanifest)$).*)',
  ],
};

export const middleware = proxy;