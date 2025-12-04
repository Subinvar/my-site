import assert from 'node:assert/strict';
import test from 'node:test';

import { applyFilters, type FilterState } from '@/app/(site)/shared/catalog-filtering';
import { getCatalogItems } from './keystatic';
import { getCatalogTaxonomyValues } from './catalog/constants';

const NEW_COATING_SLUGS = [
  'pk-10',
  'pk-50a',
  'pk-55h',
  'pk-57g',
  'pk-60c',
  'pk-72gc',
  'pk-7c',
  'pk-90m',
];

test('new coatings are available in catalog listing and coatings products view', async () => {
  const items = await getCatalogItems('ru');
  const slugs = items.map((item) => item.slug);

  for (const slug of NEW_COATING_SLUGS) {
    assert.ok(slugs.includes(slug), `catalog listing should include ${slug}`);
  }

  const taxonomyValues = getCatalogTaxonomyValues();
  const filters: FilterState = {
    category: { values: ['Противопригарные покрытия'], lookup: new Set(['Противопригарные покрытия']) },
    process: { values: [], lookup: new Set() },
    base: { values: ['Спиртовое'], lookup: new Set(['Спиртовое']) },
    filler: { values: [], lookup: new Set() },
    metal: { values: [], lookup: new Set() },
    auxiliary: { values: [], lookup: new Set() },
    q: null,
    sort: 'name',
    limit: 0,
    offset: 0,
  };

  const filtered = applyFilters(items, filters, taxonomyValues);
  const filteredSlugs = filtered.map((item) => item.slug);

  for (const slug of NEW_COATING_SLUGS) {
    assert.ok(filteredSlugs.includes(slug), `coatings products view should include ${slug}`);
  }
});
