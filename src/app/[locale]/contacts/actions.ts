'use server';

import { redirect } from 'next/navigation';
import { createTransport } from 'nodemailer';

import { isLocale, type Locale } from '@/lib/i18n';
import { buildPath } from '@/lib/paths';

export async function sendContact(formData: FormData) {
  const rawLocale = formData.get('locale')?.toString() ?? 'ru';
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ru';
  const contactsPath = buildPath(locale, ['contacts']);
  const product = formData.get('product')?.toString().trim() ?? '';
  const isDryRun = process.env.LEADS_DRY_RUN !== '0';
  const params = new URLSearchParams();
  params.set('ok', '1');
  if (product) {
    params.set('product', product);
  }
  if (isDryRun) {
    params.set('dry', '1');
  }
  const successRedirect = `${contactsPath}?${params.toString()}`;

  const errorParams = new URLSearchParams();
  errorParams.set('ok', '0');
  if (product) {
    errorParams.set('product', product);
  }
  if (isDryRun) {
    errorParams.set('dry', '1');
  }
  const errorRedirect = `${contactsPath}?${errorParams.toString()}`;

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
  const hasAnyContact = email.length > 0 || phoneRaw.trim().length > 0;
  const hasEmail = email.length > 0 && emailPattern.test(email);
  const hasPhone = phone.length >= 7 && phone.length <= 15;

  if (name.length < 2 || name.length > 100) {
    redirect(errorRedirect);
  }

  if (!hasAnyContact) {
    redirect(errorRedirect);
  }

  if (!(hasEmail || hasPhone)) {
    redirect(errorRedirect);
  }

  if (message.length < 6 || message.length > 2000) {
    redirect(errorRedirect);
  }

  if (!agree) {
    redirect(errorRedirect);
  }

  if (isDryRun) {
    redirect(successRedirect);
  }

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
      subject: buildEmailSubject(locale, product),
      text: buildEmailBody(locale, {
        name,
        email,
        phone,
        product,
        message,
      }),
      replyTo: hasEmail ? email : undefined,
    });
  } catch {
    redirect(errorRedirect);
  }

  redirect(successRedirect);
}

function buildEmailSubject(locale: Locale, product: string) {
  const prefix = `[${locale.toUpperCase()}]`;
  if (locale === 'ru') {
    return `${prefix} ${product ? `Запрос по продукту ${product}` : 'Запрос с сайта intema.ru'}`;
  }
  return `${prefix} ${product ? `Product enquiry: ${product}` : 'Website enquiry: intema.ru'}`;
}

function buildEmailBody(
  locale: Locale,
  data: {
    name: string;
    email: string;
    phone: string;
    product: string;
    message: string;
  },
) {
  const lines =
    locale === 'ru'
      ? [
          `Имя: ${data.name}`,
          `Email: ${data.email || '-'}`,
          `Телефон: ${data.phone || '-'}`,
          data.product ? `Продукт: ${data.product}` : null,
          '',
          data.message,
        ]
      : [
          `Name: ${data.name}`,
          `Email: ${data.email || '-'}`,
          `Phone: ${data.phone || '-'}`,
          data.product ? `Product: ${data.product}` : null,
          '',
          data.message,
        ];

  return lines.filter((line): line is string => typeof line === 'string').join('\n');
}
