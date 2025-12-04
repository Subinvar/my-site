import assert from 'node:assert/strict';
import test from 'node:test';

import { getAllCatalogEntries, getCatalogItems } from '../keystatic';
import { getCatalogTaxonomyOptions } from './constants';

test('catalog listings include recently added auxiliary products', async () => {
  const ruItems = await getCatalogItems('ru');
  const enItems = await getCatalogItems('en');

  const expectedSlugs = [
    'cleaner-os-1',
    'rp-2-repair-paste',
    'rp-2',
    'rp-2-1',
    'rp-3',
  ];

  for (const slug of expectedSlugs) {
    assert(
      ruItems.some((item) => item.slug === slug),
      `missing ru item slug "${slug}" in catalog listing`
    );
    assert(
      enItems.some((item) => item.slug === slug),
      `missing en item slug "${slug}" in catalog listing`
    );
  }
});

test('localized catalog entries include new auxiliary products', async () => {
  const entries = await getAllCatalogEntries();
  const expected = new Map([
    ['cleaner-os-1', new Set(['ru', 'en'])],
    ['rp-2-repair-paste', new Set(['ru', 'en'])],
    ['rp-2', new Set(['ru', 'en'])],
    ['rp-2-1', new Set(['ru', 'en'])],
    ['rp-3', new Set(['ru', 'en'])],
  ]);

  for (const entry of entries) {
    const slugRecord = entry.slugByLocale;
    for (const locale of Object.keys(slugRecord)) {
      const slug = slugRecord[locale as keyof typeof slugRecord];
      if (!slug) {
        continue;
      }
      const localeSet = expected.get(slug);
      if (localeSet) {
        localeSet.delete(locale);
      }
    }
  }

  for (const [slug, missingLocales] of expected.entries()) {
    assert.equal(
      missingLocales.size,
      0,
      `missing locales for ${slug}: ${[...missingLocales].join(', ')}`
    );
  }
});

test('auxiliary taxonomy options include cleaner and release categories', () => {
  const options = getCatalogTaxonomyOptions('ru');
  const auxiliaryValues = options.auxiliaries.map((entry) => entry.value);
  const expectedValues = ['Отмывающий состав', 'Разделительный состав', 'Ремонтная паста'];

  for (const value of expectedValues) {
    assert(
      auxiliaryValues.includes(value),
      `missing auxiliary taxonomy value "${value}"`
    );
  }
});
