import type { MetadataRoute } from 'next';

import { getRobotsMetadata } from '@/lib/robots';

export const dynamic = 'force-static';

export default async function robots(): Promise<MetadataRoute.Robots> {
  return getRobotsMetadata();
}