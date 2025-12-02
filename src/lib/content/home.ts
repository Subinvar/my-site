import { cache } from 'react';
import { createReader } from '@keystatic/core/reader';

import config from '../../../keystatic.config';
import { defaultLocale, type Locale } from '../i18n';

const getReader = cache(() => createReader(process.cwd(), config));

type Localized<T> = Partial<Record<Locale, T | null | undefined>>;

type RawHero = {
  title?: Localized<string>;
  subtitle?: Localized<string>;
  preheading?: Localized<string>;
  primaryCtaLabel?: Localized<string>;
  primaryCtaHref?: Localized<string>;
  secondaryCtaLabel?: Localized<string>;
  secondaryCtaHref?: Localized<string>;
};

type RawDirection = {
  key?: string | null;
  title?: Localized<string>;
  description?: Localized<string>;
  href?: Localized<string>;
};

type RawAbout = {
  title?: Localized<string>;
  paragraph1?: Localized<string>;
  paragraph2?: Localized<string>;
  ctaLabel?: Localized<string>;
  ctaHref?: Localized<string>;
};

type RawStat = {
  label?: Localized<string>;
  value?: Localized<string>;
};

type RawIntro = {
  title?: Localized<string>;
  description?: Localized<string>;
};

type RawHomeSingleton = {
  hero?: RawHero | null;
  directions?: RawDirection[] | null;
  about?: RawAbout | null;
  stats?: RawStat[] | null;
  newsIntro?: RawIntro | null;
  partnersIntro?: RawIntro | null;
};

type HomeHero = {
  title?: string;
  subtitle?: string;
  preheading?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

type HomeDirection = {
  key: string;
  title?: string;
  description?: string;
  href?: string;
};

type HomeAbout = {
  title?: string;
  paragraph1?: string;
  paragraph2?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

type HomeStat = {
  label?: string;
  value?: string;
};

type HomeIntro = {
  title?: string;
  description?: string;
};

export type HomeContent = {
  hero?: HomeHero;
  directions: HomeDirection[];
  about?: HomeAbout;
  stats: HomeStat[];
  newsIntro?: HomeIntro;
  partnersIntro?: HomeIntro;
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

const mapHero = (hero: RawHero | null | undefined, locale: Locale): HomeHero | undefined => {
  if (!hero) return undefined;
  return {
    title: pickLocalized(hero.title, locale),
    subtitle: pickLocalized(hero.subtitle, locale),
    preheading: pickLocalized(hero.preheading, locale),
    primaryCtaLabel: pickLocalized(hero.primaryCtaLabel, locale),
    primaryCtaHref: pickLocalized(hero.primaryCtaHref, locale),
    secondaryCtaLabel: pickLocalized(hero.secondaryCtaLabel, locale),
    secondaryCtaHref: pickLocalized(hero.secondaryCtaHref, locale),
  } satisfies HomeHero;
};

const mapDirections = (directions: RawDirection[] | null | undefined, locale: Locale): HomeDirection[] => {
  if (!Array.isArray(directions)) return [];
  return directions.map((direction, index) => ({
    key: direction.key?.trim() || `direction-${index}`,
    title: pickLocalized(direction.title, locale),
    description: pickLocalized(direction.description, locale),
    href: pickLocalized(direction.href, locale),
  }));
};

const mapAbout = (about: RawAbout | null | undefined, locale: Locale): HomeAbout | undefined => {
  if (!about) return undefined;
  return {
    title: pickLocalized(about.title, locale),
    paragraph1: pickLocalized(about.paragraph1, locale),
    paragraph2: pickLocalized(about.paragraph2, locale),
    ctaLabel: pickLocalized(about.ctaLabel, locale),
    ctaHref: pickLocalized(about.ctaHref, locale),
  } satisfies HomeAbout;
};

const mapStats = (stats: RawStat[] | null | undefined, locale: Locale): HomeStat[] => {
  if (!Array.isArray(stats)) return [];
  return stats.map((stat) => ({
    label: pickLocalized(stat.label, locale),
    value: pickLocalized(stat.value, locale),
  }));
};

const mapIntro = (intro: RawIntro | null | undefined, locale: Locale): HomeIntro | undefined => {
  if (!intro) return undefined;
  return {
    title: pickLocalized(intro.title, locale),
    description: pickLocalized(intro.description, locale),
  } satisfies HomeIntro;
};

export const getHomeContent = cache(async (locale: Locale): Promise<HomeContent | null> => {
  const reader = getReader();
  const data = (await reader.singletons.home.read()) as RawHomeSingleton | null;
  if (!data) return null;

  return {
    hero: mapHero(data.hero, locale),
    directions: mapDirections(data.directions, locale),
    about: mapAbout(data.about, locale),
    stats: mapStats(data.stats, locale),
    newsIntro: mapIntro(data.newsIntro, locale),
    partnersIntro: mapIntro(data.partnersIntro, locale),
  } satisfies HomeContent;
});
