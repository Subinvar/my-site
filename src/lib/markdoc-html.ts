import Markdoc, { type Config, type RenderableTreeNode } from '@markdoc/markdoc';
import type { Locale } from './i18n';
import {
  ALERT_LABELS,
  ALERT_TONE_CLASSES,
  ALERT_TONES,
  BUTTON_LABELS,
  BUTTON_VARIANTS,
  CALLOUT_LABELS,
  DEFAULT_IMAGE_HEIGHT,
  DEFAULT_IMAGE_WIDTH,
  config,
  normalizeImageSrc,
  parseDimension,
  type AlertTone,
  type ButtonVariant,
  type CalloutKind,
} from './markdoc';

type MarkdocContent = string | null | undefined;

function createFallback<T extends string>(labels: Record<T, Record<Locale, string>>, locale: Locale): Record<T, string> {
  return Object.fromEntries(
    Object.entries(labels).map(([key, value]) => {
      const localized = value as Partial<Record<Locale, string>> & { ru: string };
      return [key, localized[locale] ?? localized.ru];
    })
  ) as Record<T, string>;
}

function createHtmlConfig(locale: Locale): Config {
  const calloutFallback = createFallback(CALLOUT_LABELS, locale);
  const buttonFallback = createFallback(BUTTON_LABELS, locale);
  const alertFallback = createFallback(ALERT_LABELS, locale);

  return {
    ...config,
    tags: {
      ...config.tags,
      callout: {
        ...config.tags?.callout,
        transform(node, config) {
          const attrs = node.transformAttributes(config);
          const kindValue = typeof attrs.type === 'string' ? attrs.type : 'note';
          const kind: CalloutKind = ['note', 'info', 'warning'].includes(kindValue)
            ? (kindValue as CalloutKind)
            : 'note';
          const heading = (typeof attrs.title === 'string' && attrs.title.trim()) || calloutFallback[kind];
          const children = node.transformChildren(config);
          return new Markdoc.Tag(
            'aside',
            {
              class:
                'rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100',
            },
            [
              new Markdoc.Tag(
                'strong',
                {
                  class: 'block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400',
                },
                [heading]
              ),
              new Markdoc.Tag('div', { class: 'mt-2 space-y-2 leading-relaxed' }, children),
            ]
          );
        },
      },
      button: {
        ...config.tags?.button,
        transform(node, config) {
          const attrs = node.transformAttributes(config);
          const children = node.transformChildren(config);
          const href = typeof attrs.href === 'string' && attrs.href.trim() ? attrs.href.trim() : null;
          const variantValue = typeof attrs.variant === 'string' ? attrs.variant : 'primary';
          const variant: ButtonVariant = BUTTON_VARIANTS.includes(variantValue as ButtonVariant)
            ? (variantValue as ButtonVariant)
            : 'primary';
          const label = (typeof attrs.label === 'string' && attrs.label.trim()) || buttonFallback[variant];
          if (!href) {
            return new Markdoc.Tag('span', { class: 'font-semibold text-primary-600' }, children);
          }
          const baseClass =
            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
          const variantClass =
            variant === 'ghost'
              ? 'border-transparent text-zinc-700 hover:text-zinc-900 focus-visible:ring-zinc-400'
              : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:ring-zinc-900';
          const content = Array.isArray(children) && children.length > 0 ? children : [label];
          return new Markdoc.Tag('a', { href, class: `${baseClass} ${variantClass}` }, content);
        },
      },
      alert: {
        ...config.tags?.alert,
        transform(node, config) {
          const attrs = node.transformAttributes(config);
          const toneValue = typeof attrs.tone === 'string' ? attrs.tone : 'info';
          const tone: AlertTone = ALERT_TONES.includes(toneValue as AlertTone)
            ? (toneValue as AlertTone)
            : 'info';
          const heading = (typeof attrs.title === 'string' && attrs.title.trim()) || alertFallback[tone];
          const children = node.transformChildren(config);
          const toneClasses = ALERT_TONE_CLASSES[tone];
          const captionChildren = heading
            ? [
                new Markdoc.Tag(
                  'strong',
                  { class: `block text-xs font-semibold uppercase tracking-wide ${toneClasses.heading}` },
                  [heading]
                ),
              ]
            : [];
          return new Markdoc.Tag(
            'aside',
            {
              class: `rounded-lg border ${toneClasses.border} ${toneClasses.background} p-4 text-sm ${toneClasses.text}`,
            },
            [...captionChildren, new Markdoc.Tag('div', { class: 'mt-2 space-y-2 leading-relaxed' }, children)]
          );
        },
      },
      figure: {
        ...config.tags?.figure,
        transform(node, config) {
          const attrs = node.transformAttributes(config);
          const children = node.transformChildren(config);
          const src = typeof attrs.src === 'string' ? attrs.src : '';
          const alt = typeof attrs.alt === 'string' ? attrs.alt : '';
          if (!src) {
            return null;
          }
          const normalizedSrc = normalizeImageSrc(src);
          const resolvedWidth = parseDimension(attrs.width) ?? DEFAULT_IMAGE_WIDTH;
          const resolvedHeight = parseDimension(attrs.height) ?? DEFAULT_IMAGE_HEIGHT;
          const captionContent = typeof attrs.caption === 'string' ? attrs.caption.trim() : '';
          const creditContent = typeof attrs.credit === 'string' ? attrs.credit.trim() : '';
          const title = typeof attrs.title === 'string' && attrs.title.trim() ? attrs.title.trim() : undefined;
          const figureChildren: RenderableTreeNode[] = [
            new Markdoc.Tag(
              'img',
              {
                src: normalizedSrc,
                alt,
                width: resolvedWidth,
                height: resolvedHeight,
                title,
                class: 'mx-auto rounded-md object-cover',
                loading: 'lazy',
              },
              []
            ),
          ];
          if (Array.isArray(children) && children.length > 0) {
            figureChildren.push(...children);
          }
          if (captionContent || creditContent) {
            const captionChildren: RenderableTreeNode[] = [];
            if (captionContent) {
              captionChildren.push(new Markdoc.Tag('span', { class: 'block' }, [captionContent]));
            }
            if (creditContent) {
              captionChildren.push(
                new Markdoc.Tag('span', { class: captionContent ? 'mt-1 block text-xs' : 'block text-xs' }, [creditContent])
              );
            }
            figureChildren.push(
              new Markdoc.Tag('figcaption', { class: 'text-sm text-zinc-600 dark:text-zinc-400' }, captionChildren)
            );
          }
          return new Markdoc.Tag('figure', { class: 'my-6 space-y-3 text-center' }, figureChildren);
        },
      },
    },
    nodes: {
      ...config.nodes,
      image: {
        ...config.nodes?.image,
        transform(node, config) {
          const attrs = node.transformAttributes(config);
          if (!attrs.src) {
            return null;
          }
          const normalizedSrc = normalizeImageSrc(String(attrs.src));
          const resolvedWidth = parseDimension(attrs.width) ?? DEFAULT_IMAGE_WIDTH;
          const resolvedHeight = parseDimension(attrs.height) ?? DEFAULT_IMAGE_HEIGHT;
          const alt = typeof attrs.alt === 'string' ? attrs.alt : '';
          const title = typeof attrs.title === 'string' && attrs.title.trim() ? attrs.title.trim() : undefined;
          return new Markdoc.Tag('img', {
            src: normalizedSrc,
            alt,
            width: resolvedWidth,
            height: resolvedHeight,
            title,
            loading: 'lazy',
          });
        },
      },
    },
  } satisfies Config;
}

export function renderToHtml(content: MarkdocContent, locale: Locale): string | null {
  if (!content) {
    return null;
  }
  const ast = Markdoc.parse(content);
  const transformed = Markdoc.transform(ast, createHtmlConfig(locale));
  return Markdoc.renderers.html(transformed);
}