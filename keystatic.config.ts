import { collection, config, fields, singleton } from '@keystatic/core';

const locales = ['ru', 'en'] as const;

type Locale = (typeof locales)[number];

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
    locales.reduce(
      (acc, locale) => ({
        ...acc,
        [locale]: fields.text({
          label: `${label} (${locale.toUpperCase()})`,
          multiline: options.multiline ?? false,
          validation: options.isRequired ? { isRequired: true } : undefined,
        }),
      }),
      {} as Record<Locale, ReturnType<typeof fields.text>>
    ),
    { label }
  );

const localizedPath = (label: string, options: LocalizedFieldOptions = {}) =>
  fields.object(
    locales.reduce(
      (acc, locale) => ({
        ...acc,
        [locale]: fields.text({
          label: `${label} (${locale.toUpperCase()})`,
          validation: options.isRequired ? { isRequired: true } : undefined,
        }),
      }),
      {} as Record<Locale, ReturnType<typeof fields.text>>
    ),
    { label }
  );

const localizedSlug = (label: string) =>
  fields.object(
    locales.reduce(
      (acc, locale) => ({
        ...acc,
        [locale]: fields.slug({
          name: { label: `${label} (${locale.toUpperCase()})`, validation: { isRequired: true } },
        }),
      }),
      {} as Record<Locale, ReturnType<typeof fields.slug>>
    ),
    { label }
  );

const localizedMarkdoc = (label: string) =>
  fields.object(
    locales.reduce(
      (acc, locale) => ({
        ...acc,
        [locale]: fields.pathReference({
          label: `${label} (${locale.toUpperCase()})`,
          pattern: `content/markdoc/${locale}/**/*.mdoc`,
        }),
      }),
      {} as Record<Locale, ReturnType<typeof fields.pathReference>>
    ),
    { label }
  );

const localizedSeo = (labelPrefix: string) =>
  fields.object(
    locales.reduce(
      (acc, locale) => ({
        ...acc,
        [locale]: fields.object({
          title: fields.text({
            label: `${labelPrefix} — заголовок (${locale.toUpperCase()})`,
            validation: { isRequired: true },
          }),
          description: fields.text({
            label: `${labelPrefix} — описание (${locale.toUpperCase()})`,
            multiline: true,
            validation: { isRequired: true },
          }),
          ogImage: fields.object(
            {
              image: imageField(`OG-изображение (${locale.toUpperCase()})`),
              alt: fields.text({
                label: `Alt для OG-изображения (${locale.toUpperCase()})`,
                validation: { isRequired: true },
              }),
            },
            { label: `OG-изображение (${locale.toUpperCase()})` }
          ),
        }),
      }),
      {} as Record<Locale, ReturnType<typeof fields.object>>
    ),
    { label: `${labelPrefix} — SEO` }
  );

const navigationLinks = (label: string) =>
  fields.array(
    fields.object({
      id: fields.slug({
        name: { label: 'ID ссылки', validation: { isRequired: true } },
      }),
      label: localizedText('Подпись ссылки', { isRequired: true }),
      path: localizedPath('Путь или URL', { isRequired: true }),
      newTab: fields.checkbox({ label: 'Открывать в новой вкладке', defaultValue: false }),
      order: fields.integer({ label: 'Порядок', defaultValue: 0 }),
    }),
    {
      label,
      itemLabel: (props) => {
        const labelField = props.fields.label as unknown as { value?: { ru?: string; en?: string } };
        const value = labelField?.value;
        return value?.ru || value?.en || 'Ссылка';
      },
    }
  );

