import Markdoc from '@markdoc/markdoc';
import type { Config } from '@markdoc/markdoc';
import React, { type ReactNode } from 'react';
import { locales, type Locale } from './i18n';

type CalloutKind = 'note' | 'info' | 'warning';

type MarkdocContent = string | null | undefined;

const CALLOUT_LABELS: Record<CalloutKind, Record<Locale, string>> = {
  note: { ru: 'Заметка', en: 'Note' },
  info: { ru: 'Важно', en: 'Info' },
  warning: { ru: 'Предупреждение', en: 'Warning' },
};

const BUTTON_VARIANTS = ['primary', 'ghost'] as const;

type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

const BUTTON_LABELS: Record<ButtonVariant, Record<Locale, string>> = {
  primary: { ru: 'Подробнее', en: 'Read more' },
  ghost: { ru: 'Узнать', en: 'Learn more' },
};

export const config: Config = {
  nodes: {
    fence: {
      render: 'pre',
      attributes: {
        language: { type: String },
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
  },
};

function createComponents(locale: Locale) {
  const calloutTitleFallback = Object.fromEntries(
    Object.entries(CALLOUT_LABELS).map(([kind, labels]) => [kind, labels[locale] ?? labels.ru])
  ) as Record<CalloutKind, string>;

  const buttonLabelFallback = Object.fromEntries(
    Object.entries(BUTTON_LABELS).map(([variant, labels]) => [variant, labels[locale] ?? labels.ru])
  ) as Record<ButtonVariant, string>;

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
  } satisfies Record<string, (props: any) => ReactNode>;
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