import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPageMetadata } from '@/lib/metadata';

test('buildPageMetadata sets Open Graph locales', () => {
  const metadata = buildPageMetadata({
    locale: 'ru',
    slug: '',
    siteSeo: { title: 'Заголовок', description: 'Описание' },
    pageSeo: undefined,
    slugByLocale: { ru: '', en: '' },
    siteName: 'Мой сайт',
    ogImageAlt: 'og alt',
    twitter: null,
  });

  assert.equal(metadata.openGraph?.locale, 'ru_RU');
  assert.deepEqual(metadata.openGraph?.alternateLocale, ['en_US']);
  assert.equal(metadata.alternates?.languages?.ru, 'http://localhost:3000/ru');
  assert.equal(metadata.alternates?.languages?.en, 'http://localhost:3000/en');
  assert.equal(metadata.alternates?.languages?.['x-default'], 'http://localhost:3000/ru');
});