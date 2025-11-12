import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isLocale } from '@/lib/i18n';
import {
  getContentPage,
  getLocalizedPageParams,
  resolveContentPageMetadata,
} from '@/app/(site)/shared/content-page';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const data = await getContentPage(locale, slug);
  if (!data) {
    notFound();
  }

  const { page, content, summary } = data;

  return (
    <article className="prose prose-zinc max-w-none dark:prose-invert">
      <header className="mb-10 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">{page.title}</h1>
        {summary ? <p className="text-lg text-zinc-600">{summary}</p> : null}
      </header>
      <div className="prose-h2:mt-8 prose-h3:mt-6 prose-p:leading-relaxed">{content}</div>
    </article>
  );
}

export async function generateStaticParams() {
  return getLocalizedPageParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }
  const locale = rawLocale;
  return resolveContentPageMetadata(locale, slug);
}