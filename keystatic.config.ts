import { collection, config, fields, singleton } from '@keystatic/core';

const locales = ['ru', 'en'] as const;

type LocalizedFieldOptions = {
  multiline?: boolean;
  isRequired?: boolean;
};

const imageField = (label: string) =>
  fields.image({
    label,
    directory: 'public/uploads',
    publicPath: '/uploads/',
  });

const localizedText = (label: string, options: LocalizedFieldOptions = {}) =>
  fields.object(
    Object.fromEntries(
      locales.map((locale) => [
        locale,
        fields.text({
          label: `${label} (${locale.toUpperCase()})`,
          multiline: options.multiline,
          validation: options.isRequired ? { isRequired: true } : undefined,
        }),
      ])
    ),
    { label }
  );

const localizedSlug = (label: string, options: LocalizedFieldOptions = {}) =>
  fields.object(
    Object.fromEntries(
      locales.map((locale) => [
        locale,
        fields.text({
          label: `${label} (${locale.toUpperCase()})`,
          validation: options.isRequired ? { isRequired: true } : undefined,
        }),
      ])
    ),
    { label }
  );

const localizedMarkdocReference = (label: string) =>
  fields.object(
    Object.fromEntries(
      locales.map((locale) => [
        locale,
        fields.pathReference({
          label: `${label} (${locale.toUpperCase()})`,
          pattern: `content/markdoc/${locale}/**/*.mdoc`,
        }),
      ])
    ),
    { label }
  );

const localizedSeoTextFields = (label: string, options: LocalizedFieldOptions = {}) =>
  fields.object(
    Object.fromEntries(
      locales.map((locale) => [
        locale,
        fields.text({
          label: `${label} (${locale.toUpperCase()})`,
          multiline: options.multiline,
        }),
      ])
    ),
    { label }
  );

const localizedSeoGroup = () =>
  fields.object({
    title: localizedSeoTextFields('SEO заголовок'),
    description: localizedSeoTextFields('SEO описание', { multiline: true }),
    ogTitle: localizedSeoTextFields('OG заголовок'),
    ogDescription: localizedSeoTextFields('OG описание', { multiline: true }),
    ogImage: fields.object(
      {
        image: imageField('OG-изображение'),
        alt: fields.text({ label: 'Alt для OG' }),
      },
      { label: 'OG-изображение' }
    ),
    canonicalOverride: fields.text({ label: 'Canonical override' }),
  });

const navigationLinks = (label: string) =>
  fields.array(
    fields.object({
      id: fields.text({ label: 'ID', validation: { isRequired: true } }),
      label: localizedText('Подпись', { isRequired: true }),
      path: localizedSlug('Путь'),
      externalUrl: fields.text({ label: 'Внешний URL' }),
      newTab: fields.checkbox({ label: 'Открывать в новой вкладке', defaultValue: false }),
      order: fields.integer({ label: 'Порядок', defaultValue: 0 }),
    }),
    {
      label,
      itemLabel: () => 'Ссылка',
    }
  );

const storage =
  process.env.KEYSTATIC_STORAGE_KIND === 'github'
    ? ({
        kind: 'github' as const,
        repo: {
          owner: 'Subinvar',
          name: 'my-site',
        },
      })
    : ({ kind: 'local' as const });

export default config({
  storage,
  singletons: {
    site: singleton({
      label: 'Настройки сайта',
      path: 'content/site/',
      format: { data: 'json' },
      schema: {
        siteName: localizedText('Название сайта', { isRequired: true }),
        tagline: localizedText('Слоган', { multiline: true }),
        contacts: fields.object({
          email: fields.text({ label: 'E-mail' }),
          phone: fields.text({ label: 'Телефон' }),
          address: localizedText('Адрес', { multiline: true }),
        }),
        seo: fields.object({
          title: localizedSeoTextFields('Title по умолчанию'),
          description: localizedSeoTextFields('Description по умолчанию', { multiline: true }),
          ogTitle: localizedSeoTextFields('OG Title по умолчанию'),
          ogDescription: localizedSeoTextFields('OG Description по умолчанию', { multiline: true }),
          ogImage: fields.object(
            {
              image: imageField('OG-изображение по умолчанию'),
              alt: fields.text({ label: 'Alt OG по умолчанию' }),
            },
            { label: 'OG по умолчанию' }
          ),
          canonicalBase: fields.text({
            label: 'Canonical base URL',
            validation: { isRequired: true },
          }),
          twitterHandle: fields.text({ label: 'Twitter @handle' }),
        }),
        meta: fields.object({
          domain: fields.text({ label: 'Домен' }),
          robots: fields.object({
            index: fields.checkbox({ label: 'Разрешить индексацию', defaultValue: true }),
            follow: fields.checkbox({ label: 'Разрешить переход по ссылкам', defaultValue: true }),
          }),
        }),
      },
    }),
    navigation: singleton({
      label: 'Навигация',
      path: 'content/navigation/',
      format: { data: 'json' },
      schema: {
        headerLinks: navigationLinks('Ссылки в шапке'),
        footerLinks: navigationLinks('Ссылки в подвале'),
      },
    }),
  },
  collections: {
    pages: collection({
      label: 'Страницы',
      path: 'content/pages/*',
      format: { data: 'json' },
      slugField: 'id',
      schema: {
        id: fields.text({ label: 'ID', validation: { isRequired: true } }),
        published: fields.checkbox({ label: 'Опубликовано', defaultValue: true }),
        slug: localizedSlug('Slug'),
        title: localizedText('Заголовок', { isRequired: true }),
        description: localizedText('Описание', { multiline: true }),
        excerpt: localizedText('Краткое описание', { multiline: true }),
        content: localizedMarkdocReference('Контент (Markdoc)'),
        seo: localizedSeoGroup(),
        updatedAt: fields.datetime({ label: 'Обновлено' }),
      },
    }),
    posts: collection({
      label: 'Посты',
      path: 'content/posts/*',
      format: { data: 'json' },
      slugField: 'id',
      schema: {
        id: fields.text({ label: 'ID', validation: { isRequired: true } }),
        published: fields.checkbox({ label: 'Опубликовано', defaultValue: true }),
        date: fields.datetime({ label: 'Дата публикации' }),
        slug: localizedSlug('Slug'),
        title: localizedText('Заголовок', { isRequired: true }),
        description: localizedText('Описание', { multiline: true }),
        excerpt: localizedText('Краткое описание', { multiline: true }),
        content: localizedMarkdocReference('Контент (Markdoc)'),
        tags: fields.array(fields.text({ label: 'Тег' }), {
          label: 'Теги',
          itemLabel: (props) => props.value ?? 'Тег',
        }),
        cover: fields.object({
          image: imageField('Обложка'),
          alt: localizedText('Alt'),
        }),
        seo: localizedSeoGroup(),
        updatedAt: fields.datetime({ label: 'Обновлено' }),
      },
    }),
  },
});