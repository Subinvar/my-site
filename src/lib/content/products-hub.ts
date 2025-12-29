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
};

type RawGroup = {
  id?: string | null;
  title?: Localized<string>;
  description?: Localized<string>;
  icon?: string | null;
  order?: number | null;
  cards?: RawCard[] | null;
};

type RawProductsHub = {
  groups?: RawGroup[] | null;
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

const mapCard = (card: RawCard, locale: Locale, fallbackOrder: number): ProductsHubCard => {
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
  const cards = Array.isArray(group.cards)
    ? group.cards.map((card, index) => mapCard(card, locale, index)).sort((a, b) => a.order - b.order)
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

export const getProductsHubContent = cache(async (
  locale: Locale
): Promise<ProductsHubGroup[] | null> => {
  const reader = getReader();
  const data = (await reader.singletons.productsHub.read()) as RawProductsHub | null;

  if (!data || !Array.isArray(data.groups)) return null;

  const groups = data.groups
    .map((group, index) => mapGroup(group, locale, index))
    .filter((group): group is ProductsHubGroup => Boolean(group))
    .sort((a, b) => a.order - b.order);

  if (!groups.length) return null;

  return groups;
});
