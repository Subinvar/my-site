// src/app/api/keystatic/[[...ks]]/route.ts
import { makeRouteHandler } from '@keystatic/next/route-handler';

import config from '../../../../../keystatic.config';

console.info('[keystatic] API route handler loaded');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const { POST, GET } = makeRouteHandler({ config });