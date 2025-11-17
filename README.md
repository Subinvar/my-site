# My Site

Интема Групп — многоязычный корпоративный сайт на Next.js 16 с интеграцией [Keystatic](https://keystatic.com) для редактирования контента напрямую из GitHub. Репозиторий уже настроен для русской (по умолчанию) и английской локалей, генерации Atom-лент, sitemap, а также для предпросмотра и публикации статей блога.

## Обзор стека

- **Next.js 16 (App Router)** — серверный рендеринг, статическая генерация и динамические маршруты для локалей.
- **TypeScript** — строгая типизация UI и серверного кода.
- **Keystatic** — headless CMS с GitHub-потоком и UI по адресу `/keystatic`.
- **Tailwind/PostCSS** — стилизация компонентов и глобальных стилей.
- **pnpm** — менеджер пакетов и монорепозиторный workspace.

## Быстрый старт

```bash
pnpm install
pnpm dev
```

После запуска приложение доступно на [http://localhost:3000](http://localhost:3000). Интерфейс Keystatic (редактор контента) открыт по адресу [http://localhost:3000/keystatic](http://localhost:3000/keystatic).

## Переменные окружения

Для сборки и работы Keystatic в GitHub-режиме нужно создать файл `.env.local` (локально) и добавить переменные в настройках продакшн-окружения (например, Vercel):

```ini
KEYSTATIC_GITHUB_CLIENT_ID=...
KEYSTATIC_GITHUB_CLIENT_SECRET=...
KEYSTATIC_SECRET=...
NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=...
```

- `KEYSTATIC_GITHUB_CLIENT_ID` и `KEYSTATIC_GITHUB_CLIENT_SECRET` — данные OAuth-приложения GitHub.
- `KEYSTATIC_SECRET` — секрет для подписи токенов Keystatic.
- `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` — slug установленного GitHub App.

> ⚠️ Не коммитьте реальные значения секретов в репозиторий.

При необходимости для работы с системными сертификатами Node.js можно включить:

```ini
NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1
```

## Структура контента

- `content/site/index.json` — глобальные настройки (название, контакты, SEO, домен).
- `content/pages/<slug>/index.json` — данные страниц «Главная» и «О компании» на двух языках. Сам контент хранится в файлах `content/pages/<slug>/content/{locale}.mdoc`.
- `content/catalog/<slug>/index.json` — карточки продуктов каталога с локализованными слагами, характеристиками и Markdoc-контентом в `content/catalog/<slug>/content/{locale}.mdoc`.
- `content/posts/<slug>/index.json` — метаданные записей блога, а тексты лежат в `content/posts/<slug>/content/{locale}.mdoc`.
- `content/documents/<slug>/index.json` — карточки документов и сертификатов с типом, языком, файлом и связью с продуктами каталога.
- `content/documents-page/index.json` — тексты и подписи для страницы «Документы и сертификаты», включая фильтры.
- `public/uploads` — изображения для страниц и social preview.

Все коллекции синхронизируются через Keystatic: при редактировании в UI изменения пишутся в Git и доступны через Pull Request.

## Полезные команды

| Задача | Команда |
| --- | --- |
| Проверка типов | `pnpm exec tsc -b --noEmit` |
| Линтер (код-стайл и импорты) | `pnpm lint` |
| Production-сборка | `pnpm build` |
| Проверка production-сборки локально | `pnpm start` |

Перед релизом убедитесь, что все проверки (`tsc`, `lint`, `build`) выполняются без ошибок, а `pnpm start` успешно поднимает собранное приложение.

## Каталог продукции

- Страница списка каталога доступна по адресу `/catalog` (русская локаль) и `/en/catalog` (английская локаль). На ней есть фильтры по категории, процессу, основе и наполнителю — они читаются из `src/lib/catalog/constants.ts`.
- Детальные страницы продуктов формируются из файлов `content/catalog/<slug>/index.json` и Markdoc-описаний в `content/catalog/<slug>/content/{locale}.mdoc`. Слаг из JSON-файла определяет URL, например: `svyazuyushchee-alpha-pep` → `/catalog/svyazuyushchee-alpha-pep` и `/en/catalog/alpha-pep-binder`.
- Чтобы добавить новый продукт, создайте папку в `content/catalog/`, заполните `index.json` через Keystatic и отредактируйте локализованные `.mdoc` файлы прямо в админке. Keystatic автоматически предложит шаблон и обеспечит предпросмотр страницы.
- После публикации нового продукта не забудьте обновить файл `SITEMAP`, чтобы зафиксировать новые маршруты для контента.

## Документы и сертификаты

- Страница «Документы и сертификаты» доступна по адресам `/documents` и `/en/documents`; на ней есть фильтры по типу документа, языку файла и подходящим продуктам.
- Описания страницы (заголовок, подписи фильтров, текст заглушки) лежат в `content/documents-page/index.json` и редактируются через Keystatic.
- Сами карточки документов находятся в `content/documents/<slug>/index.json`. В них можно указать тип (`certificate`, `tds`, `msds`, `brochure`), язык файла (`ru` или `en`), загрузить сам файл и привязать связанные продукты каталога.
- Чтобы добавить документ, откройте коллекцию **Документы** в Keystatic, создайте запись, загрузите файл и, при необходимости, выберите связанные товары. После сохранения документ появится в списке и будет доступен для скачивания.
- При появлении новых документов или изменении маршрутов также вносите ссылки в `SITEMAP` (раздел «Документы и сертификаты»), чтобы поддерживать актуальную карту сайта.

## Сборка и деплой

1. Прогоните `pnpm lint`, `pnpm exec tsc -b --noEmit` и `pnpm build` на CI или локально.
2. Залейте изменения в основную ветку. Vercel (или другой хостинг) подтянет конфиг и запустит production-сборку.
3. Проверьте, что sitemap (`/sitemap.xml`), Atom-ленты (`/feed.xml`, `/en/feed.xml`) и публичные страницы открываются без ошибок.

## Полезные ссылки

- [Документация Next.js](https://nextjs.org/docs)
- [Документация Keystatic](https://keystatic.com/docs)