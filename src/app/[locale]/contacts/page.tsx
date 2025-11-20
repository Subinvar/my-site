import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { ContactForm } from '@/app/(site)/shared/contact-form';
import { isLocale, locales, type Locale } from '@/lib/i18n';
import { findTargetLocale, buildPath } from '@/lib/paths';
import {
  HREFLANG_CODE,
  OPEN_GRAPH_LOCALE,
  buildAlternates,
  mergeSeo,
  resolveOpenGraphImage,
  resolveRobotsMeta,
} from '@/lib/seo';
import { getSite } from '@/lib/keystatic';
import { sendContact } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const COPY = {
  ru: {
    title: 'Свяжитесь с нами',
    description: 'Заполните форму или воспользуйтесь контактами — мы ответим на ваш запрос в ближайшее время.',
    name: 'Имя',
    email: 'Email',
    phone: 'Телефон',
    phoneHint: 'Можно оставить телефон или email — достаточно одного контакта.',
    message: 'Сообщение',
    agree: 'Я согласен на обработку персональных данных',
    submit: 'Отправить',
    success: 'Спасибо! Ваше сообщение отправлено.',
    error: 'Не удалось отправить сообщение. Попробуйте ещё раз.',
  },
  en: {
    title: 'Contact us',
    description: 'Fill out the form or use the details — we will get back to you shortly.',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    phoneHint: 'You can leave either a phone number or an email — one contact is enough.',
    message: 'Message',
    agree: 'I agree to the processing of personal data',
    submit: 'Send',
    success: 'Thank you! Your message has been sent.',
    error: 'We could not send your message. Please try again.',
  },
} satisfies Record<Locale, {
  title: string;
  description: string;
  name: string;
  email: string;
  phone: string;
  phoneHint: string;
  message: string;
  agree: string;
  submit: string;
  success: string;
  error: string;
}>;

type PageParams = { locale: Locale };

type ContactSearchParams = {
  ok?: string | string[] | undefined;
};

type PageProps = {
  params: Promise<PageParams>;
  searchParams?: Promise<ContactSearchParams>;
};

function resolveStatus(rawStatus: string | string[] | undefined): 'success' | 'error' | null {
  const status = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  if (status === '1') return 'success';
  if (status === '0') return 'error';
  return null;
}

export default async function ContactsPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const rawSearchParams = await (searchParams ?? Promise.resolve<ContactSearchParams>({}));

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const isDryRun = process.env.LEADS_DRY_RUN !== '0';
  const status = isDryRun ? 'success' : resolveStatus(rawSearchParams.ok);
  const shell = await getSiteShellData(locale);
  const targetLocale = findTargetLocale(locale);
  const switcherHref = buildPath(targetLocale, ['contacts']);
  const currentPath = buildPath(locale, ['contacts']);
  const copy = COPY[locale];
  const address = shell.site.contacts.address ?? '';
  const phone = shell.site.contacts.phone ?? '';
  const email = shell.site.contacts.email ?? '';

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
      currentPath={currentPath}
    >
      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <header className="space-y-3">
            <h1 className="text-3xl font-semibold text-zinc-900">{copy.title}</h1>
            <p className="text-base text-zinc-600">{copy.description}</p>
          </header>

          <ContactForm
            copy={copy}
            locale={locale}
            contactsPath={currentPath}
            status={status}
            onSubmitAction={sendContact}
            isDryRun={isDryRun}
          />
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=37.838%2C55.992%2C37.854%2C56&layer=mapnik&marker=55.996%2C37.845"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-72 w-full border-0"
              title="OpenStreetMap"
            />
          </div>

          <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            {address ? <p className="text-base font-medium text-zinc-900">{address}</p> : null}
            {phone ? (
              <a
                className="block text-sm text-blue-700 underline underline-offset-4 hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                href={`tel:${phone}`}
              >
                {phone}
              </a>
            ) : null}
            {email ? (
              <a
                className="block text-sm text-blue-700 underline underline-offset-4 hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                href={`mailto:${email}`}
              >
                {email}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await Promise.resolve(params);

  if (!isLocale(rawLocale)) {
    return {};
  }

  const locale = rawLocale;
  const site = await getSite(locale);
  const defaults = { title: COPY[locale].title, description: COPY[locale].description };
  const mergedSeo = mergeSeo({ site: site.seo, defaults });

  const slugMap = locales.reduce<Partial<Record<Locale, string>>>((acc, currentLocale) => {
    acc[currentLocale] = buildPath(currentLocale, ['contacts']);
    return acc;
  }, {});
  const alternates = buildAlternates({ locale, slugMap, canonicalBase: site.seo.canonicalBase });
  const pageUrl = alternates.languages[HREFLANG_CODE[locale]] ?? alternates.canonical;
  const ogImage = resolveOpenGraphImage(mergedSeo.ogImage, site.seo.canonicalBase);

  return {
    title: mergedSeo.title,
    description: mergedSeo.description,
    alternates,
    robots: resolveRobotsMeta(site.robots),
    openGraph: {
      type: 'website',
      locale: OPEN_GRAPH_LOCALE[locale],
      url: pageUrl,
      title: mergedSeo.ogTitle ?? mergedSeo.title,
      description: mergedSeo.ogDescription ?? mergedSeo.description,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      site: mergedSeo.twitterHandle,
      title: mergedSeo.ogTitle ?? mergedSeo.title,
      description: mergedSeo.ogDescription ?? mergedSeo.description,
      images: ogImage ? [ogImage.url] : undefined,
    },
  } satisfies Metadata;
}
