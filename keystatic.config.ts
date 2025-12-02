import { collection, config, fields, singleton } from '@keystatic/core';
import type { Dirent } from 'fs';

import taxonomyOptionsFallback from './taxonomy-options.json';

type NodeFsModule = typeof import('fs');
type NodePathModule = typeof import('path');

const isBrowser = typeof window !== 'undefined';

const loadNodeModule = <T>(moduleName: 'fs' | 'path'): T | null => {
  if (isBrowser) return null;

  try {
    const nodeRequire = new Function('return require')();
    return nodeRequire(moduleName) as T;
  } catch {
    return null;
  }
};

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

const localizedMarkdocContent = (label: string, options: LocalizedFieldOptions = {}) => {
  const fieldsByLocale = locales.reduce(
    (acc, locale) => ({
      ...acc,
      [locale]: fields.markdoc({
        label: `${label} (${locale.toUpperCase()})`,
        options: {
          image: {
            directory: 'public/uploads',
            publicPath: '/uploads/',
          },
        },
        extension: 'mdoc',
        validation: options.isRequired ? { isRequired: true } : undefined,
      }),
    }),
    {} as Record<(typeof locales)[number], ReturnType<typeof fields.markdoc>>
  );

  return fields.object(fieldsByLocale, { label });
};

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

const slugField = (entityLabel: string) =>
  fields.slug({
    name: {
      label: `${entityLabel} — название для slug`,
      validation: { isRequired: true },
    },
    slug: {
      label: `${entityLabel} — slug`,
      validation: {
        length: { min: 1 },
      },
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

const storageKind = process.env.KEYSTATIC_STORAGE?.toLowerCase();

const storage =
  storageKind === 'github'
    ? {
        kind: 'github' as const,
        repo: {
          owner: 'Subinvar',
          name: 'my-site',
          branch: 'main',
        },
      }
    : ({
        kind: 'local',
      } as const);

type TaxonomyKey = 'processes' | 'bases' | 'fillers' | 'auxiliaries' | 'metals';

type TaxonomyOption = { label: string; value: string };

const TAXONOMY_DIRECTORIES: Record<TaxonomyKey, string> = {
  processes: 'content/catalog-processes',
  bases: 'content/catalog-bases',
  fillers: 'content/catalog-fillers',
  auxiliaries: 'content/catalog-auxiliaries',
  metals: 'content/catalog-metals',
};

const getTaxonomyLabel = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') return null;
  const label = (data as { label?: Record<string, unknown> }).label;
  if (!label || typeof label !== 'object') return null;

  const ru = label['ru'];
  if (typeof ru === 'string' && ru.trim()) return ru;

  const en = label['en'];
  if (typeof en === 'string' && en.trim()) return en;

  return null;
};

function readTaxonomyOptions(directory: string): TaxonomyOption[] {
  const nodeFs = loadNodeModule<NodeFsModule>('fs');
  const nodePath = loadNodeModule<NodePathModule>('path');

  if (!nodeFs || !nodePath) return [];

  const absoluteDir = nodePath.join(process.cwd(), directory);

  try {
    const entries: Dirent[] = nodeFs.readdirSync(absoluteDir, { withFileTypes: true });

    const optionsWithOrder = entries
      .filter((entry: Dirent) => entry.isDirectory())
      .map((entry: Dirent) => {
        const candidatePath = nodePath.join(absoluteDir, entry.name, 'index.json');
        try {
          const raw = nodeFs.readFileSync(candidatePath, 'utf-8');
          const parsed = JSON.parse(raw) as { value?: unknown; order?: unknown };
          const value = typeof parsed.value === 'string' ? parsed.value : null;
          if (!value) return null;

          const label = getTaxonomyLabel(parsed) ?? value;
          const order = typeof parsed.order === 'number' ? parsed.order : 0;
          return { value, label, order } as const;
        } catch {
          return null;
        }
      })
      .filter(
        (
          entry
        ): entry is {
          value: string;
          label: string;
          order: number;
        } => Boolean(entry)
      );

    return optionsWithOrder
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.label.localeCompare(b.label, 'ru');
      })
      .map(({ value, label }) => ({ value, label } satisfies TaxonomyOption));
  } catch {
    return [];
  }
}

