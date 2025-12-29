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
  toMarkdocAst,
  type MarkdocContent,
} from './markdoc';

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
              class: 'mb-6 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground',
            },
            [
              new Markdoc.Tag(
                'strong',
                {
                  class: 'mb-1 font-semibold text-foreground',
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
            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--background)]';
          const variantClass =
            variant === 'primary'
              ? 'border-brand-700 bg-brand-700 text-white hover:bg-brand-600'
              : variant === 'outline'
                ? 'border-brand-700 text-brand-700 hover:bg-brand-700/5'
                : 'border-transparent text-muted-foreground hover:bg-muted';
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
            figureChildren.push(new Markdoc.Tag('figcaption', { class: 'text-sm text-muted-foreground' }, captionChildren));
          }
          return new Markdoc.Tag('figure', { class: 'my-6 space-y-3 text-center' }, figureChildren);
        },
      },
    },
    nodes: {
      ...config.nodes,
      fence: {
        ...config.nodes?.fence,
        transform(node, config) {
          const attrs = node.transformAttributes(config);
          const language = typeof attrs.language === 'string' && attrs.language.trim() ? attrs.language.trim() : undefined;
          const children = node.transformChildren(config);
          const codeChildren = Array.isArray(children) ? children : [children];
          const codeAttributes = language ? { class: `language-${language}` } : {};
          return new Markdoc.Tag(
            'div',
            { class: 'rounded-lg bg-muted px-4 py-3 text-sm text-foreground' },
            [new Markdoc.Tag('pre', { class: 'overflow-x-auto' }, [new Markdoc.Tag('code', codeAttributes, codeChildren)])]
          );
        },
      },
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
      table: {
        ...config.nodes?.table,
        transform(node, config) {
          const children = node.transformChildren(config);
          return new Markdoc.Tag('table', { class: 'w-full border-collapse text-sm text-muted-foreground' }, children);
        },
      },
      thead: {
        ...config.nodes?.thead,
        transform(node, config) {
          const children = node.transformChildren(config);
          return new Markdoc.Tag('thead', { class: 'bg-card text-foreground' }, children);
        },
      },
    },
  } satisfies Config;
}

export function renderToHtml(content: MarkdocContent, locale: Locale): string | null {
  const ast = toMarkdocAst(content);
  if (!ast) {
    return null;
  }
  const transformed = Markdoc.transform(ast, createHtmlConfig(locale));
  return Markdoc.renderers.html(transformed);
}