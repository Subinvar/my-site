import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getCatalogProductPage, getLocalizedCatalogParams, resolveCatalogProductMetadata } from '@/app/(site)/shared/catalog';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { findTargetLocale, switchLocalePath } from '@/lib/paths';
import { isLocale, type Locale } from '@/lib/i18n';

const ATTRIBUTE_LABELS: Record<Locale, { category: string; process: string; base: string; filler: string }> = {
  ru: {
    category: 'Категория',
    process: 'Процессы',
    base: 'Основы',
    filler: 'Наполнители',
  },
  en: {
    category: 'Category',
    process: 'Processes',
    base: 'Bases',
    filler: 'Fillers',
  },
};

const SUMMARY_LABEL: Record<Locale, string> = {
  ru: 'Кратко о продукте',
  en: 'Product summary',
};

type CatalogProductPageProps = {
  params: { locale: Locale; slug: string } | Promise<{ locale: Locale; slug: string }>;
};

export default async function CatalogProductPage({ params }: CatalogProductPageProps) {
  const { locale: rawLocale, slug } = await Promise.resolve(params);

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const [data, shell] = await Promise.all([
    getCatalogProductPage(locale, slug),
    getSiteShellData(locale),
  ]);

  if (!data) {
    notFound();
  }

  const { item, content, summary } = data;
  const targetLocale = findTargetLocale(locale);
  const switcherHref = switchLocalePath(locale, targetLocale, {
    collection: 'catalog',
    slugs: item.slugByLocale,
  });
  const attributes = ATTRIBUTE_LABELS[locale];
  const categoryValue = item.category ?? '—';

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
    >
      <article className="space-y-10">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-wide text-zinc-500">{attributes.category}: {categoryValue}</p>
          <h1 className="text-3xl font-semibold text-zinc-900">{item.title}</h1>
          {summary ? (
            <p className="text-base text-zinc-600" aria-label={SUMMARY_LABEL[locale]}>
              {summary}
            </p>
          ) : null}
        </header>
        {item.image ? (
          <Image
            src={item.image.src}
            alt={item.title}
            width={item.image.width ?? 1200}
            height={item.image.height ?? 675}
            className="h-auto w-full rounded-lg object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        ) : null}
        <section className="grid gap-4 md:grid-cols-2">
          <AttributeList label={attributes.process} values={item.process} />
          <AttributeList label={attributes.base} values={item.base} />
          <AttributeList label={attributes.filler} values={item.filler} />
        </section>
        <div className="prose-markdoc">{content}</div>
      </article>
    </SiteShell>
  );
}

type AttributeListProps = {
  label: string;
  values: readonly string[];
};

function AttributeList({ label, values }: AttributeListProps) {
  const hasValues = Array.isArray(values) && values.length > 0;
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{label}</h3>
      <p className="mt-1 text-sm text-zinc-700">{hasValues ? values.join(', ') : '—'}</p>
    </div>
  );
}

export async function generateStaticParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  return getLocalizedCatalogParams();
}

export async function generateMetadata({ params }: CatalogProductPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await Promise.resolve(params);
  if (!isLocale(rawLocale)) {
    return {};
  }
  return resolveCatalogProductMetadata(rawLocale, slug);
}