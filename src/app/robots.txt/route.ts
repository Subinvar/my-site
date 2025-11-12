import type { MetadataRoute } from 'next';

import { getRobotsMetadata } from '@/lib/robots';

type RobotsRules = NonNullable<MetadataRoute.Robots['rules']>;
type RobotsRule = RobotsRules extends (infer T)[] ? T : RobotsRules;

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const formatRule = (rule: RobotsRule): string[] => {
  if (typeof rule === 'string') {
    return [rule];
  }

  const lines: string[] = [];
  if ('userAgent' in rule && rule.userAgent) {
    for (const value of toArray(rule.userAgent)) {
      lines.push(`User-agent: ${value}`);
    }
  }
  if ('allow' in rule && rule.allow) {
    for (const value of toArray(rule.allow)) {
      lines.push(`Allow: ${value}`);
    }
  }
  if ('disallow' in rule && rule.disallow) {
    for (const value of toArray(rule.disallow)) {
      lines.push(`Disallow: ${value}`);
    }
  }
  if ('crawlDelay' in rule && rule.crawlDelay !== undefined) {
    lines.push(`Crawl-delay: ${rule.crawlDelay}`);
  }
  if ('cleanParam' in rule && rule.cleanParam) {
    lines.push(`Clean-param: ${rule.cleanParam}`);
  }

  return lines;
};

const buildBody = (metadata: MetadataRoute.Robots): string => {
  const lines: string[] = [];

  const rules = metadata.rules as RobotsRules | undefined;
  if (rules) {
    const normalized = (Array.isArray(rules) ? rules : [rules]) as RobotsRule[];
    for (const rule of normalized) {
      lines.push(...formatRule(rule));
    }
  }

  if (metadata.host) {
    lines.push(`Host: ${metadata.host}`);
  }

  if (metadata.sitemap) {
    for (const value of toArray(metadata.sitemap)) {
      lines.push(`Sitemap: ${value}`);
    }
  }

  return lines.join('\n') + '\n';
};

export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  const metadata = await getRobotsMetadata();
  const body = buildBody(metadata);

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}