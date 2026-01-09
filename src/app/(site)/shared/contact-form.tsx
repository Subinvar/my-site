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
  nameRequired: string;
  nameTooShort: string;
  email: string;
  phone: string;
  phoneHint: string;
  contactRequired: string;
  productLabel: string;
  productHint: string;
  productPlaceholder: string;
  message: string;
  messageRequired: string;
  messageTooShort: string;
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
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const productNotice = locale === 'ru' ? 'Запрос по продукту' : 'Product inquiry';
  const fieldClassName =
    'bg-[var(--background)] ' +
    'hover:border-[var(--foreground)]/40 hover:bg-[var(--background)] ' +
    'focus-visible:border-[var(--foreground)] focus-visible:ring-0 focus-visible:ring-offset-0';

  const successVisible = status === 'success';
  const errorVisible = status === 'error';

  const validateContacts = () => {
    const hasEmail = email.trim().length > 0;
    const hasPhone = phone.trim().length > 0;
    const isValid = hasEmail || hasPhone;

    setContactError(!isValid);

    return isValid;
  };

  const validateName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(copy.nameRequired);
      return false;
    }
    if (trimmed.length < 2) {
      setNameError(copy.nameTooShort);
      return false;
    }
    setNameError(null);
    return true;
  };

  const validateMessage = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setMessageError(copy.messageRequired);
      return false;
    }
    if (trimmed.length < 10) {
      setMessageError(copy.messageTooShort);
      return false;
    }
    setMessageError(null);
    return true;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const isContactsValid = validateContacts();
    const isNameValid = validateName();
    const isMessageValid = validateMessage();

    if (!isContactsValid || !isNameValid || !isMessageValid) {
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

      <Card
        as="section"
        className="flex min-h-0 flex-1 flex-col border-[var(--header-border)] bg-muted"
      >
        <form
          action={onSubmitAction}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-3"
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
            <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              {productNotice}: <span className="font-medium text-foreground">{initialProduct}</span>
            </div>
          ) : null}

          <Field
            label={copy.name}
            htmlFor="name"
            required
            error={nameError ?? undefined}
            reserveErrorSpace
          >
            <Input
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              className={fieldClassName}
              value={name}
              error={nameError ?? undefined}
              onChange={(event) => {
                const next = event.target.value;
                setName(next);
                if (nameError) {
                  const trimmed = next.trim();
                  if (!trimmed) {
                    setNameError(copy.nameRequired);
                  } else if (trimmed.length < 2) {
                    setNameError(copy.nameTooShort);
                  } else {
                    setNameError(null);
                  }
                }
              }}
              onBlur={validateName}
            />
          </Field>

          <div className="space-y-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.email} htmlFor="email">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={fieldClassName}
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
                  className={fieldClassName}
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
            <p
              className={`text-xs leading-4 ${contactError ? 'text-[var(--destructive)]' : 'text-transparent'}`}
              role={contactError ? 'alert' : undefined}
              aria-hidden={contactError ? undefined : true}
            >
              {contactError ? copy.contactRequired : '\u00A0'}
            </p>
          </div>

          <Field
            label={copy.productLabel}
            htmlFor="product"
            description={copy.productHint}
            reserveErrorSpace
          >
            <Input
              id="product"
              name="product"
              value={product}
              onChange={(event) => setProduct(event.target.value)}
              placeholder={copy.productPlaceholder}
              autoComplete="off"
              className={fieldClassName}
            />
          </Field>

          <Field
            label={copy.message}
            htmlFor="message"
            required
            error={messageError ?? undefined}
            reserveErrorSpace
          >
            <Textarea
              id="message"
              name="message"
              required
              minLength={10}
              maxLength={2000}
              rows={6}
              className={fieldClassName}
              value={message}
              error={messageError ?? undefined}
              onChange={(event) => {
                const next = event.target.value;
                setMessage(next);
                if (messageError) {
                  const trimmed = next.trim();
                  if (!trimmed) {
                    setMessageError(copy.messageRequired);
                  } else if (trimmed.length < 10) {
                    setMessageError(copy.messageTooShort);
                  } else {
                    setMessageError(null);
                  }
                }
              }}
              onBlur={validateMessage}
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
                  className="no-underline hover:no-underline"
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
