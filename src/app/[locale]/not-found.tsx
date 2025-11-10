import Link from 'next/link';
import { headers } from 'next/headers';
import { buildPath } from '@/lib/paths';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';

const NOT_FOUND_COPY: Record<Locale, { title: string; description: string; back: string }> = {
  ru: {
    title: 'Страница не найдена',
    description: 'Кажется, такого материала у нас пока нет. Попробуйте начать с главной страницы.',
    back: 'На главную',
  },
  en: {
    title: 'Page not found',
    description: 'We could not find this page. Start from the homepage or explore recent posts.',
    back: 'Back to home',
  },
};

async function resolveLocaleFromHeaders(): Promise<Locale> {
  const headerList = await Promise.resolve(headers());
  const candidate =
    headerList.get('x-invoke-path') ?? headerList.get('x-matched-path') ?? headerList.get('x-next-url') ?? `/${defaultLocale}`;
  const segments = candidate.split('?')[0]?.split('#')[0]?.split('/') ?? [];
  for (const segment of segments) {
    if (isLocale(segment)) {
      return segment;
    }
  }
  return defaultLocale;
}

export default async function LocaleNotFound() {
  const locale = await resolveLocaleFromHeaders();
  const copy = NOT_FOUND_COPY[locale];
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 py-24">
      <h1 className="text-4xl font-semibold text-zinc-900">{copy.title}</h1>
      <p className="text-lg text-zinc-600">{copy.description}</p>
      <Link
        href={buildPath(locale)}
        className="rounded-full border border-zinc-900 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-zinc-900 transition hover:bg-zinc-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {copy.back}
      </Link>
    </section>
  );
}