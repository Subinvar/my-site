import { cache } from 'react';
import { createReader } from '@keystatic/core/reader';

import config from '../../../keystatic.config';
import { defaultLocale, type Locale } from '../i18n';

const getReader = cache(() => createReader(process.cwd(), config));

type Localized<T> = Partial<Record<Locale, T | null | undefined>>;

type RawImage = {
  src?: string | null;
  alt?: Localized<string>;
};

type RawCard = {
  title?: Localized<string>;
  description?: Localized<string>;
  href?: Localized<string>;
  image?: RawImage | null;
  order?: number | null;
  hidden?: boolean | null;
};

type RawGroup = {
  id?: string | null;
  title?: Localized<string>;
  description?: Localized<string>;
  icon?: string | null;
  order?: number | null;
  hidden?: boolean | null;
  cards?: RawCard[] | null;
};

type RawProductsHub = {
  groups?: RawGroup[] | null;
  insights?: RawInsight[] | null;
};

type RawInsight = {
  id?: string | null;
  icon?: string | null;
  title?: Localized<string>;
  lead?: Localized<string>;
  details?: Localized<string>[] | null;
  order?: number | null;
  hidden?: boolean | null;
};

export type ProductsHubCard = {
  id: string;
  title?: string;
  description?: string;
  href?: string;
  image?: { src?: string; alt?: string } | null;
  order: number;
};

export type ProductsHubGroup = {
  id: string;
  title?: string;
  description?: string;
  icon?: string;
  order: number;
  cards: ProductsHubCard[];
};

export type ProductsHubInsight = {
  id: string;
  icon?: string;
  title?: string;
  lead?: string;
  details: string[];
  order: number;
  hidden: boolean;
};

const pickLocalized = <T>(value: Localized<T> | undefined, locale: Locale): T | undefined => {
  if (!value) return undefined;
  const exact = value[locale];
  if (exact !== undefined && exact !== null) {
    return exact ?? undefined;
  }
  const fallback = value[defaultLocale];
  return fallback ?? undefined;
};

const normalizeOrder = (value: number | null | undefined, fallback: number): number =>
  typeof value === 'number' ? value : fallback;

const mapCard = (card: RawCard, locale: Locale, fallbackOrder: number): ProductsHubCard | null => {
  if (card.hidden) return null;

  const idBase = pickLocalized(card.title, locale) ?? pickLocalized(card.href, locale) ?? `card-${fallbackOrder}`;

  return {
    id: idBase,
    title: pickLocalized(card.title, locale),
    description: pickLocalized(card.description, locale),
    href: pickLocalized(card.href, locale),
    image: card.image
      ? {
          src: card.image.src ?? undefined,
          alt: pickLocalized(card.image.alt, locale),
        }
      : null,
    order: normalizeOrder(card.order, fallbackOrder),
  } satisfies ProductsHubCard;
};

const mapGroup = (group: RawGroup, locale: Locale, fallbackIndex: number): ProductsHubGroup | null => {
  if (group.hidden) return null;

  const cards = Array.isArray(group.cards)
    ? group.cards
        .map((card, index) => mapCard(card, locale, index))
        .filter((card): card is ProductsHubCard => Boolean(card))
        .sort((a, b) => a.order - b.order)
    : [];

  const id = group.id?.trim() || `group-${fallbackIndex}`;

  if (!cards.length) {
    return null;
  }

  return {
    id,
    title: pickLocalized(group.title, locale),
    description: pickLocalized(group.description, locale),
    icon: group.icon ?? undefined,
    order: normalizeOrder(group.order, fallbackIndex),
    cards,
  } satisfies ProductsHubGroup;
};

const mapInsight = (insight: RawInsight, locale: Locale, fallbackIndex: number): ProductsHubInsight | null => {
  const details = Array.isArray(insight.details)
    ? insight.details
        .map((detail) => pickLocalized(detail, locale))
        .filter((detail): detail is string => Boolean(detail))
    : [];

  const title = pickLocalized(insight.title, locale);
  const lead = pickLocalized(insight.lead, locale);

  if (!title && !lead && !details.length) {
    return null;
  }

  return {
    id: insight.id?.trim() || `insight-${fallbackIndex}`,
    icon: insight.icon ?? undefined,
    title,
    lead,
    details,
    order: normalizeOrder(insight.order, fallbackIndex),
    hidden: Boolean(insight.hidden),
  } satisfies ProductsHubInsight;
};

export const getProductsHubContent = cache(async (
  locale: Locale
): Promise<{ groups: ProductsHubGroup[] | null; insights: ProductsHubInsight[] | null }> => {
  const reader = getReader();
  const data = (await reader.singletons.productsHub.read()) as RawProductsHub | null;

  if (!data) return { groups: null, insights: null };

  const insights = Array.isArray(data.insights)
    ? data.insights
        .map((insight, index) => mapInsight(insight, locale, index))
        .filter((insight): insight is ProductsHubInsight => Boolean(insight) && !insight?.hidden)
        .sort((a, b) => a.order - b.order)
    : null;

  if (!Array.isArray(data.groups)) return { groups: null, insights };

  const groups = data.groups
    .map((group, index) => mapGroup(group, locale, index))
    .filter((group): group is ProductsHubGroup => Boolean(group))
    .sort((a, b) => a.order - b.order);

  if (!groups.length) return { groups: null, insights };

  return { groups, insights };
});
