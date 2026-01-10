'use server';

import { createTransport } from 'nodemailer';

import { isLocale, type Locale } from '@/lib/i18n';

export type SendContactResult =
  | { ok: true; dryRun: boolean }
  | {
      ok: false;
      reason: 'honeypot' | 'validation' | 'config' | 'smtp';
      /**
       * Safe-to-show technical details for debugging.
       * Must NOT contain secrets (passwords, full SMTP config, etc.).
       */
      detail?: string;
    };

export async function sendContact(formData: FormData): Promise<SendContactResult> {
  const rawLocale = formData.get('locale')?.toString() ?? 'ru';
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ru';
  const product = formData.get('product')?.toString().trim() ?? '';
  // In production we should send emails by default.
  // In dev/test we default to dry-run unless explicitly disabled.
  const isProd = process.env.NODE_ENV === 'production';
  const dryRunEnv = process.env.LEADS_DRY_RUN;
  const isDryRun = dryRunEnv === '1' || (!isProd && dryRunEnv !== '0');

  const honeypot = formData.get('company')?.toString().trim();
  if (honeypot) {
    return { ok: false, reason: 'honeypot' };
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
    return { ok: false, reason: 'validation' };
  }

  if (!hasAnyContact) {
    return { ok: false, reason: 'validation' };
  }

  if (!(hasEmail || hasPhone)) {
    return { ok: false, reason: 'validation' };
  }

  if (message.length < 6 || message.length > 2000) {
    return { ok: false, reason: 'validation' };
  }

  if (!agree) {
    return { ok: false, reason: 'validation' };
  }

  if (isDryRun) {
    return { ok: true, dryRun: true };
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT ?? 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const leadsTo = process.env.LEADS_TO;

  if (!smtpHost || !smtpUser || !smtpPass || !leadsTo || Number.isNaN(smtpPort)) {
    const missing: string[] = [];
    if (!smtpHost) missing.push('SMTP_HOST');
    if (!smtpUser) missing.push('SMTP_USER');
    if (!smtpPass) missing.push('SMTP_PASS');
    if (!leadsTo) missing.push('LEADS_TO');
    if (Number.isNaN(smtpPort)) missing.push('SMTP_PORT');

    console.error('sendContact: missing SMTP env config', {
      hasHost: Boolean(smtpHost),
      hasUser: Boolean(smtpUser),
      hasPass: Boolean(smtpPass),
      hasTo: Boolean(leadsTo),
      smtpPort,
    });

    return {
      ok: false,
      reason: 'config',
      detail: missing.length ? `Missing env: ${missing.join(', ')}` : 'Missing/invalid SMTP configuration.',
    };
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
      // Fail fast instead of hanging the UI for 1–2 minutes if SMTP is unreachable.
      connectionTimeout: 12_000,
      greetingTimeout: 12_000,
      socketTimeout: 20_000,
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
  } catch (error) {
    // IMPORTANT: log the real reason in server logs for debugging.
    const err = error as unknown;
    const asAny = err as Record<string, unknown>;
    const message = err instanceof Error ? err.message : String(err);
    console.error('sendContact: SMTP send failed', {
      message,
      code: asAny.code,
      command: asAny.command,
      response: asAny.response,
      responseCode: asAny.responseCode,
    });

    const detailParts: string[] = [];
    if (asAny.code) detailParts.push(`code=${String(asAny.code)}`);
    if (asAny.responseCode) detailParts.push(`responseCode=${String(asAny.responseCode)}`);
    detailParts.push(message);

    return {
      ok: false,
      reason: 'smtp',
      detail: `SMTP error: ${detailParts.join(' | ')}`,
    };
  }

  return { ok: true, dryRun: false };
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
