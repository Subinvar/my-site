# My Site

Это многоязычный сайт на Next.js 16 с интеграцией [Keystatic](https://keystatic.com) для редактирования контента через GitHub.

## Getting Started

## Быстрый старт

```bash
pnpm install
pnpm dev
```
Приложение будет доступно на [http://localhost:3000](http://localhost:3000).

## Переменные окружения

Для сборки и работы Keystatic в GitHub-режиме необходимо добавить переменные в `.env.local` (локально) и в настройках окружений (например, на Vercel):

```ini
KEYSTATIC_GITHUB_CLIENT_ID=...
KEYSTATIC_GITHUB_CLIENT_SECRET=...
KEYSTATIC_SECRET=...
NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=...
```

- `KEYSTATIC_GITHUB_CLIENT_ID` и `KEYSTATIC_GITHUB_CLIENT_SECRET` — параметры OAuth-приложения GitHub.
- `KEYSTATIC_SECRET` — секрет для подписи токенов Keystatic.
- `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` — slug установленного GitHub App.

> ⚠️ Не коммитьте реальные значения секретов в репозиторий.

Для совместимости с локальными сертификатами Node.js при желании можно включить:

```ini
NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1
```

## Полезные команды

| Задача | Команда |
| --- | --- |
| Проверка типов | `pnpm exec tsc -b --noEmit` |
| Линтер (поймать проблемы с код-стайлом и импортами) | `pnpm lint` |
| Production-сборка | `pnpm build` |
| Проверка production-сборки локально | `pnpm start` |

Перед релизом убедитесь, что проверки (`tsc`, `lint`, `build`) проходят без ошибок, а `pnpm start` запускает собранное приложение без падений.

## Дополнительные ссылки

- [Документация Next.js](https://nextjs.org/docs)
- [Документация Keystatic](https://keystatic.com/docs)