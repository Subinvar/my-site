import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import type { ReactNode } from 'react';

import { SiteShellLayout } from '@/app/(site)/shared/site-shell-layout';
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
import { formatTelegramHandle } from '@/lib/contacts';
import { getSite, getPageBySlug } from '@/lib/keystatic';
import { render } from '@/lib/markdoc';
import { sendContact } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const COPY = {
  ru: {
    title: 'Свяжитесь с нами',
    description: 'Заполните форму или воспользуйтесь контактами — мы ответим на ваш запрос в ближайшее время.',
    dryRunNotice: 'Сейчас форма работает в тестовом режиме: данные не отправляются.',
    name: 'Имя',
    email: 'Email',
    phone: 'Телефон',
    phoneHint: 'Можно оставить телефон или email — достаточно одного контакта.',
    contactRequired: 'Укажите хотя бы email или телефон.',
    productLabel: 'Продукт',
    productHint: 'Если нужно, уточните название продукта или оставьте поле пустым.',
    productPlaceholder: 'Например: ФС-03',
    message: 'Сообщение',
    agree: 'Я согласен на обработку персональных данных',
    submit: 'Отправить',
    success: 'Спасибо! Ваше сообщение отправлено.',
    error: 'Не удалось отправить сообщение. Попробуйте ещё раз.',
  },
  en: {
    title: 'Contact us',
    description: 'Fill out the form or use the details — we will get back to you shortly.',
    dryRunNotice: 'The form is in test mode right now: submissions are not sent.',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    phoneHint: 'You can leave either a phone number or an email — one contact is enough.',
    contactRequired: 'Please provide at least an email or a phone number.',
    productLabel: 'Product',
    productHint: 'You can adjust the product name or leave this field empty.',
    productPlaceholder: 'e.g. FS-03',
    message: 'Message',
    agree: 'I agree to the processing of personal data',
    submit: 'Send',
    success: 'Thank you! Your message has been sent.',
    error: 'We could not send your message. Please try again.',
  },
} satisfies Record<Locale, {
  title: string;
  description: string;
  dryRunNotice: string;
  name: string;
  email: string;
  phone: string;
  phoneHint: string;
  contactRequired: string;
  productLabel: string;
  productHint: string;
  productPlaceholder: string;
  message: string;
  agree: string;
  submit: string;
  success: string;
  error: string;
}>;

type PageParams = { locale: Locale };

type ContactSearchParams = {
  ok?: string | string[] | undefined;
  product?: string | string[] | undefined;
};

type PageProps = {
  params: Promise<PageParams>;
  searchParams?: Promise<ContactSearchParams>;
};

type ContactEntry = {
  id: string;
  content: ReactNode;
  icon: ReactNode;
  href?: string;
  target?: string;
  rel?: string;
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
  const product = typeof rawSearchParams.product === 'string' ? rawSearchParams.product : undefined;
  const isDryRun = process.env.LEADS_DRY_RUN === '1';
  const status = isDryRun ? null : resolveStatus(rawSearchParams.ok);
  const [shell, page] = await Promise.all([
    getSiteShellData(locale),
    getPageBySlug('contacts', locale),
  ]);

  const pageContent = page ? await render(page.content, locale) : null;
  const targetLocale = findTargetLocale(locale);
  const switcherHref = buildPath(targetLocale, ['contacts']);
  const currentPath = buildPath(locale, ['contacts']);
  const copy = COPY[locale];
  const address = shell.site.contacts.address ?? '';
  const phone = shell.site.contacts.phone ?? '';
  const email = shell.site.contacts.email ?? '';
  const telegramUrl = shell.site.contacts.telegramUrl ?? '';
  const telegramLabel = formatTelegramHandle(telegramUrl) ?? telegramUrl;

  const contacts: ContactEntry[] = [];

  if (address) {
    contacts.push({
      id: 'address',
      icon: <MapPin aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.75} />,
      content: <span className="whitespace-pre-line font-medium">{address}</span>,
    });
  }

  if (phone) {
    contacts.push({
      id: 'phone',
      icon: <Phone aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.75} />,
      content: <span className="font-medium">{phone}</span>,
      href: `tel:${phone}`,
    });
  }

  if (email) {
    contacts.push({
      id: 'email',
      icon: <Mail aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.75} />,
      content: <span className="font-medium">{email}</span>,
      href: `mailto:${email}`,
    });
  }

  if (telegramUrl) {
    contacts.push({
      id: 'telegram',
      icon: <Send aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.75} />,
      content: <span className="font-medium">{telegramLabel || telegramUrl}</span>,
      href: telegramUrl,
      target: '_blank',
      rel: 'noreferrer',
    });
  }

  return (
    <SiteShellLayout
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
      currentPath={currentPath}
      currentYear={shell.currentYear}
    >
      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <header className="space-y-3">
            <h1 className="text-3xl font-semibold text-foreground">{copy.title}</h1>
            <p className="text-base text-muted-foreground">{copy.description}</p>
          </header>

          <ContactForm
            copy={copy}
            locale={locale}
            contactsPath={currentPath}
            status={status}
            onSubmitAction={sendContact}
            isDryRun={isDryRun}
            initialProduct={product}
          />
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border shadow-sm">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=37.838%2C55.992%2C37.854%2C56&layer=mapnik&marker=55.996%2C37.845"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-72 w-full border-0"
              title="OpenStreetMap"
            />
          </div>

          {contacts.length ? (
            <div className="space-y-2 rounded-xl border border-border bg-background p-6 shadow-sm">
              {contacts.map((contact) => (
                <ContactRow key={contact.id} {...contact} />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {pageContent ? (
        <div className="mt-10 border-t border-border pt-8">
          <article className="prose-markdoc">
            {pageContent}
          </article>
        </div>
      ) : null}
    </SiteShellLayout>
  );
}

function ContactRow({ icon, content, href, target, rel }: ContactEntry) {
  const inner = (
    <span className="inline-flex items-baseline gap-3 text-base leading-6 text-foreground">
      <span className="text-brand-700" aria-hidden="true">
        {icon}
      </span>
      <span className="break-words">{content}</span>
    </span>
  );

  if (href) {
    return (
      <a
        className="block rounded-lg px-2 py-1.5 transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        href={href}
        target={target}
        rel={rel}
      >
        {inner}
      </a>
    );
  }

  return <div className="px-2 py-1.5">{inner}</div>;
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
  } satisfies Metadata;
}
