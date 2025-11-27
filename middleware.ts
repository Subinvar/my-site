// middleware.ts
import { proxy } from './src/proxy';

export const config = {
  matcher: [
    '/((?!_next|api|keystatic|.*\\.[^/]+$).*)',
    '/((?=.+\\.(?:xml|webmanifest)$).*)',
  ],
};

export const middleware = proxy;