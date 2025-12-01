import Markdoc from '@markdoc/markdoc';
import type { Config, Node as MarkdocNode } from '@markdoc/markdoc';
import Image from 'next/image';
import React, { type ReactNode } from 'react';
import { defaultLocale, locales, type Locale } from './i18n';
import alertTag from '../../markdoc/tags/alert';
import figureTag from '../../markdoc/tags/figure';

export type CalloutKind = 'note' | 'info' | 'warning';

export const ALERT_TONES = ['info', 'success', 'warning', 'error'] as const;

export type AlertTone = (typeof ALERT_TONES)[number];

export type ResolvedMarkdocContent = string | { node: MarkdocNode };

export type MarkdocContent = ResolvedMarkdocContent | null | undefined;

export const CALLOUT_LABELS: Record<CalloutKind, Record<Locale, string>> = {
  note: { ru: 'Заметка', en: 'Note' },
  info: { ru: 'Важно', en: 'Info' },
  warning: { ru: 'Предупреждение', en: 'Warning' },
};

export const BUTTON_VARIANTS = ['primary', 'outline', 'ghost'] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export const BUTTON_LABELS: Record<ButtonVariant, Record<Locale, string>> = {
  primary: { ru: 'Подробнее', en: 'Read more' },
  outline: { ru: 'Подробнее', en: 'Read more' },
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
    border: 'border-border',
    background: 'bg-card',
    text: 'text-muted-foreground',
    heading: 'text-foreground',
  },
  success: {
    border: 'border-border',
    background: 'bg-card',
    text: 'text-muted-foreground',
    heading: 'text-foreground',
  },
  warning: {
    border: 'border-border',
    background: 'bg-card',
    text: 'text-muted-foreground',
    heading: 'text-foreground',
  },
  error: {
    border: 'border-border',
    background: 'bg-card',
    text: 'text-muted-foreground',
    heading: 'text-foreground',
  },
};

export const config: Config = {
  nodes: {
    fence: {
      render: 'CodeBlock',
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
    table: {
      render: 'Table',
    },
    thead: {
      render: 'TableHead',
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

  const AlertComponent = ({
    tone = 'info',
    title,
    children,
  }: {
    tone?: AlertTone;
    title?: string;
    dismissible?: boolean;
    children?: ReactNode;
  }) => {
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
  };

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
          className: 'mb-6 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground',
        },
        React.createElement(
          'strong',
          {
            className: 'mb-1 font-semibold text-foreground',
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
    CodeBlock({
      children,
      language,
    }: {
      children?: ReactNode;
      language?: string;
    }) {
      const codeClass = language ? `language-${language}` : undefined;
      return React.createElement(
        'div',
        { className: 'rounded-lg bg-muted px-4 py-3 text-sm text-foreground' },
        React.createElement(
          'pre',
          { className: 'overflow-x-auto' },
          React.createElement('code', codeClass ? { className: codeClass } : null, children)
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
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-600';
      const variantClass =
        normalizedVariant === 'primary'
          ? 'border-brand-700 bg-brand-700 text-white hover:bg-brand-600'
          : normalizedVariant === 'outline'
            ? 'border-brand-700 text-brand-700 hover:bg-brand-700/5'
            : 'border-transparent text-muted-foreground hover:bg-muted';
      return React.createElement(
        'a',
        { href, className: `${baseClass} ${variantClass}` },
        children ?? computedLabel
      );
    },
    Table({ children }: { children?: ReactNode }) {
      return React.createElement(
        'table',
        { className: 'w-full border-collapse text-sm text-muted-foreground' },
        children
      );
    },
    TableHead({ children }: { children?: ReactNode }) {
      return React.createElement('thead', { className: 'bg-card text-foreground' }, children);
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
    Alert: AlertComponent,
    alert: AlertComponent,
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
              { className: 'text-sm text-muted-foreground' },
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

export type KeystaticMarkdocConfig = Config & {
  components: ReturnType<typeof createComponents>;
};

export const keystaticMarkdocConfig: KeystaticMarkdocConfig = {
  ...config,
  components: createComponents(defaultLocale),
};

export function toMarkdocAst(content: MarkdocContent): MarkdocNode | null {
  if (!content) {
    return null;
  }
  if (typeof content === 'string') {
    const trimmed = content.trim();
    if (!trimmed) {
      return null;
    }
    return Markdoc.parse(content);
  }
  if (typeof content === 'object' && 'node' in content && content.node) {
    return content.node;
  }
  return null;
}

export async function render(content: MarkdocContent, locale: Locale): Promise<ReactNode> {
  const ast = toMarkdocAst(content);
  if (!ast) {
    return null;
  }
  const transformed = Markdoc.transform(ast, config);
  return Markdoc.renderers.react(transformed, React, { components: createComponents(locale) });
}

export function hasLocalizedContent(value: MarkdocContent): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (value && typeof value === 'object' && 'node' in value && value.node) {
    return Array.isArray(value.node.children) ? value.node.children.length > 0 : true;
  }
  return false;
}

export function assertKnownLocale(locale: string | undefined): asserts locale is Locale {
  if (!locale || !locales.includes(locale as Locale)) {
    throw new Error(`Unsupported locale: ${locale ?? 'unknown'}`);
  }
}