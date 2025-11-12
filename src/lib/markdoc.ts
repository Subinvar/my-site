import Markdoc from '@markdoc/markdoc';
import type { Config } from '@markdoc/markdoc';
import Image from 'next/image';
import React, { type ReactNode } from 'react';
import { locales, type Locale } from './i18n';
import alertTag from '../../markdoc/tags/alert';
import figureTag from '../../markdoc/tags/figure';

export type CalloutKind = 'note' | 'info' | 'warning';

export const ALERT_TONES = ['info', 'success', 'warning', 'error'] as const;

export type AlertTone = (typeof ALERT_TONES)[number];

type MarkdocContent = string | null | undefined;

export const CALLOUT_LABELS: Record<CalloutKind, Record<Locale, string>> = {
  note: { ru: 'Заметка', en: 'Note' },
  info: { ru: 'Важно', en: 'Info' },
  warning: { ru: 'Предупреждение', en: 'Warning' },
};

export const BUTTON_VARIANTS = ['primary', 'ghost'] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export const BUTTON_LABELS: Record<ButtonVariant, Record<Locale, string>> = {
  primary: { ru: 'Подробнее', en: 'Read more' },
  ghost: { ru: 'Узнать', en: 'Learn more' },
};

export const ALERT_LABELS: Record<AlertTone, Record<Locale, string>> = {
  info: { ru: 'Информация', en: 'Info' },
  success: { ru: 'Успех', en: 'Success' },
  warning: { ru: 'Предупреждение', en: 'Warning' },
  error: { ru: 'Ошибка', en: 'Error' },
};

export const ALERT_TONE_CLASSES: Record<AlertTone, { border: string; background: string; text: string; heading: string }> = {
  info: {
    border: 'border-sky-200 dark:border-sky-400/50',
    background: 'bg-sky-50/80 dark:bg-sky-900/20',
    text: 'text-sky-900 dark:text-sky-100',
    heading: 'text-sky-700 dark:text-sky-200',
  },
  success: {
    border: 'border-emerald-200 dark:border-emerald-500/50',
    background: 'bg-emerald-50/80 dark:bg-emerald-900/20',
    text: 'text-emerald-900 dark:text-emerald-50',
    heading: 'text-emerald-700 dark:text-emerald-200',
  },
  warning: {
    border: 'border-amber-200 dark:border-amber-500/50',
    background: 'bg-amber-50/80 dark:bg-amber-900/20',
    text: 'text-amber-900 dark:text-amber-100',
    heading: 'text-amber-700 dark:text-amber-200',
  },
  error: {
    border: 'border-rose-200 dark:border-rose-500/50',
    background: 'bg-rose-50/80 dark:bg-rose-900/20',
    text: 'text-rose-900 dark:text-rose-50',
    heading: 'text-rose-700 dark:text-rose-200',
  },
};

export const config: Config = {
  nodes: {
    fence: {
      render: 'pre',
      attributes: {
        language: { type: String },
      },
    },
    image: {
      render: 'MarkdocImage',
      attributes: {
        src: { type: String },
        alt: { type: String },
        title: { type: String },
        width: { type: String },
        height: { type: String },
      },
    },
  },
  tags: {
    callout: {
      render: 'Callout',
      attributes: {
        type: { type: String, default: 'note' },
        title: { type: String },
      },
    },
    button: {
      render: 'InlineButton',
      attributes: {
        href: { type: String },
        variant: { type: String, default: 'primary' },
        label: { type: String },
      },
    },
    alert: alertTag,
    figure: figureTag,
  },
};

export const DEFAULT_IMAGE_WIDTH = 800;
export const DEFAULT_IMAGE_HEIGHT = 450;

