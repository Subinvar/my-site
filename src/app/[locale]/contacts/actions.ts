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
  const message = formData.get('message')?.toString().trim() ?? '';
  const agree = formData.get('agree') === 'on';

  const hasEmail = email.length > 0;
  const hasPhone = phoneRaw.trim().length > 0;
  const normalizedPhone = normalizePhone(phoneRaw);

  if (name.length < 2 || name.length > 100) {
    return { ok: false, reason: 'validation' };
  }

  // At least one contact method is required.
  if (!hasEmail && !hasPhone) {
    return { ok: false, reason: 'validation' };
  }

  // If user filled a field — it must be valid.
  if (hasEmail && !isEmailValid(email)) {
    return { ok: false, reason: 'validation' };
  }

  if (hasPhone && !normalizedPhone.isValid) {
    return { ok: false, reason: 'validation' };
  }

  if (message.length < 6 || message.length > 2000) {
    return { ok: false, reason: 'validation' };
  }

  if (!agree) {
    return { ok: false, reason: 'validation' };
  }

  const phone = hasPhone
    ? normalizedPhone.isKnown
      ? normalizedPhone.formatted
      : normalizedPhone.e164 ?? phoneRaw.trim()
    : '';
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

const EMAIL_MAX_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isEmailValid(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length > EMAIL_MAX_LENGTH) return false;
  return EMAIL_PATTERN.test(trimmed);
}

type PhoneNormalization = {
  digits: string;
  e164: string | null;
  formatted: string;
  isKnown: boolean;
  isValid: boolean;
};

function formatPhoneE164(e164: string): { formatted: string; isKnown: boolean } {
  const ru = e164.match(/^\+7(\d{10})$/);
  if (ru) {
    const d = ru[1];
    return {
      formatted: `+7 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`,
      isKnown: true,
    };
  }

  const by = e164.match(/^\+375(\d{9})$/);
  if (by) {
    const d = by[1];
    return {
      formatted: `+375 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`,
      isKnown: true,
    };
  }

  const am = e164.match(/^\+374(\d{8})$/);
  if (am) {
    const d = am[1];
    return {
      formatted: `+374 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)}`,
      isKnown: true,
    };
  }

  const kg = e164.match(/^\+996(\d{9})$/);
  if (kg) {
    const d = kg[1];
    return {
      formatted: `+996 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`,
      isKnown: true,
    };
  }

  const cn = e164.match(/^\+86(\d{11})$/);
  if (cn) {
    const d = cn[1];
    return {
      formatted: `+86 ${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7, 11)}`,
      isKnown: true,
    };
  }

  return { formatted: e164, isKnown: false };
}

function normalizePhone(value: string): PhoneNormalization {
  const raw = value.trim();
  if (!raw) {
    return { digits: '', e164: null, formatted: '', isKnown: false, isValid: true };
  }

  const normalizedPrefix = raw.replace(/^00/, '+');
  const digits = normalizedPrefix.replace(/\D/g, '');
  const digitCount = digits.length;
  const isValid = digitCount >= 7 && digitCount <= 15;

  let e164: string | null = null;

  if (normalizedPrefix.trim().startsWith('+')) {
    e164 = digits ? `+${digits}` : null;
  } else {
    // EAEU + China smart defaults
    if (digitCount === 11 && digits.startsWith('8')) {
      e164 = `+7${digits.slice(1)}`;
    } else if (digitCount === 11 && digits.startsWith('7')) {
      e164 = `+${digits}`;
    } else if (digitCount === 10) {
      // Most of our users are in RU/KZ (+7). If someone types 10 digits — assume +7.
      e164 = `+7${digits}`;
    } else if (digitCount === 12 && digits.startsWith('375')) {
      e164 = `+${digits}`;
    } else if (digitCount === 11 && digits.startsWith('374')) {
      e164 = `+${digits}`;
    } else if (digitCount === 12 && digits.startsWith('996')) {
      e164 = `+${digits}`;
    } else if (digitCount === 13 && digits.startsWith('86')) {
      e164 = `+${digits}`;
    } else if (
      digitCount === 11 &&
      digits.startsWith('1') &&
      /^[3-9]$/.test(digits[1] ?? '')
    ) {
      // Likely CN mobile (11 digits starting with 13–19) — assume +86.
      e164 = `+86${digits}`;
    }
  }

  if (!e164) {
    return { digits, e164: null, formatted: raw, isKnown: false, isValid };
  }

  const formattedInfo = formatPhoneE164(e164);
  const formatted = formattedInfo.isKnown ? formattedInfo.formatted : raw;

  return {
    digits,
    e164,
    formatted,
    isKnown: formattedInfo.isKnown,
    isValid,
  };
}
