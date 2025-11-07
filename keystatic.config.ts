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
      title: fields.text({ label: 'SEO-заголовок (RU)', validation: { isRequired: true } }),
      description: fields.text({ label: 'SEO-описание (RU)', multiline: true }),
    }),
    en: fields.object({
      title: fields.text({ label: 'SEO-заголовок (EN)', validation: { isRequired: true } }),
      description: fields.text({ label: 'SEO-описание (EN)', multiline: true }),
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
      label: 'Словарь',
      path: 'src/content/dictionary',
      schema: {
        brandName: localizedText('Название бренда'),
        header: fields.object({
          navigationAriaLabel: localizedText('Подпись навигации в шапке'),
          homeAriaLabel: localizedText('Подпись ссылки «На главную» в шапке'),
        }),
        footer: fields.object({
          navigationTitle: localizedText('Заголовок навигации в подвале'),
          contactsTitle: localizedText('Заголовок контактов в подвале'),
          copyright: localizedText('Копирайт в подвале'),
        }),
        buttons: fields.object({
          goHome: localizedText('Текст кнопки «На главную»'),
          retry: localizedText('Текст кнопки «Повторить»'),
        }),
        states: fields.object({
          loading: localizedText('Сообщение о загрузке'),
          emptyPosts: localizedRichText('Сообщение при отсутствии постов', { multiline: true }),
          emptyPages: localizedRichText('Сообщение при отсутствии страниц', { multiline: true }),
          nothingFound: localizedRichText('Сообщение «Ничего не найдено»', { multiline: true }),
        }),
        pagination: fields.object({
          previous: localizedText('Подпись кнопки «Назад»'),
          next: localizedText('Подпись кнопки «Вперёд»'),
        }),
        breadcrumbs: fields.object({
          ariaLabel: localizedText('Подпись хлебных крошек'),
          rootLabel: localizedText('Подпись корневой крошки'),
        }),
        languageSwitcher: fields.object({
          ariaLabel: localizedText('Подпись переключателя языка'),
          availableLabel: localizedText('Описание списка языков'),
        }),
        errors: fields.object({
          notFoundTitle: localizedText('Заголовок страницы 404'),
          notFoundDescription: localizedRichText('Описание страницы 404', { multiline: true }),
          errorTitle: localizedText('Заголовок общей ошибки'),
          errorDescription: localizedRichText('Описание общей ошибки', { multiline: true }),
        }),
        seo: fields.object({
          ogImageAlt: localizedText('Альтернативный текст Open Graph'),
        }),
        markdoc: fields.object({
          calloutTitle: localizedText('Заголовок callout-блока'),
          noteLabel: localizedText('Подпись callout «Примечание»'),
          warningLabel: localizedText('Подпись callout «Предупреждение»'),
          infoLabel: localizedText('Подпись callout «Информация»'),
        }),
      },
    }),
    site: singleton({
      label: 'Сайт',
      path: 'src/content/site',
      schema: {
        seo: localizedSeo(),
        contacts: fields.object({
          ru: fields.object({
            address: fields.text({ label: 'Адрес (RU)', multiline: true }),
            phone: fields.text({ label: 'Телефон (RU)' }),
          }),
          en: fields.object({
            address: fields.text({ label: 'Адрес (EN)', multiline: true }),
            phone: fields.text({ label: 'Телефон (EN)' }),
          }),
          email: fields.text({ label: 'Электронная почта' }),
        }),
      },
    }),
    navigation: singleton({
      label: 'Навигация',
      path: 'src/content/navigation',
      schema: {
        header: fields.array(
          fields.object({
            label: localizedText('Подпись'),
            slug: localizedSlug('Слаг'),
          }),
          {
            label: 'Ссылки в шапке',
          }
        ),
        footer: fields.array(
          fields.object({
            label: localizedText('Подпись'),
            slug: localizedSlug('Слаг'),
          }),
          {
            label: 'Ссылки в подвале',
          }
        ),
      },
    }),
  },
  collections: {
    pages: collection({
      label: 'Страницы',
      path: 'src/content/pages/*',
      slugField: 'slugKey',
      format: { data: 'json' },
      schema: {
        slugKey: fields.slug({
          name: { label: 'Идентификатор страницы' },
        }),
        title: localizedText('Заголовок'),
        slug: localizedSlug('Слаг'),
        excerpt: localizedText('Краткое описание', { multiline: true }),
        seo: localizedSeo(),
        content: localizedMarkdoc('Контент'),
      },
    }),
    posts: collection({
      label: 'Посты',
      path: 'src/content/posts/*',
      slugField: 'slugKey',
      format: { data: 'json' },
      schema: {
        slugKey: fields.slug({
          name: { label: 'Идентификатор поста' },
        }),
        title: localizedText('Заголовок'),
        slug: localizedSlug('Слаг'),
        excerpt: localizedText('Краткое описание', { multiline: true }),
        seo: localizedSeo(),
        content: localizedMarkdoc('Контент'),
        publishedAt: fields.datetime({ label: 'Дата публикации' }),
      },
    }),
  },
});