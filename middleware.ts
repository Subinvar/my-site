import { proxy } from './src/proxy';

export const config = {
  matcher: [
    '/((?!_next|api|keystatic|.*\\.[^/]+$).*)',
    '/((?=.+\\.(?:xml|webmanifest)$).*)',
    '/keystatic/:path*',
    '/api/keystatic/:path*',
  ],
};

export const middleware = proxy;
