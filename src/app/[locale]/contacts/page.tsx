import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createTransport } from 'nodemailer';

import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
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

type PageProps = {
  params: { locale: Locale } | Promise<{ locale: Locale }>;
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
};

function resolveStatus(rawStatus: string | string[] | undefined): 'success' | 'error' | null {
  const status = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  if (status === '1') return 'success';
  if (status === '0') return 'error';
  return null;
}

export async function sendContact(formData: FormData) {
  'use server';

  const rawLocale = formData.get('locale')?.toString() ?? 'ru';
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ru';
  const successRedirect = `/${locale}/contacts?ok=1`;
  const errorRedirect = `/${locale}/contacts?ok=0`;

  const honeypot = formData.get('company')?.toString().trim();
  if (honeypot) {
    redirect(errorRedirect);
  }

  const name = formData.get('name')?.toString().trim() ?? '';
  const email = formData.get('email')?.toString().trim() ?? '';
  const phoneRaw = formData.get('phone')?.toString() ?? '';
  const phone = phoneRaw.replace(/[^\d+]/g, '');
  const message = formData.get('message')?.toString().trim() ?? '';
  const agree = formData.get('agree') === 'on';

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasEmail = email.length > 0 && emailPattern.test(email);
  const hasPhone = phone.length >= 7 && phone.length <= 15;

  if (name.length < 2 || name.length > 100) {
    redirect(errorRedirect);
  }

  if (!(hasEmail || hasPhone)) {
    redirect(errorRedirect);
  }

  if (message.length < 10 || message.length > 2000) {
    redirect(errorRedirect);
  }

  if (!agree) {
    redirect(errorRedirect);
  }

  await new Promise((resolve) => setTimeout(resolve, 400));

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT ?? 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const leadsTo = process.env.LEADS_TO;

  if (!smtpHost || !smtpUser || !smtpPass || !leadsTo || Number.isNaN(smtpPort)) {
    redirect(errorRedirect);
  }

  try {
    const transporter = createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpUser,
      to: leadsTo,
      subject: `[${locale.toUpperCase()}] Contact form: ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email || '-'}`,
        `Phone: ${phone || '-'}`,
        '',
        message,
      ].join('\n'),
      replyTo: hasEmail ? email : undefined,
    });
  } catch (error) {
    redirect(errorRedirect);
  }

  redirect(successRedirect);
}

export default async function ContactsPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await Promise.resolve(params);
  const rawSearchParams = await Promise.resolve(searchParams ?? {});

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const status = resolveStatus(rawSearchParams.ok);
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

          {status === 'success' ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {copy.success}
            </div>
          ) : null}
          {status === 'error' ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {copy.error}
            </div>
          ) : null}

          <form
            action={sendContact}
            method="post"
            className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <input type="hidden" name="locale" value={locale} />
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-900" htmlFor="name">
                {copy.name}
              </label>
              <input
                id="name"
                name="name"
                required
                minLength={2}
                maxLength={100}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-900" htmlFor="email">
                  {copy.email}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-900" htmlFor="phone">
                  {copy.phone}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  pattern="[0-9+()\s-]{7,}"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <p className="text-sm text-zinc-500">{copy.phoneHint}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-900" htmlFor="message">
                {copy.message}
              </label>
              <textarea
                id="message"
                name="message"
                required
                minLength={10}
                maxLength={2000}
                rows={6}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <label className="inline-flex items-start gap-3 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="agree"
                required
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{copy.agree}</span>
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-base font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:w-auto"
            >
              {copy.submit}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=16.3725%2C48.2082%2C16.3825%2C48.2182&layer=mapnik&marker=48.2132%2C16.3775"
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