export default config({
  storage: {
    kind: 'github',
    repo: 'Subinvar/my-site',
  },
  singletons: {
    site: singleton({
      label: 'Сайт',
      path: 'src/content/site',
      schema: {
        brand: fields.object({
          logo: fields.object({
            image: imageField('Логотип'),
            alt: localizedText('Alt логотипа', { isRequired: true }),
          }),
          companyName: fields.text({ label: 'Название компании', validation: { isRequired: true } }),
          siteName: localizedText('Имя сайта', { isRequired: true }),
          tagline: localizedText('Слоган', { multiline: true }),
          contacts: fields.object({
            phone: fields.text({ label: 'Телефон' }),
            email: fields.text({ label: 'Электронная почта', validation: { isRequired: true } }),
            address: localizedText('Адрес', { multiline: true }),
          }),
          socials: fields.array(
            fields.object({
              label: fields.text({ label: 'Название', validation: { isRequired: true } }),
              url: fields.text({ label: 'URL', validation: { isRequired: true } }),
              newTab: fields.checkbox({ label: 'Открывать в новой вкладке', defaultValue: true }),
            }),
            {
              label: 'Социальные сети',
              itemLabel: (props) => props.fields.label?.value || 'Ссылка',
            }
          ),
        }),
        defaultSeo: localizedSeo('SEO по умолчанию'),
        twitter: fields.object({
          card: fields.select({
            label: 'Тип карточки Twitter',
            options: [
              { label: 'summary', value: 'summary' },
              { label: 'summary_large_image', value: 'summary_large_image' },
            ],
            defaultValue: 'summary_large_image',
          }),
          site: fields.text({ label: 'Twitter Site' }),
          creator: fields.text({ label: 'Twitter Creator' }),
        }),
        meta: fields.object({
          domain: fields.text({ label: 'Домен', validation: { isRequired: true } }),
          robots: fields.object({
            index: fields.checkbox({ label: 'Разрешить индексировать', defaultValue: true }),
            follow: fields.checkbox({ label: 'Разрешить переход по ссылкам', defaultValue: true }),
          }),
          organization: fields.object({
            legalName: fields.text({ label: 'Юридическое название', validation: { isRequired: true } }),
            taxId: fields.text({ label: 'ИНН / Tax ID' }),
          }),
        }),
      },
    }),
    navigation: singleton({
      label: 'Навигация',
      path: 'src/content/navigation',
      schema: {
        headerLinks: navigationLinks('Ссылки в шапке'),
        footerLinks: navigationLinks('Ссылки в подвале'),
      },
    }),
    dictionary: singleton({
      label: 'Словарь',
      path: 'src/content/dictionary',
      schema: {
        common: fields.object({
          siteName: localizedText('Название сайта', { isRequired: true }),
          tagline: localizedText('Слоган сайта', { multiline: true }),
          buttons: fields.object({
            goHome: localizedText('Кнопка «На главную»', { isRequired: true }),
            retry: localizedText('Кнопка «Повторить»', { isRequired: true }),
            readMore: localizedText('Кнопка «Читать далее»', { isRequired: true }),
            goBack: localizedText('Кнопка «Назад»', { isRequired: true }),
          }),
          pagination: fields.object({
            previous: localizedText('Кнопка «Назад»', { isRequired: true }),
            next: localizedText('Кнопка «Вперёд»', { isRequired: true }),
          }),
          breadcrumbs: fields.object({
            ariaLabel: localizedText('Название хлебных крошек', { isRequired: true }),
            rootLabel: localizedText('Корневая крошка', { isRequired: true }),
          }),
          languageSwitcher: fields.object({
            ariaLabel: localizedText('Переключатель языка', { isRequired: true }),
            availableLabel: localizedText('Список языков', { isRequired: true }),
          }),
          labels: fields.object({
            author: localizedText('Подпись «Автор»', { isRequired: true }),
            search: localizedText('Подпись поиска', { isRequired: true }),
            searchPlaceholder: localizedText('Placeholder поиска', { isRequired: true }),
          }),
        }),
        header: fields.object({
          navigationAriaLabel: localizedText('Подпись навигации', { isRequired: true }),
          homeAriaLabel: localizedText('Подпись ссылки «На главную»', { isRequired: true }),
        }),
        footer: fields.object({
          navigationTitle: localizedText('Заголовок навигации', { isRequired: true }),
          contactsTitle: localizedText('Заголовок контактов', { isRequired: true }),
          copyright: localizedText('Копирайт', { isRequired: true }),
        }),
        forms: fields.object({
          nameLabel: localizedText('Поле «Имя»', { isRequired: true }),
          emailLabel: localizedText('Поле «E-mail»', { isRequired: true }),
          messageLabel: localizedText('Поле «Сообщение»', { isRequired: true }),
          submitLabel: localizedText('Кнопка отправки', { isRequired: true }),
        }),
        seo: fields.object({
          ogImageAlt: localizedText('Alt для OG-изображения', { isRequired: true }),
          shareTitle: localizedText('Подпись для шаринга', { multiline: true }),
        }),
        messages: fields.object({
          loading: localizedText('Сообщение о загрузке', { isRequired: true }),
          emptyPosts: localizedText('Нет постов', { multiline: true, isRequired: true }),
          emptyPages: localizedText('Нет страниц', { multiline: true, isRequired: true }),
          nothingFound: localizedText('Ничего не найдено', { multiline: true, isRequired: true }),
          errors: fields.object({
            notFoundTitle: localizedText('Заголовок 404', { isRequired: true }),
            notFoundDescription: localizedText('Описание 404', { multiline: true, isRequired: true }),
            errorTitle: localizedText('Заголовок ошибки', { isRequired: true }),
            errorDescription: localizedText('Описание ошибки', { multiline: true, isRequired: true }),
          }),
          markdoc: fields.object({
            calloutTitle: localizedText('Заголовок callout', { isRequired: true }),
            noteLabel: localizedText('Подпись «Примечание»', { isRequired: true }),
            warningLabel: localizedText('Подпись «Предупреждение»', { isRequired: true }),
            infoLabel: localizedText('Подпись «Информация»', { isRequired: true }),
          }),
        }),
      },
    }),
  },
  collections: {
    pages: collection({
      label: 'Страницы',
      path: 'content/pages/*',
      slugField: 'slugKey',
      format: {
        data: 'json',
      },
      schema: {
        id: fields.text({ label: 'Стабильный ID' }),
        slugKey: fields.slug({ name: { label: 'ID страницы', validation: { isRequired: true } } }),
        status: fields.select({
          label: 'Статус',
          options: [
            { label: 'Черновик', value: 'draft' },
            { label: 'Опубликовано', value: 'published' },
          ],
          defaultValue: 'draft',
        }),
        datePublished: fields.datetime({ label: 'Дата публикации' }),
        updatedAt: fields.datetime({ label: 'Обновлено' }),
        title: localizedText('Заголовок', { isRequired: true }),
        slug: localizedSlug('Слаг'),
        excerpt: localizedText('Краткое описание', { multiline: true }),
        cover: fields.object({
          image: imageField('Обложка'),
          alt: localizedText('Alt обложки', { isRequired: true }),
        }),
        content: localizedMarkdoc('Контент'),
        seo: localizedSeo('Страница'),
      },
    }),
    posts: collection({
      label: 'Посты',
      path: 'content/posts/*',
      slugField: 'slugKey',
      format: {
        data: 'json',
      },
      schema: {
        id: fields.text({ label: 'Стабильный ID' }),
        slugKey: fields.slug({ name: { label: 'ID поста', validation: { isRequired: true } } }),
        status: fields.select({
          label: 'Статус',
          options: [
            { label: 'Черновик', value: 'draft' },
            { label: 'Опубликовано', value: 'published' },
          ],
          defaultValue: 'draft',
        }),
        datePublished: fields.datetime({ label: 'Дата публикации' }),
        updatedAt: fields.datetime({ label: 'Обновлено' }),
        title: localizedText('Заголовок', { isRequired: true }),
        slug: localizedSlug('Слаг'),
        excerpt: localizedText('Краткое описание', { multiline: true }),
        cover: fields.object({
          image: imageField('Обложка'),
          alt: localizedText('Alt обложки', { isRequired: true }),
        }),
        content: localizedMarkdoc('Контент'),
        tags: fields.array(fields.text({ label: 'Тег', validation: { isRequired: true } }), {
          label: 'Теги',
          itemLabel: (props) => props.value ?? 'Тег',
        }),
        author: fields.text({ label: 'Автор' }),
        readingTime: fields.integer({ label: 'Время чтения (мин)' }),
        canonicalUrl: localizedText('Канонический URL'),
        seo: localizedSeo('Пост'),
      },
    }),
    redirects: collection({
      label: 'Редиректы',
      path: 'src/content/redirects/*',
      slugField: 'slugKey',
      format: { data: 'json' },
      schema: {
        slugKey: fields.slug({ name: { label: 'ID правила', validation: { isRequired: true } } }),
        fromPath: fields.text({ label: 'Откуда', validation: { isRequired: true } }),
        toPath: fields.text({ label: 'Куда', validation: { isRequired: true } }),
        code: fields.select({
          label: 'Код',
          options: [
            { label: '301 — постоянный', value: '301' },
            { label: '302 — временный', value: '302' },
          ],
          defaultValue: '301',
        }),
        enabled: fields.checkbox({ label: 'Включено', defaultValue: true }),
      },
    }),
  },
});