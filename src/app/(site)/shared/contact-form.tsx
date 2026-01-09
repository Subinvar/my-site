'use client';

import { useState } from 'react';

import { Alert } from '@/app/(site)/shared/ui/alert';
import { Button } from '@/app/(site)/shared/ui/button';
import { Card } from '@/app/(site)/shared/ui/card';
import { Checkbox } from '@/app/(site)/shared/ui/checkbox';
import { Field } from '@/app/(site)/shared/ui/field';
import { Input } from '@/app/(site)/shared/ui/input';
import { Textarea } from '@/app/(site)/shared/ui/textarea';
import type { Locale } from '@/lib/i18n';

type Copy = {
  title: string;
  description: string;
  dryRunSuccess: string;
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
  privacyPolicy: string;
  submit: string;
  submitting: string;
  success: string;
  error: string;
};

type ContactFormProps = {
  copy: Copy;
  locale: Locale;
  privacyPolicyHref: string;
  status: 'success' | 'error' | null;
  onSubmitAction: (formData: FormData) => Promise<void>;
  isDryRun: boolean;
  initialProduct?: string;
};

export function ContactForm({
  copy,
  locale,
  privacyPolicyHref,
  status,
  onSubmitAction,
  isDryRun,
  initialProduct,
}: ContactFormProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [product, setProduct] = useState(initialProduct ?? '');
  const [contactError, setContactError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const productNotice = locale === 'ru' ? 'Запрос по продукту' : 'Product inquiry';

  const successVisible = status === 'success';
  const errorVisible = status === 'error';

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
  };

  return (
    <div className="flex h-full flex-col space-y-6">
      {successVisible ? (
        <Alert variant={isDryRun ? 'brand' : 'success'}>
          {isDryRun ? copy.dryRunSuccess : copy.success}
        </Alert>
      ) : null}

      {errorVisible ? <Alert variant="destructive">{copy.error}</Alert> : null}

      <Card as="section" className="flex min-h-0 flex-1 flex-col bg-muted">
        <form action={onSubmitAction} onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="locale" value={locale} />
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          {initialProduct ? (
            <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              {productNotice}: <span className="font-medium text-foreground">{initialProduct}</span>
            </div>
          ) : null}

          <Field label={copy.name} htmlFor="name" required>
            <Input
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
            />
          </Field>

          <div className="space-y-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.email} htmlFor="email">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    const next = event.target.value;
                    setEmail(next);
                    if (contactError && next.trim()) {
                      setContactError(false);
                    }
                  }}
                  error={contactError ? copy.contactRequired : undefined}
                />
              </Field>

              <Field label={copy.phone} htmlFor="phone">
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="[0-9+()\\s-]{7,}"
                  value={phone}
                  onChange={(event) => {
                    const next = event.target.value;
                    setPhone(next);
                    if (contactError && next.trim()) {
                      setContactError(false);
                    }
                  }}
                  error={contactError ? copy.contactRequired : undefined}
                />
              </Field>
            </div>

            {copy.phoneHint ? <p className="text-xs text-muted-foreground">{copy.phoneHint}</p> : null}
            {contactError ? (
              <p className="text-xs text-[var(--destructive)]" role="alert">
                {copy.contactRequired}
              </p>
            ) : null}
          </div>

          <Field label={copy.productLabel} htmlFor="product" description={copy.productHint}>
            <Input
              id="product"
              name="product"
              value={product}
              onChange={(event) => setProduct(event.target.value)}
              placeholder={copy.productPlaceholder}
              autoComplete="off"
            />
          </Field>

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

          <Checkbox
            name="agree"
            required
            label={
              <span className="text-muted-foreground">
                {copy.agree}{' '}
                <a
                  href={privacyPolicyHref}
                  className="underline underline-offset-4 hover:no-underline"
                >
                  {copy.privacyPolicy}
                </a>
              </span>
            }
          />

          <Button type="submit" disabled={isSubmitting} fullWidth className="cursor-pointer">
            {isSubmitting ? copy.submitting : copy.submit}
          </Button>
        </form>
      </Card>
    </div>
  );
}
