import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSitemapUrl } from './robots';

test('buildSitemapUrl falls back to the default sitemap path when base is missing', () => {
  assert.equal(buildSitemapUrl(null), '/sitemap.xml');
  assert.equal(buildSitemapUrl('   '), '/sitemap.xml');
});

test('buildSitemapUrl trims trailing slashes and preserves existing protocol', () => {
  assert.equal(buildSitemapUrl('https://example.com/'), 'https://example.com/sitemap.xml');
  assert.equal(buildSitemapUrl('http://example.com///'), 'http://example.com/sitemap.xml');
});

test('buildSitemapUrl adds https protocol and keeps nested paths', () => {
  assert.equal(buildSitemapUrl('example.com'), 'https://example.com/sitemap.xml');
  assert.equal(buildSitemapUrl('example.com/blog/'), 'https://example.com/blog/sitemap.xml');
});

test('buildSitemapUrl ignores invalid URLs', () => {
  assert.equal(buildSitemapUrl('not a url'), '/sitemap.xml');
});
