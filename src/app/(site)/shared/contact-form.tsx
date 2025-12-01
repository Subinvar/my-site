'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/app/(site)/shared/ui/button';
import { Checkbox } from '@/app/(site)/shared/ui/checkbox';
import { Field } from '@/app/(site)/shared/ui/field';
import { Input } from '@/app/(site)/shared/ui/input';
import { Textarea } from '@/app/(site)/shared/ui/textarea';
import type { Locale } from '@/lib/i18n';

type Copy = {
  title: string;
  description: string;
  dryRunNotice: string;
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
  const [dryRunStatus, setDryRunStatus] = useState<'success' | 'error' | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactError, setContactError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStatus = isDryRun ? dryRunStatus : status;
  const successVisible = currentStatus === 'success';
  const errorVisible = currentStatus === 'error';

  const triggerDryRunSuccess = () => {
    setDryRunStatus('success');
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

    if (isDryRun) {
      event.preventDefault();
      setIsSubmitting(true);
      triggerDryRunSuccess();
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
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

      {isDryRun && copy.dryRunNotice ? (
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          {copy.dryRunNotice}
        </div>
      ) : null}

      <form
        action={onSubmitAction}
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-border bg-background p-6 shadow-sm"
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

        <Field label={copy.name} htmlFor="name" required>
          <Input id="name" name="name" required minLength={2} maxLength={100} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.email} htmlFor="email" error={contactError ? copy.contactRequired : undefined}>
            <Input
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
              error={contactError ? copy.contactRequired : undefined}
            />
          </Field>

          <Field
            label={copy.phone}
            htmlFor="phone"
            description={copy.phoneHint}
            error={contactError ? copy.contactRequired : undefined}
          >
            <Input
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
              error={contactError ? copy.contactRequired : undefined}
            />
          </Field>
        </div>

        <Field label={copy.message} htmlFor="message" required>
          <Textarea
            id="message"
            name="message"
            required
            minLength={10}
            maxLength={2000}
            rows={6}
          />
        </Field>

        <Checkbox label={<span className="text-muted-foreground">{copy.agree}</span>} name="agree" required />

        <Button type="submit" disabled={isSubmitting} fullWidth>
          {isSubmitting ? 'Отправка…' : copy.submit}
        </Button>
      </form>
    </div>
  );
}
