import type { NextRequest } from 'next/server';

import { proxy } from './lib/locale-middleware';

export function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  matcher: [
    '/((?!_next|api|keystatic|.*\\.[^/]+$).*)',
    '/((?=.+\\.(?:xml|webmanifest)$).*)',
  ],
};
