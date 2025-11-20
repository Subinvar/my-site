'use server';

import { redirect } from 'next/navigation';
import { createTransport } from 'nodemailer';

import { isLocale, type Locale } from '@/lib/i18n';
import { buildPath } from '@/lib/paths';

export async function sendContact(formData: FormData) {
  const rawLocale = formData.get('locale')?.toString() ?? 'ru';
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ru';
  const contactsPath = buildPath(locale, ['contacts']);
  const successRedirect = `${contactsPath}?ok=1`;
  const errorRedirect = `${contactsPath}?ok=0`;
  const isDryRun = process.env.LEADS_DRY_RUN !== '0';

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
  } catch {
    redirect(errorRedirect);
  }

  redirect(successRedirect);
}
