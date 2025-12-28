'use client';

import Link from 'next/link';
import { type ReactElement, useEffect, useState } from 'react';
import { ArrowRight, Beaker, PaintRoller, Sparkles } from 'lucide-react';

import { Button } from '@/app/(site)/shared/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/(site)/shared/ui/card';
import { cn } from '@/lib/cn';
import type { Locale } from '@/lib/i18n';
import { buildPath } from '@/lib/paths';

export type ProductsHubCardKind = 'binders' | 'coatings' | 'auxiliaries';

export type ProductsHubCard = {
  kind: ProductsHubCardKind;
  /** raw taxonomy value */
  value: string;
  title: string;
  description: string;
  href: string;
};

type ProductsPageClientProps = {
  locale: Locale;
  binders: ProductsHubCard[];
  coatings: ProductsHubCard[];
  auxiliaries: ProductsHubCard[];
};

type SectionId = 'binders' | 'coatings' | 'auxiliaries';

const SECTION_META: Record<SectionId, { icon: ReactElement; ru: string; en: string }> = {
  binders: { icon: <Beaker className="h-4 w-4" aria-hidden />, ru: 'Связующие', en: 'Binders' },
  coatings: {
    icon: <PaintRoller className="h-4 w-4" aria-hidden />,
    ru: 'Противопригарные покрытия',
    en: 'Coatings',
  },
  auxiliaries: {
    icon: <Sparkles className="h-4 w-4" aria-hidden />,
    ru: 'Вспомогательные материалы',
    en: 'Auxiliary materials',
  },
};

