'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Locale } from '@/lib/i18n';

type Copy = {
  title: string;
  description: string;
  name: string;
  email: string;
  phone: string;
  phoneHint: string;
  contactRequired: string;
  message: string;
  agree: string;
  submit: string;
  success: string;
  error: string;
};

type ContactFormProps = {
  copy: Copy;
  locale: Locale;
  contactsPath: string;
  status: 'success' | 'error' | null;
  onSubmitAction: (formData: FormData) => Promise<void>;
  isDryRun: boolean;
};

export function ContactForm({ copy, locale, contactsPath, status, onSubmitAction, isDryRun }: ContactFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localStatus, setLocalStatus] = useState<'success' | 'error' | null>(status);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactError, setContactError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const successVisible = localStatus === 'success';
  const errorVisible = localStatus === 'error';

  useEffect(() => {
    setLocalStatus(status);
    if (status !== null) {
      setIsSubmitting(false);
    }
  }, [status]);

  const triggerDryRunSuccess = () => {
    setLocalStatus('success');
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('ok', '1');
    router.replace(`${contactsPath}?${params.toString()}`, { scroll: false });
  };

  const validateContacts = () => {
    const hasEmail = email.trim().length > 0;
    const hasPhone = phone.trim().length > 0;
    const isValid = hasEmail || hasPhone;

    setContactError(!isValid);

    return isValid;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const isValid = validateContacts();
    if (!isValid) {
      event.preventDefault();
      return;
    }

    setIsSubmitting(true);

    if (!isDryRun) {
      return;
    }

    event.preventDefault();
    triggerDryRunSuccess();
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {successVisible ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {copy.success}
        </div>
      ) : null}
      {errorVisible ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {copy.error}
        </div>
      ) : null}

      <form
        action={isDryRun ? undefined : onSubmitAction}
        onSubmit={handleSubmit}
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
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (contactError && event.target.value.trim()) {
                  setContactError(false);
                }
              }}
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
              pattern="[0-9+()\\s-]{7,}"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                if (contactError && event.target.value.trim()) {
                  setContactError(false);
                }
              }}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <p className="text-sm text-zinc-500">{copy.phoneHint}</p>
            {contactError ? (
              <p className="text-sm text-red-600" role="alert" aria-live="polite">
                {copy.contactRequired}
              </p>
            ) : null}
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
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-base font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:w-auto"
        >
          {isSubmitting ? 'Отправка…' : copy.submit}
        </button>
      </form>
    </div>
  );
}
