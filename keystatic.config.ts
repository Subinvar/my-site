import { config, fields, collection, singleton } from '@keystatic/core';

const localizedText = (label: string, options: { multiline?: boolean } = {}) =>
  fields.object({
    ru: fields.text({ label: `${label} (RU)`, multiline: options.multiline ?? false }),
    en: fields.text({ label: `${label} (EN)`, multiline: options.multiline ?? false }),
  });

const localizedSlug = (label: string) =>
  fields.object({
    ru: fields.slug({ name: { label: `${label} (RU)` } }),
    en: fields.slug({ name: { label: `${label} (EN)` } }),
  });

const localizedSeo = () =>
  fields.object({
    ru: fields.object({
      title: fields.text({ label: 'SEO Title (RU)', validation: { isRequired: true } }),
      description: fields.text({ label: 'SEO Description (RU)', multiline: true }),
    }),
    en: fields.object({
      title: fields.text({ label: 'SEO Title (EN)', validation: { isRequired: true } }),
      description: fields.text({ label: 'SEO Description (EN)', multiline: true }),
    }),
  });

const localizedRichText = (label: string, options: { multiline?: boolean } = {}) =>
  fields.object({
    ru: fields.text({ label: `${label} (RU)`, multiline: options.multiline ?? false }),
    en: fields.text({ label: `${label} (EN)`, multiline: options.multiline ?? false }),
  });

const localizedMarkdoc = (label: string) =>
  fields.object({
    ru: fields.markdoc({ label: `${label} (RU)` }),
    en: fields.markdoc({ label: `${label} (EN)` }),
  });

export default config({
  storage: {
    kind: 'github',
    repo: 'Subinvar/my-site',
  },
  singletons: {
    dictionary: singleton({
      label: 'Dictionary',
      path: 'src/content/dictionary',
      schema: {
        brandName: localizedText('Brand name'),
        header: fields.object({
          navigationAriaLabel: localizedText('Header navigation aria-label'),
          homeAriaLabel: localizedText('Header home link aria-label'),
        }),
        footer: fields.object({
          navigationTitle: localizedText('Footer navigation title'),
          contactsTitle: localizedText('Footer contacts title'),
          copyright: localizedText('Footer copyright'),
        }),
        buttons: fields.object({
          goHome: localizedText('Go home button label'),
          retry: localizedText('Retry action label'),
        }),
        states: fields.object({
          loading: localizedText('Loading message'),
          emptyPosts: localizedRichText('Empty posts message', { multiline: true }),
          emptyPages: localizedRichText('Empty pages message', { multiline: true }),
          nothingFound: localizedRichText('Nothing found message', { multiline: true }),
        }),
        pagination: fields.object({
          previous: localizedText('Pagination previous label'),
          next: localizedText('Pagination next label'),
        }),
        breadcrumbs: fields.object({
          ariaLabel: localizedText('Breadcrumbs aria-label'),
          rootLabel: localizedText('Breadcrumbs root label'),
        }),
        languageSwitcher: fields.object({
          ariaLabel: localizedText('Language switcher aria-label'),
          availableLabel: localizedText('Available languages helper label'),
        }),
        errors: fields.object({
          notFoundTitle: localizedText('404 title'),
          notFoundDescription: localizedRichText('404 description', { multiline: true }),
          errorTitle: localizedText('Generic error title'),
          errorDescription: localizedRichText('Generic error description', { multiline: true }),
        }),
        seo: fields.object({
          ogImageAlt: localizedText('Open Graph image alt text'),
        }),
        markdoc: fields.object({
          calloutTitle: localizedText('Callout heading'),
          noteLabel: localizedText('Callout “note” label'),
          warningLabel: localizedText('Callout “warning” label'),
          infoLabel: localizedText('Callout “info” label'),
        }),
      },
    }),
    site: singleton({
      label: 'Site',
      path: 'src/content/site',
      schema: {
        seo: localizedSeo(),
        contacts: fields.object({
          ru: fields.object({
            address: fields.text({ label: 'Адрес (RU)', multiline: true }),
            phone: fields.text({ label: 'Телефон (RU)' }),
          }),
          en: fields.object({
            address: fields.text({ label: 'Address (EN)', multiline: true }),
            phone: fields.text({ label: 'Phone (EN)' }),
          }),
          email: fields.text({ label: 'Email' }),
        }),
      },
    }),
    navigation: singleton({
      label: 'Navigation',
      path: 'src/content/navigation',
      schema: {
        header: fields.array(
          fields.object({
            label: localizedText('Label'),
            slug: localizedSlug('Slug'),
          }),
          {
            label: 'Header links',
          }
        ),
        footer: fields.array(
          fields.object({
            label: localizedText('Label'),
            slug: localizedSlug('Slug'),
          }),
          {
            label: 'Footer links',
          }
        ),
      },
    }),
  },
  collections: {
    pages: collection({
      label: 'Pages',
      path: 'src/content/pages/*',
      slugField: 'slugKey',
      format: { data: 'json' },
      schema: {
        slugKey: fields.slug({
          name: { label: 'Идентификатор страницы' },
        }),
        title: localizedText('Title'),
        slug: localizedSlug('Slug'),
        excerpt: localizedText('Excerpt', { multiline: true }),
        seo: localizedSeo(),
        content: localizedMarkdoc('Content'),
      },
    }),
    posts: collection({
      label: 'Posts',
      path: 'src/content/posts/*',
      slugField: 'slugKey',
      format: { data: 'json' },
      schema: {
        slugKey: fields.slug({
          name: { label: 'Идентификатор поста' },
        }),
        title: localizedText('Title'),
        slug: localizedSlug('Slug'),
        excerpt: localizedText('Excerpt', { multiline: true }),
        seo: localizedSeo(),
        content: localizedMarkdoc('Content'),
        publishedAt: fields.datetime({ label: 'Published at' }),
      },
    }),
  },
});