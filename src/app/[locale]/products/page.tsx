import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Download, FileText, Mail, Phone, Send } from 'lucide-react';
import type { ReactNode } from 'react';

import { SiteShellLayout } from '@/app/(site)/shared/site-shell-layout';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { ContactForm } from '@/app/(site)/shared/contact-form';
import { CopyButton } from '@/app/(site)/shared/ui/copy-button';
import { AppleHoverLift } from '@/app/(site)/shared/ui/apple-hover-lift';
import { Button } from '@/app/(site)/shared/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/(site)/shared/ui/card';
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
import { getSite } from '@/lib/keystatic';
import { cn } from '@/lib/cn';
import { focusRingBase } from '@/lib/focus-ring';
import { ContactsLocations } from './contacts-locations';
import { RequisitesDisclosure } from './requisites-disclosure';
import { sendContact } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const COPY = {
  ru: {
    title: 'Свяжитесь с нами',
    description: 'Заполните форму или воспользуйтесь контактами — мы ответим на ваш запрос в ближайшее время.',
    actions: {
      call: 'Позвонить',
      email: 'Написать на email',
      telegram: 'Написать в Telegram',
      requisites: 'Реквизиты',
    },
    contactsBlockTitle: 'Контакты',
    locations: {
      title: 'Наши адреса',
      description: '',
      addressLabel: 'Адрес',
      hoursLabel: 'Режим работы',
      copyAddress: 'Скопировать адрес',
      copied: 'Скопировано',
      openGoogle: 'Google Maps',
      openYandex: 'Яндекс Карты',
      openOsm: 'OpenStreetMap',
      mapFallback: 'Карта временно недоступна — откройте адрес в приложении карт.',
    },
    requisites: {
      title: 'Реквизиты и документы',
      description: 'ИНН, ОГРН и банковские реквизиты',
      copy: 'Скопировать реквизиты',
      copied: 'Скопировано',
      download: 'Скачать карточку компании',
      more: 'Дополнительная информация',
    },
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
    actions: {
      call: 'Call',
      email: 'Send an email',
      telegram: 'Message on Telegram',
      requisites: 'Company details',
    },
    contactsBlockTitle: 'Contact details',
    locations: {
      title: 'Locations & map',
      description: '',
      addressLabel: 'Address',
      hoursLabel: 'Working hours',
      copyAddress: 'Copy address',
      copied: 'Copied',
      openGoogle: 'Google Maps',
      openYandex: 'Yandex Maps',
      openOsm: 'OpenStreetMap',
      mapFallback: 'Map is temporarily unavailable — open the address in a maps app.',
    },
    requisites: {
      title: 'Company details & documents',
      description: 'Tax IDs, registered address and bank details for contracts and accounting.',
      copy: 'Copy company details',
      copied: 'Copied',
      download: 'Download company card',
      more: 'Additional information',
    },
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
  actions: {
    call: string;
    email: string;
    telegram: string;
    requisites: string;
  };
  contactsBlockTitle: string;
  locations: {
    title: string;
    description: string;
    addressLabel: string;
    hoursLabel: string;
    copyAddress: string;
    copied: string;
    openGoogle: string;
    openYandex: string;
    openOsm: string;
    mapFallback: string;
  };
  requisites: {
    title: string;
    description: string;
    copy: string;
    copied: string;
    download: string;
    more: string;
  };
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

function normalizeTel(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

function buildRequisitesClipboardText(locale: Locale, requisites: NonNullable<ReturnType<typeof getRequisites>>) {
  const labels =
    locale === 'ru'
      ? {
          fullName: 'Полное наименование',
          shortName: 'Сокращённое наименование',
          legalAddress: 'Юридический адрес',
          mailingAddress: 'Адрес для корреспонденции',
          inn: 'ИНН',
          kpp: 'КПП',
          ogrn: 'ОГРН',
          okpo: 'ОКПО',
          okato: 'ОКАТО',
          bankAccount: 'Р/с',
          bankName: 'Банк',
          correspondentAccount: 'К/с',
          bik: 'БИК',
          bankInn: 'ИНН банка',
          bankAddress: 'Адрес банка',
          director: 'Генеральный директор',
          authorityBasis: 'Основание',
        }
      : {
          fullName: 'Legal name',
          shortName: 'Short name',
          legalAddress: 'Registered address',
          mailingAddress: 'Mailing address',
          inn: 'INN',
          kpp: 'KPP',
          ogrn: 'OGRN',
          okpo: 'OKPO',
          okato: 'OKATO',
          bankAccount: 'Account',
          bankName: 'Bank',
          correspondentAccount: 'Correspondent account',
          bik: 'BIC',
          bankInn: 'Bank INN',
          bankAddress: 'Bank address',
          director: 'Director',
          authorityBasis: 'Authority basis',
        };

  const rows: Array<[string, string | null | undefined]> = [
    [labels.fullName, requisites.fullName],
    [labels.shortName, requisites.shortName],
    [labels.inn, requisites.inn],
    [labels.kpp, requisites.kpp],
    [labels.ogrn, requisites.ogrn],
    [labels.okpo, requisites.okpo],
    [labels.okato, requisites.okato],
    [labels.legalAddress, requisites.legalAddress],
    [labels.mailingAddress, requisites.mailingAddress],
    [labels.bankAccount, requisites.bankAccount],
    [labels.bankName, requisites.bankName],
    [labels.correspondentAccount, requisites.correspondentAccount],
    [labels.bik, requisites.bik],
    [labels.bankInn, requisites.bankInn],
    [labels.bankAddress, requisites.bankAddress],
    [labels.director, requisites.director],
    [labels.authorityBasis, requisites.authorityBasis],
  ];

  return rows
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');
}

function getRequisites(shell: Awaited<ReturnType<typeof getSiteShellData>>) {
  return shell.site.contacts.requisites;
}

function hasRequisites(shell: Awaited<ReturnType<typeof getSiteShellData>>) {
  const requisites = getRequisites(shell);
  if (!requisites) return false;
  return Boolean(
    requisites.fullName ||
      requisites.inn ||
      requisites.ogrn ||
      requisites.legalAddress ||
      requisites.bankAccount ||
      requisites.bankName
  );
}

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
  const shell = await getSiteShellData(locale);
  const targetLocale = findTargetLocale(locale);
  const switcherHref = buildPath(targetLocale, ['contacts']);
  const currentPath = buildPath(locale, ['contacts']);
  const copy = COPY[locale];
  const phone = shell.site.contacts.phone ?? '';
  const email = shell.site.contacts.email ?? '';
  const telegramUrl = shell.site.contacts.telegramUrl ?? '';
  const telegramLabel = formatTelegramHandle(telegramUrl) ?? telegramUrl;
  const locations = shell.site.contacts.locations ?? [];
  const requisites = shell.site.contacts.requisites;
  const companyCardFile = shell.site.contacts.companyCardFile ?? '';
  const showRequisites = hasRequisites(shell);

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
      <div className="space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground">{copy.title}</h1>
          <p className="text-base text-muted-foreground">{copy.description}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {phone ? (
            <QuickActionCard
              title={copy.actions.call}
              description={phone}
              href={`tel:${normalizeTel(phone)}`}
              icon={<Phone aria-hidden className="h-5 w-5" strokeWidth={1.75} />}
            />
          ) : null}
          {email ? (
            <QuickActionCard
              title={copy.actions.email}
              description={email}
              href={`mailto:${email}`}
              icon={<Mail aria-hidden className="h-5 w-5" strokeWidth={1.75} />}
            />
          ) : null}
          {telegramUrl ? (
            <QuickActionCard
              title={copy.actions.telegram}
              description={telegramLabel || telegramUrl}
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              icon={<Send aria-hidden className="h-5 w-5" strokeWidth={1.75} />}
            />
          ) : null}

          {(showRequisites || companyCardFile) ? (
            <QuickActionCard
              title={copy.actions.requisites}
              description={copy.requisites.description}
              href="#requisites"
              icon={<FileText aria-hidden className="h-5 w-5" strokeWidth={1.75} />}
            />
          ) : null}
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
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
            {locations.length ? (
              <ContactsLocations locale={locale} locations={locations} copy={copy.locations} />
            ) : null}
          </div>
        </div>

        {(showRequisites || companyCardFile) ? (
          <section id="requisites" className="scroll-mt-28">
            <RequisitesDisclosure
              anchorId="requisites"
              title={copy.requisites.title}
              description={copy.requisites.description}
            >
              {showRequisites || companyCardFile ? (
                <div className="flex flex-wrap gap-2">
                  {showRequisites && requisites ? (
                    <CopyButton
                      text={buildRequisitesClipboardText(locale, requisites)}
                      label={copy.requisites.copy}
                      copiedLabel={copy.requisites.copied}
                      variant="primary"
                      size="sm"
                    />
                  ) : null}

                  {companyCardFile ? (
                    <Button
                      asChild
                      variant="primary"
                      size="sm"
                      leftIcon={<Download aria-hidden className="h-4 w-4" />}
                    >
                      <a href={companyCardFile} download>
                        {copy.requisites.download}
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {showRequisites && requisites ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <RequisitesList
                    title={locale === 'ru' ? 'Организация' : 'Company'}
                    items={[
                      [locale === 'ru' ? 'Полное наименование' : 'Legal name', requisites.fullName],
                      [locale === 'ru' ? 'Сокращённое' : 'Short name', requisites.shortName],
                      [locale === 'ru' ? 'ИНН' : 'INN', requisites.inn],
                      [locale === 'ru' ? 'КПП' : 'KPP', requisites.kpp],
                      [locale === 'ru' ? 'ОГРН' : 'OGRN', requisites.ogrn],
                      [locale === 'ru' ? 'ОКПО' : 'OKPO', requisites.okpo],
                      [locale === 'ru' ? 'ОКАТО' : 'OKATO', requisites.okato],
                      [locale === 'ru' ? 'Юридический адрес' : 'Registered address', requisites.legalAddress],
                      [locale === 'ru' ? 'Адрес для корреспонденции' : 'Mailing address', requisites.mailingAddress],
                      [locale === 'ru' ? 'Генеральный директор' : 'Director', requisites.director],
                      [locale === 'ru' ? 'Основание' : 'Authority basis', requisites.authorityBasis],
                    ]}
                  />

                  <RequisitesList
                    title={locale === 'ru' ? 'Банк' : 'Bank'}
                    items={[
                      [locale === 'ru' ? 'Р/с' : 'Account', requisites.bankAccount],
                      [locale === 'ru' ? 'Банк' : 'Bank', requisites.bankName],
                      [locale === 'ru' ? 'К/с' : 'Correspondent', requisites.correspondentAccount],
                      [locale === 'ru' ? 'БИК' : 'BIC', requisites.bik],
                      [locale === 'ru' ? 'ИНН банка' : 'Bank INN', requisites.bankInn],
                      [locale === 'ru' ? 'Адрес банка' : 'Bank address', requisites.bankAddress],
                    ]}
                  />
                </div>
              ) : null}
            </RequisitesDisclosure>
          </section>
        ) : null}
      </div>
    </SiteShellLayout>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
  target,
  rel,
}: {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  target?: string;
  rel?: string;
}) {
  return (
    <AppleHoverLift className="h-full">
      <a href={href} target={target} rel={rel} className={cn('group block h-full rounded-2xl', focusRingBase)}>
        <Card
          variant="productGroup"
          padding="md"
          className="h-full"
        >
          <CardHeader className="gap-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              {icon}
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-sm select-text break-all">{description}</CardDescription>
          </CardHeader>
        </Card>
      </a>
    </AppleHoverLift>
  );
}

function RequisitesList({
  title,
  items,
}: {
  title: string;
  items: Array<[label: string, value: string | null | undefined]>;
}) {
  const filtered = items.filter(([, value]) => Boolean(value));
  if (!filtered.length) return null;

  return (
    <section className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <dl className="grid gap-3">
        {filtered.map(([label, value]) => (
          <div key={label} className="space-y-1">
            <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
            <dd className="whitespace-pre-line text-sm font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
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
  } satisfies Metadata;
}
