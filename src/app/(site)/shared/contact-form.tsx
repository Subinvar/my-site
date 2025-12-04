'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Alert } from '@/app/(site)/shared/ui/alert';
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
  productLabel: string;
  productHint: string;
  productPlaceholder: string;
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
  initialProduct?: string;
};

export function ContactForm({
  copy,
  locale,
  contactsPath,
  status,
  onSubmitAction,
  isDryRun,
  initialProduct,
}: ContactFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dryRunStatus, setDryRunStatus] = useState<'success' | 'error' | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [product, setProduct] = useState(initialProduct ?? '');
  const [contactError, setContactError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const productNotice = locale === 'ru' ? 'Запрос по продукту' : 'Product inquiry';

  const currentStatus = isDryRun ? dryRunStatus : status;
  const successVisible = currentStatus === 'success';
  const errorVisible = currentStatus === 'error';

  const triggerDryRunSuccess = () => {
    setDryRunStatus('success');
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('ok', '1');
    if (product.trim()) {
      params.set('product', product.trim());
    } else {
      params.delete('product');
    }
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
        <Alert variant="success" className="animate-fade-in-up">
          {copy.success}
        </Alert>
      ) : null}
      {errorVisible ? (
        <Alert variant="destructive">{copy.error}</Alert>
      ) : null}

      {isDryRun && copy.dryRunNotice ? (
        <Alert>{copy.dryRunNotice}</Alert>
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

        {initialProduct ? (
          <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            {productNotice}: <span className="font-medium">{initialProduct}</span>
          </div>
        ) : null}

        <Field label={copy.productLabel} htmlFor="product" description={copy.productHint}>
          <Input
            id="product"
            name="product"
            value={product}
            onChange={(event) => setProduct(event.target.value)}
            placeholder={copy.productPlaceholder}
          />
        </Field>

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
