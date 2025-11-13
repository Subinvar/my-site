import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n';
import {
  getHomePage,
  getHomeStaticLocales,
  resolveHomeMetadata,
} from '@/app/(site)/shared/home-page';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { findTargetLocale, switchLocalePath } from '@/lib/paths';

export const dynamic = 'force-static';

type PageProps = {
  params: { locale: Locale };
};

export default async function HomePage({ params }: PageProps) {
  const { locale: rawLocale } = params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const [data, shell] = await Promise.all([
    getHomePage(locale),
    getSiteShellData(locale),
  ]);

  if (!data) {
    notFound();
  }

  const { page, content, summary } = data;
  const targetLocale = findTargetLocale(locale);
  const switcherHref = switchLocalePath(locale, targetLocale, {
    collection: 'pages',
    slugs: page.slugByLocale,
  });

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
    >
      <article className="max-w-none">
        <header className="mb-10 space-y-4">
          {/* LCP hero image stored in public/uploads/hero.jpg */}
          <Image
            src="/uploads/hero.jpg"
            alt={page.title}
            width={1200}
            height={675}
            priority
            sizes="(max-width: 768px) 100vw, 1200px"
            className="h-auto w-full rounded-xl object-cover"
          />
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900">{page.title}</h1>
            {summary ? <p className="text-lg text-zinc-600">{summary}</p> : null}
          </div>
        </header>
        <div className="prose-markdoc">{content}</div>
      </article>
    </SiteShell>
  );
}

export async function generateStaticParams(): Promise<Array<{ locale: Locale }>> {
  const locales = await getHomeStaticLocales();
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = params;
  if (!isLocale(rawLocale)) {
    return {};
  }
  const locale = rawLocale;
  return resolveHomeMetadata(locale);
}