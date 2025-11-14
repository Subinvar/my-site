import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { getHomePage, resolveHomeMetadata } from '@/app/(site)/shared/home-page';
import { switchLocalePath, findTargetLocale } from '@/lib/paths';
import { defaultLocale } from '@/lib/i18n';

export const dynamic = 'force-static';

export default async function RootHomePage() {
  const locale = defaultLocale;
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
  const heroImage = page.hero?.image;
  const heroAlt = page.hero?.alt ?? page.title;

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
          {heroImage ? (
            <Image
              src={heroImage.src}
              alt={heroAlt}
              width={heroImage.width ?? 1200}
              height={heroImage.height ?? 675}
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
              className="h-auto w-full rounded-xl object-cover"
            />
          ) : null}
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

export async function generateMetadata(): Promise<Metadata> {
  return resolveHomeMetadata(defaultLocale);
}