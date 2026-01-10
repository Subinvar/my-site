'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Info, X } from 'lucide-react';

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
  emailInvalid: string;
  phone: string;
  phoneInvalid: string;
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
  agreeRequired: string;
  submit: string;
  submitting: string;
  sent: string;
  success: string;
  error: string;
};

type SubmitResult =
  | { ok: true; dryRun: boolean }
  | {
      ok: false;
      reason: 'honeypot' | 'validation' | 'config' | 'smtp';
      detail?: string;
    };

type ContactFormProps = {
  copy: Copy;
  locale: Locale;
  privacyPolicyHref: string;
  onSubmitAction: (formData: FormData) => Promise<SubmitResult>;
  initialProduct?: string;
};

export function ContactForm({
  copy,
  locale,
  privacyPolicyHref,
  onSubmitAction,
  initialProduct,
}: ContactFormProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [product, setProduct] = useState(initialProduct ?? '');
  const [contactError, setContactError] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [agree, setAgree] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [agreeError, setAgreeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  type Notice = {
    variant: 'success' | 'destructive' | 'brand';
    message: string;
    detail?: string;
  };

  const [notice, setNotice] = useState<Notice | null>(null);
  const [isNoticeDetailsOpen, setIsNoticeDetailsOpen] = useState(false);
  const noticeTimerRef = useRef<number | null>(null);
  const productNotice = locale === 'ru' ? 'Запрос по продукту' : 'Product inquiry';
  const fieldClassName =
    'bg-background/45 text-muted-foreground ' +
    'border border-[var(--header-border)] ' +
    'hover:bg-background/60 hover:text-foreground hover:border-current ' +
    'focus-visible:bg-background/60 focus-visible:text-foreground focus-visible:border-current ' +
    'focus-visible:ring-0 focus-visible:ring-offset-0 ' +
    'active:translate-y-[1px]';

  const canSubmit = !isSubmitting && !isSent;
  const isDisabled = isSubmitting;

  const buttonLabel = useMemo(() => {
    if (isSent) return copy.sent;
    if (isSubmitting) return copy.submitting;
    return copy.submit;
  }, [copy.sent, copy.submitting, copy.submit, isSent, isSubmitting]);


  const EMAIL_MAX_LENGTH = 254;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const isEmailValueValid = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    if (trimmed.length > EMAIL_MAX_LENGTH) return false;
    return EMAIL_PATTERN.test(trimmed);
  };

  const sanitizePhoneInput = (value: string) => value.replace(/[^\d+()\s-]/g, '');

  type PhoneNormalization = {
    digits: string;
    e164: string | null;
    formatted: string;
    isKnown: boolean;
    isValid: boolean;
  };

  const formatPhoneE164 = (e164: string): { formatted: string; isKnown: boolean } => {
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
  };

  const normalizePhone = (value: string): PhoneNormalization => {
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
  };
  const validateContacts = () => {
    const hasEmail = email.trim().length > 0;
    const hasPhone = phone.trim().length > 0;
    const isValid = hasEmail || hasPhone;

    setContactError(!isValid);

    return isValid;
  };


  const validateEmail = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(null);
      return true;
    }

    const isValid = isEmailValueValid(trimmed);
    setEmailError(isValid ? null : copy.emailInvalid);
    return isValid;
  };

  const validatePhone = () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setPhoneError(null);
      return true;
    }

    const normalized = normalizePhone(trimmed);
    const isValid = normalized.isValid;
    setPhoneError(isValid ? null : copy.phoneInvalid);
    return isValid;
  };

  const handlePhoneBlur = () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setPhoneError(null);
      return;
    }

    const normalized = normalizePhone(trimmed);

    if (normalized.isKnown && normalized.isValid && normalized.formatted !== phone) {
      setPhone(normalized.formatted);
    }

    setPhoneError(normalized.isValid ? null : copy.phoneInvalid);
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
    if (trimmed.length < 6) {
      setMessageError(copy.messageTooShort);
      return false;
    }
    setMessageError(null);
    return true;
  };

  const validateAgree = () => {
    if (!agree) {
      setAgreeError(copy.agreeRequired);
      return false;
    }
    setAgreeError(null);
    return true;
  };

  const resetNoticeTimer = () => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
  };

  const showNotice = (payload: Notice) => {
    resetNoticeTimer();
    setNotice(payload);
    setIsNoticeDetailsOpen(false);
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
      setIsNoticeDetailsOpen(false);
      noticeTimerRef.current = null;
    }, 12000);
  };

  const markDirty = () => {
    if (isSent) {
      setIsSent(false);
    }
  };

  useEffect(() => {
    return () => {
      resetNoticeTimer();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    // Client-side validation (noValidate отключает встроенную браузерную валидацию).
    const isContactsValid = validateContacts();
    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();
    const isMessageValid = validateMessage();
    const isAgreeValid = validateAgree();

    if (
      !isContactsValid ||
      !isNameValid ||
      !isEmailValid ||
      !isPhoneValid ||
      !isMessageValid ||
      !isAgreeValid
    ) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const form = event.currentTarget;
      const result = await onSubmitAction(new FormData(form));

      if (result.ok) {
        setIsSent(true);
        setIsSubmitting(false);

        // В тестовом режиме письма не отправляются — показываем отдельное уведомление.
        if (result.dryRun) {
          showNotice({ variant: 'brand', message: copy.dryRunSuccess });
        }

        // По UX: очищаем форму после успешной отправки.
        setName('');
        setEmail('');
        setPhone('');
        setProduct(initialProduct ?? '');
        setMessage('');
        setAgree(false);
        setContactError(false);
        setEmailError(null);
        setPhoneError(null);
        setNameError(null);
        setMessageError(null);
        setAgreeError(null);
      } else {
        setIsSubmitting(false);

        // Не ломаем вёрстку — показываем всплывающее уведомление.
        // Для пользователя текст один (без технических деталей),
        // а подробности пишем в серверные логи (см. actions.ts).
        showNotice({ variant: 'destructive', message: copy.error, detail: result.detail });
      }
    } catch {
      setIsSubmitting(false);
      showNotice({ variant: 'destructive', message: copy.error });
    }
  };

  return (
    <div className="flex h-full flex-col space-y-6">
      {notice ? (
        <div className="fixed bottom-4 right-4 z-50 w-[min(420px,calc(100vw-2rem))]">
          <div className="relative">
            <Alert
              variant={notice.variant}
              className="pr-20 shadow-lg"
            >
              <div className="space-y-2">
                <div>{notice.message}</div>
                {notice.variant === 'destructive' && notice.detail && isNoticeDetailsOpen ? (
                  <pre className="max-h-44 overflow-auto whitespace-pre-wrap rounded-md bg-background/60 p-2 text-xs text-foreground">
                    {notice.detail}
                  </pre>
                ) : null}
              </div>
            </Alert>
            <div className="absolute right-2 top-2 flex items-center gap-1">
              {notice.variant === 'destructive' && notice.detail ? (
                <button
                  type="button"
                  onClick={() => {
                    // Если пользователь хочет посмотреть детали, не прячем тост по таймеру.
                    resetNoticeTimer();
                    setIsNoticeDetailsOpen((current) => !current);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={locale === 'ru' ? 'Показать детали ошибки' : 'Show error details'}
                >
                  <Info aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  resetNoticeTimer();
                  setNotice(null);
                  setIsNoticeDetailsOpen(false);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                aria-label={locale === 'ru' ? 'Закрыть уведомление' : 'Dismiss notification'}
              >
                <X aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Card
        as="section"
        className="flex min-h-0 flex-1 flex-col border-[var(--header-border)] bg-muted"
      >
        <form
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
                markDirty();
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
              <Field
                label={copy.email}
                htmlFor="email"
                error={emailError ?? undefined}
                reserveErrorSpace
              >
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
                    markDirty();
                    if (contactError && next.trim()) {
                      setContactError(false);
                    }
                    if (emailError) {
                      const isValid = isEmailValueValid(next);
                      setEmailError(isValid ? null : copy.emailInvalid);
                    }
                  }}
                  onBlur={validateEmail}
                  error={emailError ?? (contactError ? copy.contactRequired : undefined)}
                />
              </Field>

              <Field
                label={copy.phone}
                htmlFor="phone"
                error={phoneError ?? undefined}
                reserveErrorSpace
              >
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="[0-9+()\s-]{7,}"
                  className={fieldClassName}
                  value={phone}
                  onChange={(event) => {
                    const next = sanitizePhoneInput(event.target.value);
                    setPhone(next);
                    markDirty();
                    if (contactError && next.trim()) {
                      setContactError(false);
                    }
                    if (phoneError) {
                      const normalized = normalizePhone(next);
                      setPhoneError(normalized.isValid ? null : copy.phoneInvalid);
                    }
                  }}
                  onBlur={handlePhoneBlur}
                  error={phoneError ?? (contactError ? copy.contactRequired : undefined)}
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
              onChange={(event) => {
                setProduct(event.target.value);
                markDirty();
              }}
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
              maxLength={2000}
              rows={6}
              className={fieldClassName}
              value={message}
              error={messageError ?? undefined}
              onChange={(event) => {
                const next = event.target.value;
                setMessage(next);
                markDirty();
                if (messageError) {
                  const trimmed = next.trim();
                  if (!trimmed) {
                    setMessageError(copy.messageRequired);
                  } else if (trimmed.length < 6) {
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
            checked={agree}
            onChange={(event) => {
              setAgree(event.target.checked);
              markDirty();
              if (agreeError && event.target.checked) {
                setAgreeError(null);
              }
            }}
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

          <p
            className={`text-xs leading-4 ${agreeError ? 'text-[var(--destructive)]' : 'text-transparent'}`}
            role={agreeError ? 'alert' : undefined}
            aria-hidden={agreeError ? undefined : true}
          >
            {agreeError ? agreeError : '\u00A0'}
          </p>

          <Button
            type="submit"
            variant="cta"
            disabled={isDisabled}
            aria-disabled={!canSubmit}
            fullWidth
            leftIcon={isSent ? <Check aria-hidden className="h-4 w-4" strokeWidth={2} /> : undefined}
            className={
              [
                isSubmitting ? 'disabled:cursor-wait' : null,
                !isSent ? 'cursor-pointer' : null,
                isSent &&
                  [
                    'cursor-default',
                    '!bg-[color:var(--success)] !text-white',
                    'hover:!bg-[color:var(--success)] hover:!text-white',
                    'after:!border-transparent',
                    'focus-visible:after:!border-transparent',
                  ].join(' '),
              ]
                .filter(Boolean)
                .join(' ')
            }
          >
            {buttonLabel}
          </Button>
        </form>
      </Card>
    </div>
  );
}
