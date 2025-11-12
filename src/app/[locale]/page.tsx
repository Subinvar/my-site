import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n';
import {
  getHomePage,
  getHomeStaticLocales,
  resolveHomeMetadata,
} from '@/app/(site)/shared/home-page';

export const dynamic = 'force-static';

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const data = await getHomePage(locale);
  if (!data) {
    notFound();
  }

  const { page, content, summary } = data;

  return (
    <article className="prose prose-zinc max-w-none dark:prose-invert">
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
      <div className="prose-h2:mt-8 prose-h3:mt-6 prose-p:leading-relaxed">{content}</div>
    </article>
  );
}

export async function generateStaticParams(): Promise<Array<{ locale: Locale }>> {
  const locales = await getHomeStaticLocales();
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }
  const locale = rawLocale;
  return resolveHomeMetadata(locale);
}