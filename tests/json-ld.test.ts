import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildArticleJsonLd, buildBreadcrumbListJsonLd, buildOrganizationJsonLd, buildWebsiteJsonLd } from '@/lib/json-ld';
import { localizePath, type Locale } from '@/lib/i18n';
import { buildAbsoluteUrl } from '@/lib/site-url';

test('buildOrganizationJsonLd returns schema.org organization payload', () => {
  const data = buildOrganizationJsonLd({
    locale: 'ru',
    name: 'Мой сайт',
    description: 'Описание',
    email: 'hello@example.com',
    phone: '+7 123 456-78-90',
    address: 'Москва',
    logoUrl: buildAbsoluteUrl('/og-ru.svg'),
  });

  assert.equal(data['@type'], 'Organization');
  assert.equal(data.name, 'Мой сайт');
  assert.equal(data.inLanguage, 'ru-RU');
  assert.equal(data.telephone, '+7 123 456-78-90');
  assert.equal(data.logo?.['@type'], 'ImageObject');
});

test('buildWebsiteJsonLd produces localized website data', () => {
  const data = buildWebsiteJsonLd({
    locale: 'en',
    name: 'My Site',
    description: 'Example',
    alternateLocales: ['ru' as Locale],
    searchUrl: null,
  });

  assert.equal(data['@type'], 'WebSite');
  assert.equal(data.name, 'My Site');
  assert.equal(data.inLanguage, 'en-US');
  assert.equal(data.potentialAction, undefined);
});

test('buildBreadcrumbListJsonLd adds root and current items', () => {
  const path = localizePath('ru', 'about');
  const data = buildBreadcrumbListJsonLd({
    locale: 'ru',
    rootLabel: 'Главная',
    items: [],
    current: { name: 'О проекте', href: path },
  });

  assert.equal(data['@type'], 'BreadcrumbList');
  assert.equal(data.itemListElement.length, 2);
  assert.equal(data.itemListElement[0].position, 1);
  assert.equal(data.inLanguage, 'ru-RU');
  assert.equal(data.itemListElement[1].name, 'О проекте');
});

test('buildArticleJsonLd keeps publication metadata', () => {
  const url = buildAbsoluteUrl('/ru/posts/pervyj-post');
  const data = buildArticleJsonLd({
    locale: 'ru',
    headline: 'Первый пост',
    description: 'Описание',
    url,
    imageUrl: buildAbsoluteUrl('/og-ru.svg'),
    imageAlt: 'OG',
    datePublished: '2024-01-01T00:00:00.000Z',
    dateModified: '2024-02-01T00:00:00.000Z',
    publisherName: 'Мой сайт',
  });

  assert.equal(data['@type'], 'Article');
  assert.equal(data.headline, 'Первый пост');
  assert.equal(data.inLanguage, 'ru-RU');
  assert.equal(data.datePublished, '2024-01-01T00:00:00.000Z');
  assert.equal(data.dateModified, '2024-02-01T00:00:00.000Z');
  assert.equal(data.publisher?.name, 'Мой сайт');
});