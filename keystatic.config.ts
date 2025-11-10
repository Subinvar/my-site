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

const localizedSeo = (label: string) =>
  fields.object(
    Object.fromEntries(
      locales.map((locale) => [
        locale,
        fields.object({
          title: fields.text({
            label: `Заголовок (${locale.toUpperCase()})`,
            validation: { isRequired: true },
          }),
          description: fields.text({
            label: `Описание (${locale.toUpperCase()})`,
            multiline: true,
            validation: { isRequired: true },
          }),
          ogImage: fields.object(
            {
              image: imageField(`OG-изображение (${locale.toUpperCase()})`),
              alt: fields.text({
                label: `Alt (${locale.toUpperCase()})`,
              }),
            },
            { label: `OG (${locale.toUpperCase()})` }
          ),
        }),
      ])
    ),
    { label }
  );

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

export default config({
  storage: {
    kind: 'github',
    repo: 'Subinvar/my-site',
  },
  singletons: {
    site: singleton({
      label: 'Настройки сайта',
      path: 'content/site',
      schema: {
        siteName: localizedText('Название сайта', { isRequired: true }),
        tagline: localizedText('Слоган', { multiline: true }),
        contacts: fields.object({
          email: fields.text({ label: 'E-mail' }),
          phone: fields.text({ label: 'Телефон' }),
          address: localizedText('Адрес', { multiline: true }),
        }),
        defaultSeo: localizedSeo('SEO по умолчанию'),
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
      path: 'content/navigation',
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
      slugField: 'id',
      schema: {
        id: fields.text({ label: 'ID', validation: { isRequired: true } }),
        published: fields.checkbox({ label: 'Опубликовано', defaultValue: true }),
        slug: localizedSlug('Slug'),
        title: localizedText('Заголовок', { isRequired: true }),
        excerpt: localizedText('Краткое описание', { multiline: true }),
        content: localizedMarkdocReference('Контент (Markdoc)'),
        seo: localizedSeo('SEO'),
        updatedAt: fields.datetime({ label: 'Обновлено' }),
      },
    }),
    posts: collection({
      label: 'Посты',
      path: 'content/posts/*',
      slugField: 'id',
      schema: {
        id: fields.text({ label: 'ID', validation: { isRequired: true } }),
        published: fields.checkbox({ label: 'Опубликовано', defaultValue: true }),
        date: fields.datetime({ label: 'Дата публикации' }),
        slug: localizedSlug('Slug'),
        title: localizedText('Заголовок', { isRequired: true }),
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
        seo: localizedSeo('SEO'),
        updatedAt: fields.datetime({ label: 'Обновлено' }),
      },
    }),
  },
});