export function normalizeImageSrc(src: string): string {
  const trimmed = src.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (/^(?:[a-z]+:)?\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }
  const withoutPrefix = trimmed.replace(/^\.\//, '').replace(/^\/+/, '');
  if (withoutPrefix.startsWith('uploads/')) {
    return `/${withoutPrefix}`;
  }
  return `/uploads/${withoutPrefix}`;
}

export function parseDimension(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

export function createComponents(locale: Locale) {
  const calloutTitleFallback = Object.fromEntries(
    Object.entries(CALLOUT_LABELS).map(([kind, labels]) => [kind, labels[locale] ?? labels.ru])
  ) as Record<CalloutKind, string>;

  const buttonLabelFallback = Object.fromEntries(
    Object.entries(BUTTON_LABELS).map(([variant, labels]) => [variant, labels[locale] ?? labels.ru])
  ) as Record<ButtonVariant, string>;

  const alertTitleFallback = Object.fromEntries(
    Object.entries(ALERT_LABELS).map(([tone, labels]) => [tone, labels[locale] ?? labels.ru])
  ) as Record<AlertTone, string>;

  return {
    Callout({
      type = 'note',
      title,
      children,
    }: {
      type?: CalloutKind;
      title?: string;
      children?: ReactNode;
    }) {
      const kind: CalloutKind = ['note', 'info', 'warning'].includes(type ?? '')
        ? (type as CalloutKind)
        : 'note';
      const heading = title?.trim() || calloutTitleFallback[kind];
      return React.createElement(
        'aside',
        {
          className:
            'rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100',
        },
        React.createElement(
          'strong',
          {
            className:
              'block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400',
          },
          heading
        ),
        React.createElement(
          'div',
          { className: 'mt-2 space-y-2 leading-relaxed' },
          children
        )
      );
    },
    InlineButton({
      href,
      variant = 'primary',
      label,
      children,
    }: {
      href?: string;
      variant?: ButtonVariant;
      label?: string;
      children?: ReactNode;
    }) {
      if (!href) {
        return React.createElement(
          'span',
          { className: 'font-semibold text-primary-600' },
          children
        );
      }
      const normalizedVariant = BUTTON_VARIANTS.includes(variant ?? '')
        ? (variant as ButtonVariant)
        : 'primary';
      const computedLabel = label?.trim() || buttonLabelFallback[normalizedVariant];
      const baseClass =
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
      const variantClass =
        normalizedVariant === 'ghost'
          ? 'border-transparent text-zinc-700 hover:text-zinc-900 focus-visible:ring-zinc-400'
          : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:ring-zinc-900';
      return React.createElement(
        'a',
        { href, className: `${baseClass} ${variantClass}` },
        children ?? computedLabel
      );
    },
    MarkdocImage({
      src,
      alt,
      title,
      width,
      height,
    }: {
      src?: string;
      alt?: string;
      title?: string;
      width?: number | string;
      height?: number | string;
    }) {
      if (!src) {
        return null;
      }
      const normalizedSrc = normalizeImageSrc(src);
      const resolvedWidth = parseDimension(width) ?? DEFAULT_IMAGE_WIDTH;
      const resolvedHeight = parseDimension(height) ?? DEFAULT_IMAGE_HEIGHT;
      return React.createElement(Image, {
        src: normalizedSrc,
        alt: alt ?? '',
        title: title ?? undefined,
        width: resolvedWidth,
        height: resolvedHeight,
        sizes: '(min-width: 768px) 720px, 100vw',
      });
    },
    Alert({
      tone = 'info',
      title,
      children,
    }: {
      tone?: AlertTone;
      title?: string;
      dismissible?: boolean;
      children?: ReactNode;
    }) {
      const normalizedTone = ALERT_TONES.includes(tone ?? '') ? (tone as AlertTone) : 'info';
      const classes = ALERT_TONE_CLASSES[normalizedTone];
      const heading = title?.trim() || alertTitleFallback[normalizedTone];
      return React.createElement(
        'aside',
        {
          className: `rounded-lg border ${classes.border} ${classes.background} p-4 text-sm ${classes.text}`,
        },
        heading
          ? React.createElement(
              'strong',
              {
                className: `block text-xs font-semibold uppercase tracking-wide ${classes.heading}`,
              },
              heading
            )
          : null,
        React.createElement(
          'div',
          { className: 'mt-2 space-y-2 leading-relaxed' },
          children
        )
      );
    },
    Figure({
      src,
      alt,
      caption,
      title,
      width,
      height,
      credit,
      children,
    }: {
      src?: string;
      alt?: string;
      caption?: string;
      title?: string;
      width?: number | string;
      height?: number | string;
      credit?: string;
      children?: ReactNode;
    }) {
      if (!src) {
        return null;
      }
      const normalizedSrc = normalizeImageSrc(src);
      const resolvedWidth = parseDimension(width) ?? DEFAULT_IMAGE_WIDTH;
      const resolvedHeight = parseDimension(height) ?? DEFAULT_IMAGE_HEIGHT;
      const captionContent = caption?.trim();
      const creditContent = credit?.trim();
      return React.createElement(
        'figure',
        { className: 'my-6 space-y-3 text-center' },
        React.createElement(Image, {
          src: normalizedSrc,
          alt: alt ?? '',
          title: title ?? undefined,
          width: resolvedWidth,
          height: resolvedHeight,
          sizes: '(min-width: 768px) 720px, 100vw',
          className: 'mx-auto rounded-md object-cover',
        }),
        children,
        captionContent || creditContent
          ? React.createElement(
              'figcaption',
              { className: 'text-sm text-zinc-600 dark:text-zinc-400' },
              captionContent
                ? React.createElement('span', { className: 'block' }, captionContent)
                : null,
              creditContent
                ? React.createElement('span', { className: captionContent ? 'mt-1 block text-xs' : 'block text-xs' }, creditContent)
                : null
            )
          : null
      );
    },
  } satisfies Record<string, (props: Record<string, unknown>) => ReactNode>;
}

export async function render(content: MarkdocContent, locale: Locale): Promise<ReactNode> {
  if (!content) {
    return null;
  }
  const ast = Markdoc.parse(content);
  const transformed = Markdoc.transform(ast, config);
  return Markdoc.renderers.react(transformed, React, { components: createComponents(locale) });
}

export function hasLocalizedContent(value: MarkdocContent): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function assertKnownLocale(locale: string | undefined): asserts locale is Locale {
  if (!locale || !locales.includes(locale as Locale)) {
    throw new Error(`Unsupported locale: ${locale ?? 'unknown'}`);
  }
}