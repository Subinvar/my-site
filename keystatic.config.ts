import { collection, config, fields, singleton } from '@keystatic/core';

import { CATALOG_CATEGORIES, getCatalogTaxonomyOptions } from './src/lib/catalog/constants';
import { defaultLocale } from './src/lib/i18n';

const taxonomyOptions = getCatalogTaxonomyOptions(defaultLocale);

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

const fileField = (label: string) =>
  fields.file({
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

const localizedMarkdocContent = (label: string) =>
  fields.object(
    Object.fromEntries(
      locales.map((locale) => [
        locale,
        fields.markdoc({
          label: `${label} (${locale.toUpperCase()})`,
          options: {
            image: {
              directory: 'public/uploads',
              publicPath: '/uploads/',
            },
          },
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

const slugKeyField = (entityLabel: string) =>
  fields.slug({
    name: {
      label: `${entityLabel} — название`,
    },
    slug: {
      label: `${entityLabel} — slug`,
    },
  });

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

type ObjectItemLabelProps = {
  value?: { value?: unknown } | null;
  fields?: { value?: { value?: unknown } | null } | null;
};

const objectItemLabel = (fallback: string) => (props: ObjectItemLabelProps) => {
  const valueFromValue = props?.value?.value;
  const valueFromFields = props?.fields?.value?.value;

  if (typeof valueFromValue === 'string' && valueFromValue.trim()) {
    return valueFromValue;
  }

  if (typeof valueFromFields === 'string' && valueFromFields.trim()) {
    return valueFromFields;
  }

  return fallback;
};

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
        footer: fields.object(
          {
            copyright: localizedText('Копирайт', { multiline: true }),
          },
          { label: 'Подвал' }
        ),
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
    catalogTaxonomy: singleton({
      label: 'Справочники каталога',
      path: 'content/catalog-taxonomy/',
      format: { data: 'json' },
      schema: {
        categories: fields.array(
          fields.object({
            value: fields.text({
              label: 'Значение категории',
              validation: { isRequired: true },
            }),
            label: localizedText('Подпись категории', { isRequired: true }),
            isAuxiliaryCategory: fields.checkbox({
              label: 'Категория для вспомогательных материалов',
              defaultValue: false,
            }),
          }),
          {
            label: 'Категории',
            itemLabel: objectItemLabel('Категория'),
          }
        ),
        processes: fields.array(
          fields.object({
            value: fields.text({
              label: 'Значение процесса',
              validation: { isRequired: true },
            }),
            label: localizedText('Подпись процесса', { isRequired: true }),
          }),
          {
            label: 'Процессы',
            itemLabel: objectItemLabel('Процесс'),
          }
        ),
        bases: fields.array(
          fields.object({
            value: fields.text({
              label: 'Значение основы',
              validation: { isRequired: true },
            }),
            label: localizedText('Подпись основы', { isRequired: true }),
          }),
          {
            label: 'Основы',
            itemLabel: objectItemLabel('Основа'),
          }
        ),
        fillers: fields.array(
          fields.object({
            value: fields.text({
              label: 'Значение наполнителя',
              validation: { isRequired: true },
            }),
            label: localizedText('Подпись наполнителя', { isRequired: true }),
          }),
          {
            label: 'Наполнители',
            itemLabel: objectItemLabel('Наполнитель'),
          }
        ),
        auxiliaries: fields.array(
          fields.object({
            value: fields.text({
              label: 'Значение вспомогательного материала',
              validation: { isRequired: true },
            }),
            label: localizedText('Подпись вспомогательного материала', { isRequired: true }),
          }),
          {
            label: 'Вспомогательные материалы',
            itemLabel: objectItemLabel('Материал'),
          }
        ),
      },
    }),
    dictionary: singleton({
      label: 'Словарь интерфейса',
      path: 'content/dictionary/',
      format: { data: 'json' },
      schema: {
        common: fields.object(
          {
            skipToContent: localizedText('Ссылка «Пропустить к контенту»', { isRequired: true }),
            emptyValue: localizedText('Значение по умолчанию', { isRequired: true }),
            buttons: fields.object(
              {
                goHome: localizedText('Кнопка «На главную»', { isRequired: true }),
                retry: localizedText('Кнопка «Попробовать снова»', { isRequired: true }),
              },
              { label: 'Подписи кнопок' }
            ),
          },
          { label: 'Общие тексты' }
        ),
        languageSwitcher: fields.object(
          {
            switchTo: fields.object(
              Object.fromEntries(
                locales.map((locale) => [
                  locale,
                  localizedText(`Aria-label переключения на ${locale.toUpperCase()}`, { isRequired: true }),
                ])
              ),
              { label: 'Подписи переключателя языка' }
            ),
          },
          { label: 'Переключатель языка' }
        ),
        errors: fields.object(
          {
            notFound: fields.object(
              {
                title: localizedText('Заголовок страницы 404', { isRequired: true }),
                description: localizedText('Описание страницы 404', { multiline: true, isRequired: true }),
              },
              { label: 'Страница 404' }
            ),
            generic: fields.object(
              {
                title: localizedText('Заголовок общей ошибки', { isRequired: true }),
                description: localizedText('Описание общей ошибки', { multiline: true, isRequired: true }),
              },
              { label: 'Общее сообщение об ошибке' }
            ),
          },
          { label: 'Сообщения об ошибках' }
        ),
        catalog: fields.object(
          {
            attributes: fields.object(
              {
                category: localizedText('Подпись «Категория»', { isRequired: true }),
                process: localizedText('Подпись «Процессы»', { isRequired: true }),
                base: localizedText('Подпись «Основы»', { isRequired: true }),
                filler: localizedText('Подпись «Наполнители»', { isRequired: true }),
                auxiliary: localizedText('Подпись «Вспомогательные материалы»', { isRequired: true }),
              },
              { label: 'Подписи атрибутов' }
            ),
            summaryLabel: localizedText('Подпись «Кратко о продукте»', { isRequired: true }),
          },
          { label: 'Каталог' }
        ),
        navigation: fields.object(
          {
            headerLabel: localizedText('Aria-label основной навигации', { isRequired: true }),
            footerLabel: localizedText('Aria-label навигации в подвале', { isRequired: true }),
          },
          { label: 'Навигация' }
        ),
      },
    }),
    documentsPage: singleton({
      label: 'Документы и сертификаты',
      path: 'content/documents-page/',
      format: { data: 'json' },
      schema: {
        title: localizedText('Заголовок', { isRequired: true }),
        description: localizedText('Описание', { multiline: true }),
        typeFilterLabel: localizedText('Подпись фильтра типов'),
        languageFilterLabel: localizedText('Подпись фильтра языков'),
        applyLabel: localizedText('Подпись кнопки применения'),
        resetLabel: localizedText('Подпись кнопки сброса'),
        allLanguagesLabel: localizedText('Подпись варианта «Все языки»'),
        downloadLabel: localizedText('Подпись ссылки скачивания'),
        relatedProductsLabel: localizedText('Подпись блока «Подходит для»'),
        emptyStateMessage: localizedText('Сообщение о пустом списке', { multiline: true }),
        resultsLabelTemplate: localizedText('Шаблон количества документов'),
        typeLabels: fields.object(
          {
            certificate: localizedText('Название типа «Сертификат»', { isRequired: true }),
            tds: localizedText('Название типа «ТДС»', { isRequired: true }),
            msds: localizedText('Название типа «МСДС»', { isRequired: true }),
            brochure: localizedText('Название типа «Брошюра»', { isRequired: true }),
          },
          { label: 'Подписи типов документов' }
        ),
        languageLabels: fields.object(
          {
            ru: localizedText('Подпись языка «Русский»', { isRequired: true }),
            en: localizedText('Подпись языка «English»', { isRequired: true }),
          },
          { label: 'Подписи языков' }
        ),
        ogImage: fields.object(
          {
            image: imageField('OG-изображение'),
            alt: fields.text({ label: 'Alt для OG' }),
          },
          { label: 'OG-изображение' }
        ),
      },
    }),
    catalogPage: singleton({
      label: 'Каталог — страница списка',
      path: 'content/catalog-page/',
      format: { data: 'json' },
      schema: {
        title: localizedText('Заголовок', { isRequired: true }),
        description: localizedText('Описание', { multiline: true }),
        submitLabel: localizedText('Подпись кнопки применения фильтров'),
        resetLabel: localizedText('Подпись кнопки сброса фильтров'),
        categoryAllLabel: localizedText('Подпись варианта «Все категории»'),
        detailLabel: localizedText('Подпись ссылки на карточку'),
        emptyStateMessage: localizedText('Сообщение о пустом результате', { multiline: true }),
        groupLabels: fields.object(
          {
            category: localizedText('Заголовок группы «Категория»', { isRequired: true }),
            process: localizedText('Заголовок группы «Процесс»', { isRequired: true }),
            base: localizedText('Заголовок группы «Основа»', { isRequired: true }),
            filler: localizedText('Заголовок группы «Наполнитель»', { isRequired: true }),
            auxiliary: localizedText('Заголовок группы «Вспомогательные»', { isRequired: true }),
          },
          { label: 'Подписи групп фильтров' }
        ),
        seo: localizedSeoGroup(),
      },
    }),
  },
  collections: {
    pages: collection({
      label: 'Страницы',
      path: 'content/pages/*',
      format: { data: 'json' },
      slugField: 'slugKey',
      schema: {
        slugKey: slugKeyField('Страница'),
        id: fields.text({ label: 'ID', validation: { isRequired: true } }),
        published: fields.checkbox({ label: 'Опубликовано', defaultValue: true }),
        slug: localizedSlug('Slug'),
        title: localizedText('Заголовок', { isRequired: true }),
        description: localizedText('Описание', { multiline: true }),
        excerpt: localizedText('Краткое описание', { multiline: true }),
        content: localizedMarkdocContent('Контент (Markdoc)'),
        hero: fields.object(
          {
            image: imageField('Hero-изображение'),
            alt: localizedText('Alt для hero'),
          },
          { label: 'Hero-блок' }
        ),
        seo: localizedSeoGroup(),
        updatedAt: fields.datetime({ label: 'Обновлено' }),
      },
    }),
    posts: collection({
      label: 'Посты',
      path: 'content/posts/*',
      format: { data: 'json' },
      slugField: 'slugKey',
      schema: {
        slugKey: slugKeyField('Пост'),
        id: fields.text({ label: 'ID', validation: { isRequired: true } }),
        published: fields.checkbox({ label: 'Опубликовано', defaultValue: true }),
        date: fields.datetime({ label: 'Дата публикации' }),
        slug: localizedSlug('Slug'),
        title: localizedText('Заголовок', { isRequired: true }),
        description: localizedText('Описание', { multiline: true }),
        excerpt: localizedText('Краткое описание', { multiline: true }),
        content: localizedMarkdocContent('Контент (Markdoc)'),
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
    documents: collection({
      label: 'Документы',
      path: 'content/documents/*',
      format: { data: 'json' },
      slugField: 'slugKey',
      schema: {
        slugKey: slugKeyField('Документ'),
        id: fields.text({ label: 'ID', validation: { isRequired: true } }),
        published: fields.checkbox({ label: 'Опубликовано', defaultValue: true }),
        title: localizedText('Название', { isRequired: true }),
        file: fileField('Файл'),
        type: fields.select({
          label: 'Тип документа',
          options: [
            { label: 'Сертификат', value: 'certificate' },
            { label: 'ТДС', value: 'tds' },
            { label: 'МСДС', value: 'msds' },
            { label: 'Брошюра', value: 'brochure' },
          ],
          defaultValue: 'certificate',
        }),
        lang: fields.select({
          label: 'Язык',
          options: [
            { label: 'Русский', value: 'ru' },
            { label: 'English', value: 'en' },
          ],
          defaultValue: 'ru',
        }),
        relatedProducts: fields.array(
          fields.relationship({
            label: 'Товар',
            collection: 'catalog',
          }),
          {
            label: 'Связанные продукты',
            itemLabel: ({ value }) => value ?? 'Товар',
          }
        ),
        updatedAt: fields.datetime({ label: 'Обновлено' }),
      },
    }),
    catalog: collection({
      label: 'Каталог',
      path: 'content/catalog/*',
      format: { data: 'json' },
      slugField: 'slugKey',
      schema: {
        slugKey: slugKeyField('Товар'),
        published: fields.checkbox({ label: 'Опубликовано', defaultValue: false }),
        slug: localizedSlug('Slug', { isRequired: true }),
        title: localizedText('Название', { isRequired: true }),
        excerpt: localizedText('Краткое описание', { multiline: true, isRequired: true }),
        content: localizedMarkdocContent('Контент (Markdoc)'),
        category: fields.select({
          label: 'Категория',
          options: taxonomyOptions.categories.map(({ value, label }) => ({ label, value })),
          defaultValue: CATALOG_CATEGORIES[0],
        }),
        process: fields.multiselect({
          label: 'Процессы',
          options: taxonomyOptions.processes.map(({ value, label }) => ({ label, value })),
        }),
        base: fields.multiselect({
          label: 'Основа',
          options: taxonomyOptions.bases.map(({ value, label }) => ({ label, value })),
        }),
        filler: fields.multiselect({
          label: 'Наполнитель',
          options: taxonomyOptions.fillers.map(({ value, label }) => ({ label, value })),
        }),
        auxiliary: fields.multiselect({
          label: 'Вспомогательные',
          options: taxonomyOptions.auxiliaries.map(({ value, label }) => ({ label, value })),
        }),
        image: imageField('Изображение'),
        docs: fields.relationship({
          label: 'Документ',
          collection: 'documents',
        }),
        updatedAt: fields.datetime({ label: 'Обновлено' }),
      },
    }),
  },
});