import { proxy } from './src/proxy';

export const middleware = proxy;

export const config = {
  matcher: [
    '/((?!_next|api|keystatic|.*\\.[^/]+$).*)',
    '/((?=.+\\.(?:xml|webmanifest)$).*)',
  ],
};