const withFallbackOptions = (key: TaxonomyKey, values: TaxonomyOption[]): TaxonomyOption[] => {
  if (values.length > 0) return values;

  const fallback = taxonomyOptionsFallback[key] ?? [];
  return fallback.map(({ value, label }) => ({ value, label }));
};

const taxonomyOptions: Record<TaxonomyKey, TaxonomyOption[]> = {
  processes: withFallbackOptions(
    'processes',
    readTaxonomyOptions(TAXONOMY_DIRECTORIES.processes)
  ),
  bases: withFallbackOptions('bases', readTaxonomyOptions(TAXONOMY_DIRECTORIES.bases)),
  fillers: withFallbackOptions(
    'fillers',
    readTaxonomyOptions(TAXONOMY_DIRECTORIES.fillers)
  ),
  auxiliaries: withFallbackOptions(
    'auxiliaries',
    readTaxonomyOptions(TAXONOMY_DIRECTORIES.auxiliaries)
  ),
  metals: withFallbackOptions('metals', readTaxonomyOptions(TAXONOMY_DIRECTORIES.metals)),
};

const taxonomyMultiselect = (label: string, key: TaxonomyKey) =>
  fields.multiselect({
    label,
    options: taxonomyOptions[key],
  });

export default config({
  storage,
  singletons: {
    site: singleton({
      label: 'Настройки и SEO сайта',
      path: 'content/site/',
      format: { data: 'json' },
      schema: {
        siteName: localizedText('Название сайта', { isRequired: true }),
        tagline: localizedText('Слоган', { multiline: true }),
        contacts: fields.object({
          email: fields.text({ label: 'E-mail' }),
          phone: fields.text({ label: 'Телефон' }),
          telegramUrl: fields.text({ label: 'Telegram (ссылка)' }),
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
    home: singleton({
      label: 'Главная / Home',
      path: 'content/home/',
      format: { data: 'json' },
      schema: {
        hero: fields.object(
          {
            title: localizedText('Hero — заголовок'),
            subtitle: localizedText('Hero — подзаголовок', { multiline: true }),
            preheading: localizedText('Hero — маленькая подпись над заголовком'),
            primaryCtaLabel: localizedText('Hero — текст основной кнопки'),
            primaryCtaHref: localizedText('Hero — ссылка основной кнопки'),
            secondaryCtaLabel: localizedText('Hero — текст второй кнопки'),
            secondaryCtaHref: localizedText('Hero — ссылка второй кнопки'),
          },
          { label: 'Hero' }
        ),

        directions: fields.array(
          fields.object(
            {
              key: fields.text({
                label: 'Ключ (binders/coatings/aux)',
                validation: { isRequired: true },
              }),
              title: localizedText('Название направления'),
              description: localizedText('Краткое описание', { multiline: true }),
              href: localizedText('Ссылка (href)'),
            },
            { label: 'Направление' }
          ),
          {
            label: 'Направления продукции',
            itemLabel: ({
              fields,
            }: {
              fields: { key: { value: string | null | undefined } };
            }) => fields.key.value || 'Направление',
          }
        ),

        about: fields.object(
          {
            title: localizedText('О компании — заголовок'),
            paragraph1: localizedText('О компании — абзац 1', { multiline: true }),
            paragraph2: localizedText('О компании — абзац 2', { multiline: true }),
            ctaLabel: localizedText('О компании — текст кнопки'),
            ctaHref: localizedText('О компании — ссылка кнопки'),
          },
          { label: 'Блок «О компании»' }
        ),

        stats: fields.array(
          fields.object(
            {
              label: localizedText('Подпись'),
              value: localizedText('Значение'),
            },
            { label: 'Показатель' }
          ),
          {
            label: 'Интема Групп в цифрах',
            itemLabel: ({
              fields,
            }: {
              fields: {
                label: { value?: { ru?: string | null; en?: string | null } | null };
              };
            }) => fields.label.value?.ru || fields.label.value?.en || 'Показатель',
          }
        ),

        newsIntro: fields.object(
          {
            title: localizedText('Новости — заголовок'),
            description: localizedText('Новости — описание', { multiline: true }),
          },
          { label: 'Новости — вводный блок' }
        ),

        partnersIntro: fields.object(
          {
            title: localizedText('Партнёры — заголовок'),
            description: localizedText('Партнёры — описание', { multiline: true }),
          },
          { label: 'Партнёры — вводный блок' }
        ),
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
        feed: fields.object(
          {
            meta: fields.object(
              {
                selfLabel: localizedText('Подпись ссылки на ленту', { isRequired: true }),
                updatedLabel: localizedText('Подпись даты обновления ленты', { isRequired: true }),
              },
              { label: 'Метаданные ленты' }
            ),
            columns: fields.object(
              {
                entry: localizedText('Название колонки «Запись»', { isRequired: true }),
                published: localizedText('Название колонки «Опубликовано»', { isRequired: true }),
                updated: localizedText('Название колонки «Обновлено»', { isRequired: true }),
              },
              { label: 'Колонки таблицы ленты' }
            ),
          },
          { label: 'Лента' }
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
        sitemap: fields.object(
          {
            pageTitle: localizedText('Заголовок страницы карты сайта', { isRequired: true }),
            columns: fields.object(
              {
                page: localizedText('Название колонки «Страница»', { isRequired: true }),
                alternates: localizedText('Название колонки «Альтернативные языки»', { isRequired: true }),
                updated: localizedText('Название колонки «Обновлено»', { isRequired: true }),
              },
              { label: 'Колонки таблицы карты сайта' }
            ),
          },
          { label: 'Карта сайта' }
        ),
        productDirections: fields.object(
          {
            sectionHeading: localizedText('Заголовок секции «Продукция»'),
            sectionDescription: localizedText('Описание секции «Продукция»'),
            ctaLabel: localizedText('Текст кнопки витрины'),

            categories: fields.object({
              binders: fields.object({
                title: localizedText('Название направления «Связующие»'),
                description: localizedText('Описание направления «Связующие»'),
              }),
              coatings: fields.object({
                title: localizedText('Название направления «Противопригарные покрытия»'),
                description: localizedText('Описание направления «Противопригарные покрытия»'),
              }),
              auxiliaries: fields.object({
                title: localizedText('Название направления «Вспомогательные материалы»'),
                description: localizedText('Описание направления «Вспомогательные материалы»'),
              }),
            }),
          },
          {
            label: 'Витрина направлений продукции',
          }
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
        requestLabel: localizedText('Подпись кнопки «Запросить КП» в карточке'),
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
    catalogCategories: collection({
      label: 'Каталог — направления',
      path: 'content/catalog-categories/*/index',
      format: { data: 'json' },
      slugField: 'value',
      schema: {
        value: slugField('Категория'),
        label: localizedText('Подпись категории', { isRequired: true }),
        isAuxiliaryCategory: fields.checkbox({
          label: 'Категория для вспомогательных материалов',
          defaultValue: false,
        }),
      },
    }),
    catalogProcesses: collection({
      label: 'Каталог — процессы',
      path: 'content/catalog-processes/*/index',
      format: { data: 'json' },
      slugField: 'value',
      schema: {
        value: slugField('Процесс'),
        label: localizedText('Подпись процесса', { isRequired: true }),
        order: fields.integer({ label: 'Порядок', defaultValue: 0 }),
      },
    }),
    catalogBases: collection({
      label: 'Каталог — типы покрытий',
      path: 'content/catalog-bases/*/index',
      format: { data: 'json' },
      slugField: 'value',
      schema: {
        value: slugField('Основа покрытия'),
        label: localizedText('Подпись основы', { isRequired: true }),
        order: fields.integer({ label: 'Порядок', defaultValue: 0 }),
      },
    }),
    catalogFillers: collection({
      label: 'Каталог — наполнители',
      path: 'content/catalog-fillers/*/index',
      format: { data: 'json' },
      slugField: 'value',
      schema: {
        value: slugField('Наполнитель'),
        label: localizedText('Подпись наполнителя', { isRequired: true }),
        order: fields.integer({ label: 'Порядок', defaultValue: 0 }),
      },
    }),
    catalogMetals: collection({
      label: 'Каталог — металлы',
      path: 'content/catalog-metals/*/index',
      format: { data: 'json' },
      slugField: 'value',
      schema: {
        value: slugField('Металл'),
        label: localizedText('Подпись металла', { isRequired: true }),
        order: fields.integer({ label: 'Порядок', defaultValue: 0 }),
      },
    }),
    catalogAuxiliaries: collection({
      label: 'Каталог — вспомогательные направления',
      path: 'content/catalog-auxiliaries/*/index',
      format: { data: 'json' },
      slugField: 'value',
      schema: {
        value: slugField('Вспомогательное направление'),
        label: localizedText('Подпись направления', { isRequired: true }),
        order: fields.integer({ label: 'Порядок', defaultValue: 0 }),
      },
    }),
    pages: collection({
      label: 'Страницы',
      path: 'content/pages/*/index',
      format: { data: 'json' },
      slugField: 'slugKey',
      schema: {
        slugKey: slugField('Страница'),
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
      path: 'content/posts/*/index',
      format: { data: 'json' },
      slugField: 'slugKey',
      schema: {
        slugKey: slugField('Пост'),
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
          itemLabel: (props: { value?: string | null }) => props.value ?? 'Тег',
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
      path: 'content/documents/*/index',
      format: { data: 'json' },
      slugField: 'slugKey',
      schema: {
        slugKey: slugField('Документ'),
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
            itemLabel: ({ value }: { value?: string | null }) => value ?? 'Товар',
          }
        ),
        updatedAt: fields.datetime({ label: 'Обновлено' }),
      },
    }),
  catalog: collection({
    label: 'Каталог',
    path: 'content/catalog/*/index',
    format: { data: 'json' },
    slugField: 'slugKey',
    // Keystatic не переименовывает папку при изменении slugKey:
    // запись считается новой и сохраняется в отдельную директорию.
    // Старый путь остаётся на диске до ручной очистки (мы чистим пустые
    // каталоги при чтении на стороне Next.js).
    schema: {
      slugKey: slugField('Товар'),
        published: fields.checkbox({ label: 'Опубликовано', defaultValue: false }),
        slug: localizedSlug('Slug', { isRequired: true }),
        title: localizedText('Название', { isRequired: true }),
        excerpt: localizedText('Краткое описание', { multiline: true, isRequired: true }),
        content: localizedMarkdocContent('Контент (Markdoc)', { isRequired: true }),
        category: fields.relationship({
          label: 'Категория',
          collection: 'catalogCategories',
          validation: { isRequired: true },
        }),
        process: taxonomyMultiselect('Процессы', 'processes'),
        base: taxonomyMultiselect('Основы', 'bases'),
        filler: taxonomyMultiselect('Наполнители', 'fillers'),
        metals: taxonomyMultiselect('Металл', 'metals'),
        auxiliary: taxonomyMultiselect('Вспомогательные', 'auxiliaries'),
        image: imageField('Изображение'),
        docs: fields.relationship({
          label: 'Документ',
          collection: 'documents',
        }),
        updatedAt: fields.datetime({ label: 'Обновлено' }),
      },
    }),
  },
  ui: {
    navigation: {
      'Каталог': [
        'catalogCategories',
        'catalogProcesses',
        'catalogBases',
        'catalogFillers',
        'catalogMetals',
        'catalogAuxiliaries',
        'catalog',
      ],
      'Контент': ['home', 'pages', 'posts', 'documents'],
      'Настройки': [
        'site',
        'navigation',
        'dictionary',
        'documentsPage',
        'catalogPage',
      ],
    },
  },
});