export function ProductsPageClient({
  locale,
  binders,
  coatings,
  auxiliaries,
}: ProductsPageClientProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('binders');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const isRu = locale === 'ru';

  useEffect(() => {
    const ids: SectionId[] = ['binders', 'coatings', 'auxiliaries'];
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!nodes.length) return;

    // Активируем текущую секцию по скроллу (экспериментальная «липкая» навигация).
    const observer = new IntersectionObserver(
      (entries) => {
        // Берём самую «видимую» секцию.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));

        const top = visible[0];
        if (!top?.target?.id) return;
        const id = top.target.id as SectionId;
        if (ids.includes(id)) setActiveSection(id);
      },
      {
        root: null,
        // Подбираем «точку переключения» так, чтобы она ощущалась естественно.
        rootMargin: '-25% 0px -60% 0px',
        threshold: [0.05, 0.15, 0.3, 0.5],
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const trustTitle = isRu ? 'Как мы помогаем внедрять материалы' : 'How we help you implement materials';
  const trustItems = isRu
    ? [
        'Подбираем решения под процесс и требования к поверхности/прочности.',
        'Помогаем с режимами применения и типовыми ошибками внедрения.',
        'По запросу предоставляем документацию и паспортные данные.',
        'Сопровождаем тестирование и первые партии на участке.',
      ]
    : [
        'We help you choose solutions for your process and quality targets.',
        'We support implementation with application modes and common pitfalls.',
        'Documentation and datasheets are provided on request.',
        'We support trials and the first production batches.',
      ];

  return (
    <div className="space-y-12 lg:space-y-14">
      {/* INTRO / CTA */}
      <section className="space-y-5">
        <p className="m-0 max-w-3xl text-[length:var(--header-ui-fs)] leading-relaxed text-[var(--muted-foreground)]">
          {isRu
            ? 'Нажмите на карточку нужного процесса/типа — и вы попадёте в подборку товаров в каталоге.'
            : 'Pick a process/type card to jump to the matching items in the catalogue.'}
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild leftIcon={<ArrowRight className="h-4 w-4" aria-hidden />}>
            <Link href={buildPath(locale, ['contacts'])}>
              {isRu ? 'Подобрать материал' : 'Request a recommendation'}
            </Link>
          </Button>

          <Button asChild variant="secondary">
            <Link href={buildPath(locale, ['catalog'])}>{isRu ? 'Открыть каталог' : 'Open catalogue'}</Link>
          </Button>
        </div>

        {/* Переключатель вида: «карточки / список» */}
        <div className="pt-1">
          <ViewModeToggle
            isRu={isRu}
            value={viewMode}
            onChange={setViewMode}
          />
        </div>
      </section>

      {/* Sticky-навигатор по секциям */}
      <nav
        aria-label={isRu ? 'Навигация по разделам продукции' : 'Product sections navigation'}
        className={cn(
          'sticky z-10 rounded-2xl border border-[var(--header-border)] bg-background/60 px-2 py-2 backdrop-blur',
          'top-[calc(var(--header-height)+0.75rem)]',
        )}
      >
        <div className="flex gap-2 overflow-x-auto px-1">
          {(['binders', 'coatings', 'auxiliaries'] as SectionId[]).map((id) => {
            const meta = SECTION_META[id];
            const label = isRu ? meta.ru : meta.en;
            const isActive = activeSection === id;
            const count = id === 'binders' ? binders.length : id === 'coatings' ? coatings.length : auxiliaries.length;
            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setActiveSection(id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium',
                  'transition-colors duration-150',
                  isActive
                    ? 'border-[color:color-mix(in_srgb,var(--color-brand-600)_35%,var(--header-border))] bg-[color:color-mix(in_srgb,var(--color-brand-600)_12%,transparent)] text-foreground'
                    : 'border-[var(--header-border)] bg-transparent text-[var(--muted-foreground)] hover:border-[color:color-mix(in_srgb,var(--color-brand-600)_22%,var(--header-border))] hover:bg-muted/40 hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]',
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
                )}
              >
                {meta.icon}
                <span className="truncate">{label}</span>
                <span
                  className={cn(
                    'ml-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                    isActive
                      ? 'border-[color:color-mix(in_srgb,var(--color-brand-600)_35%,var(--header-border))] bg-[color:color-mix(in_srgb,var(--color-brand-600)_16%,transparent)] text-foreground'
                      : 'border-[var(--header-border)] bg-muted/60 text-[var(--muted-foreground)]',
                  )}
                  aria-label={isRu ? `Карточек: ${count}` : `Cards: ${count}`}
                >
                  {count}
                </span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* СЕКЦИИ */}
      <div className="space-y-10 lg:space-y-12">
        <ProductsSection
          id="binders"
          locale={locale}
          title={isRu ? 'Связующие' : 'Binders'}
          description={
            isRu
              ? 'Выберите процесс — откроется подборка связующих материалов в каталоге.'
              : 'Pick a process to open matching binders in the catalogue.'
          }
          items={binders}
          viewMode={viewMode}
        />

        <ProductsSection
          id="coatings"
          locale={locale}
          title={isRu ? 'Противопригарные покрытия' : 'Coatings'}
          description={
            isRu
              ? 'Спиртовые и водные покрытия — выберите основу.'
              : 'Alcohol- and water-based coatings — choose the base.'
          }
          items={coatings}
          viewMode={viewMode}
        />

        <ProductsSection
          id="auxiliaries"
          locale={locale}
          title={isRu ? 'Вспомогательные материалы' : 'Auxiliary materials'}
          description={
            isRu
              ? 'Сервисные материалы для производства: от разделительных составов до модификаторов.'
              : 'Service supplies: from release compounds to modifiers.'
          }
          items={auxiliaries}
          viewMode={viewMode}
        />
      </div>

      {/* Блок доверия + CTA */}
      <section className="rounded-3xl border border-[var(--header-border)] bg-muted/30 p-5 sm:p-6">
        <header className="space-y-2">
          <h2 className="mt-0 text-lg font-semibold sm:text-xl">{trustTitle}</h2>
          <p className="m-0 max-w-3xl text-sm text-[var(--muted-foreground)] sm:text-base">
            {isRu
              ? 'Не пытаемся «продать любой ценой». Наша цель — чтобы материалы стабильно работали на вашем участке.'
              : 'We don’t aim to “sell at any cost”. Our goal is stable performance in your production.'}
          </p>
        </header>

        <ul className="m-0 mt-5 grid list-none gap-3 p-0 md:grid-cols-2">
          {trustItems.map((item) => (
            <li key={item} className="rounded-2xl border border-[var(--header-border)] bg-background/50 p-4">
              <span className="text-sm leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}>
            <Link href={buildPath(locale, ['contacts'])}>
              {isRu ? 'Запросить консультацию' : 'Contact us'}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={buildPath(locale, ['catalog'])}>{isRu ? 'Смотреть весь каталог' : 'View full catalogue'}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function ProductsSection({
  id,
  locale,
  title,
  description,
  items,
  viewMode,
}: {
  id: SectionId;
  locale: Locale;
  title: string;
  description: string;
  items: ProductsHubCard[];
  viewMode: 'cards' | 'list';
}) {
  const isRu = locale === 'ru';
  const sectionHref = buildPath(locale, ['products', id]);
  const meta = SECTION_META[id];

  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-[calc(var(--header-height)+4rem)] rounded-3xl border border-[var(--header-border)] bg-muted/30 p-5 sm:p-6',
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="mt-0 flex items-center gap-3 text-xl font-semibold leading-[1.12] tracking-[-0.01em] sm:text-2xl">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--header-border)] bg-background/60">
              {meta.icon}
            </span>
            <span>{title}</span>
          </h2>
          <p className="m-0 max-w-2xl text-sm text-[var(--muted-foreground)] sm:text-base">{description}</p>
        </div>

        <Button asChild variant="secondary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}>
          <Link href={sectionHref}>{isRu ? 'Открыть раздел' : 'Open section'}</Link>
        </Button>
      </header>

      {viewMode === 'list' ? (
        <ul className="m-0 mt-5 grid list-none gap-2 p-0 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center justify-between gap-3 rounded-xl border border-[var(--header-border)] bg-background/50 px-3 py-2',
                  'text-sm text-foreground transition-colors',
                  'hover:border-[color:color-mix(in_srgb,var(--color-brand-600)_35%,var(--header-border))]',
                  'hover:bg-[color:color-mix(in_srgb,var(--color-brand-600)_4%,var(--background))]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]',
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
                )}
              >
                <span className="truncate">{item.title}</span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <HubCard
              key={item.href}
              item={item}
              locale={locale}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HubCard({
  item,
  locale,
}: {
  item: ProductsHubCard;
  locale: Locale;
}) {
  const isRu = locale === 'ru';
  const kindLabel =
    item.kind === 'binders'
      ? isRu
        ? 'Связующие'
        : 'Binders'
      : item.kind === 'coatings'
        ? isRu
          ? 'Покрытия'
          : 'Coatings'
        : isRu
          ? 'Вспомогательные'
          : 'Auxiliary';

  const ctaLabel =
    item.kind === 'binders'
      ? isRu
        ? 'Смотреть материалы'
        : 'View materials'
      : item.kind === 'coatings'
        ? isRu
          ? 'Смотреть покрытия'
          : 'View coatings'
        : isRu
          ? 'Смотреть материалы'
          : 'View materials';

  return (
    <Link
      href={item.href}
      className={cn(
        'group block h-full rounded-2xl',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
      )}
    >
      <Card
        as="article"
        className={cn(
          'h-full p-5 sm:p-6 shadow-none',
          'hover:translate-y-0 hover:shadow-none focus-within:translate-y-0 focus-within:shadow-none',
          'transition-colors',
          'border-[var(--header-border)]',
          'hover:border-[color:color-mix(in_srgb,var(--color-brand-600)_35%,var(--header-border))]',
          'hover:bg-[color:color-mix(in_srgb,var(--color-brand-600)_3%,var(--card))]',
          'focus-within:border-[color:color-mix(in_srgb,var(--color-brand-600)_35%,var(--header-border))]',
        )}
      >
        <CardHeader className="gap-2">
          <CardTitle className="flex items-start justify-between gap-3">
            <span className="leading-snug">{item.title}</span>
            <ArrowRight
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </CardTitle>
          <CardDescription>{item.description}</CardDescription>
        </CardHeader>

        <CardFooter className="mt-6">
          <span className="text-xs font-medium text-[var(--muted-foreground)]">{kindLabel}</span>
          <span className="text-xs font-medium text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--color-brand-600)]">
            {ctaLabel}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

function ViewModeToggle({
  isRu,
  value,
  onChange,
}: {
  isRu: boolean;
  value: 'cards' | 'list';
  onChange: (next: 'cards' | 'list') => void;
}) {
  const label = isRu ? 'Вид:' : 'View:';
  const cardsLabel = isRu ? 'Карточки' : 'Cards';
  const listLabel = isRu ? 'Список' : 'List';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]">{label}</span>
      <div className="inline-flex rounded-xl border border-[var(--header-border)] bg-background/60 p-1">
        <ToggleButton active={value === 'cards'} onClick={() => onChange('cards')}>
          {cardsLabel}
        </ToggleButton>
        <ToggleButton active={value === 'list'} onClick={() => onChange('list')}>
          {listLabel}
        </ToggleButton>
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-1.5 text-sm font-medium',
        'transition-colors duration-150',
        active
          ? 'bg-[color:color-mix(in_srgb,var(--color-brand-600)_16%,transparent)] text-foreground'
          : 'bg-transparent text-[var(--muted-foreground)] hover:bg-muted/40 hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
      )}
    >
      {children}
    </button>
  );
}
