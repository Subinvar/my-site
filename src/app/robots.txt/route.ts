import type { MetadataRoute } from 'next';

import { getRobotsMetadata } from '@/lib/robots';

export const dynamic = 'force-static';

type RobotsRules = NonNullable<MetadataRoute.Robots['rules']> extends infer T
  ? T extends Array<infer U>
    ? U
    : T
  : never;

type MaybeArray<T> = T | T[] | undefined;

function ensureArray<T>(value: MaybeArray<T>): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function formatRules(rules: RobotsRules[]): string[] {
  const lines: string[] = [];

  for (const rule of rules) {
    for (const agent of ensureArray(rule.userAgent)) {
      lines.push(`User-agent: ${agent}`);
    }

    for (const allow of ensureArray(rule.allow)) {
      lines.push(`Allow: ${allow}`);
    }

    for (const disallow of ensureArray(rule.disallow)) {
      lines.push(`Disallow: ${disallow}`);
    }

    lines.push('');
  }

  return lines;
}

function formatRobots(robots: MetadataRoute.Robots): string {
  const rules = robots.rules ? formatRules(ensureArray(robots.rules)) : [];
  const host = robots.host ? [`Host: ${robots.host}`, ''] : [];
  const sitemap = robots.sitemap
    ? ensureArray(robots.sitemap).map((entry) => `Sitemap: ${entry}`)
    : [];

  const content = [...rules, ...host, ...sitemap].join('\n').trim();

  return content.length > 0 ? `${content}\n` : '';
}

export async function GET(): Promise<Response> {
  const robots = await getRobotsMetadata();
  const body = formatRobots(robots);

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}