'use client';

import Link from 'next/link';
import { type MouseEvent, type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Beaker,
  FileText,
  PaintRoller,
  Sparkles,
  Star,
  Wrench,
} from 'lucide-react';

import { Card, CardDescription, CardHeader, CardTitle } from '@/app/(site)/shared/ui/card';
import { cn } from '@/lib/cn';
import { focusRingBase } from '@/lib/focus-ring';
import type { Locale } from '@/lib/i18n';
import { buildPath } from '@/lib/paths';
import type { ProductsHubCard, ProductsHubGroup } from '@/lib/content/products-hub';

type ProductsPageClientProps = {
  locale: Locale;
  groups: ProductsHubGroup[];
};

const ICONS: Record<string, ReactElement> = {
  beaker: <Beaker className="h-4 w-4" aria-hidden />,
  roller: <PaintRoller className="h-4 w-4" aria-hidden />,
  sparkles: <Sparkles className="h-4 w-4" aria-hidden />,
  wrench: <Wrench className="h-4 w-4" aria-hidden />,
  star: <Star className="h-4 w-4" aria-hidden />,
};

function isModifiedEvent(e: MouseEvent<HTMLAnchorElement>) {
  return e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.button !== 0;
}

function InlineWikiLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'underline underline-offset-4 decoration-[var(--border)]',
        'hover:decoration-[color:color-mix(in_srgb,var(--color-brand-600)_55%,var(--border))]',
      )}
    >
      {children}
    </Link>
  );
}

function HubCard({ item }: { item: ProductsHubCard }) {
  const src = item.image?.src ?? '/placeholders/product-card.svg';
  const alt = item.image?.alt ?? '';
  const href = item.href ?? '#';

  return (
    <Link
      href={href}
      className={cn(
        'group block h-full rounded-2xl',
        focusRingBase,
      )}
    >
      <Card
        as="article"
        className={cn(
          'h-full overflow-hidden p-0',
          'border-[var(--header-border)] bg-background/40 shadow-none',
          'transform-none hover:-translate-y-0 hover:shadow-none',
          'hover:bg-background/55',
        )}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/40">
          {/* img (а не next/image) — чтобы позже можно было подменять источники без доп. конфигов */}
          {/* eslint-disable-next-line @next/next/no-img-element -- Используем <img>, чтобы при необходимости легко менять источники без дополнительных конфигов */}
          <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
          <div
            className={cn(
              'pointer-events-none absolute inset-0',
              'bg-gradient-to-t from-background/55 via-transparent to-transparent',
              'opacity-0 transition-opacity duration-200 ease-out',
              'group-hover:opacity-100',
            )}
            aria-hidden
          />
        </div>

        <div className="p-5 sm:p-6">
          <CardHeader className="mb-0 gap-2">
            <CardTitle className="m-0 flex items-start justify-between gap-3 text-base font-semibold sm:text-lg">
              <span className="line-clamp-2 leading-snug">{item.title}</span>
              <ArrowRight
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-foreground)]',
                  'transition-transform duration-200 ease-out',
                  'group-hover:translate-x-0.5',
                )}
                aria-hidden
              />
            </CardTitle>
            <CardDescription className="line-clamp-3 min-h-[3.9rem]">
              {item.description}
            </CardDescription>
          </CardHeader>
        </div>
      </Card>
    </Link>
  );
}

function ProductsSection({
  id,
  title,
  description,
  items,
}: {
  id: string;
  title: string;
  description: string;
  items: ProductsHubGroup['cards'];
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-[calc(var(--header-height)+4rem)]',
        'p-5 sm:p-6',
      )}
    >
      <header className="mb-5 space-y-2">
        <h2 className="mt-0 text-lg font-semibold sm:text-xl">{title}</h2>
        <p className="m-0 max-w-3xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
          {description}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <HubCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export function ProductsPageClient({ locale, groups }: ProductsPageClientProps) {
  const isRu = locale === 'ru';

  const [isNavPinned, setIsNavPinned] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  const sectionIds = useMemo(() => groups.map((group) => group.id), [groups]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    groups.forEach((group) => {
      map.set(group.id, group.cards.length);
    });
    return map;
  }, [groups]);

  // Определяем момент «прилипания» липкой полосы.
  // Важно: активная подсветка пунктов появляется ТОЛЬКО после того,
  // как полоса реально стала sticky (и уже виден соответствующий блок).
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    let raf = 0;

    const update = () => {
      raf = 0;
      const rectTop = nav.getBoundingClientRect().top;
      const stickyTop = Number.parseFloat(window.getComputedStyle(nav).top || '0');
      const pinned = rectTop <= stickyTop + 0.5;

      setIsNavPinned((prev) => {
        if (prev && !pinned) {
          setActiveSection(null);
        }
        return pinned;
      });
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // Активная секция — только когда навбар уже прилип.
  useEffect(() => {
    if (!isNavPinned) return;

    const ids = sectionIds;
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));

        const top = visible[0];
        if (!top?.target?.id) return;
        const id = top.target.id;
        if (ids.includes(id)) setActiveSection(id);
      },
      {
        root: null,
        // «Окно» подсветки — ближе к верхней части вьюпорта, но не вплотную.
        rootMargin: '-32% 0px -58% 0px',
        threshold: [0.12, 0.2, 0.35, 0.55],
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [isNavPinned, sectionIds]);

  const trustStartTitle = isRu
    ? 'Материалы с предсказуемым результатом'
    : 'Materials with predictable performance';

  const trustStartLead = isRu
    ? 'Мы работаем с литейными связующими системами, противопригарными покрытиями и сервисными материалами. Важно не только «что купить», но и как материал поведёт себя в вашем процессе.'
    : 'We work with binder systems, coatings and auxiliary materials. What matters is not only what you buy, but how it behaves in your process.';

  const trustStartItems = isRu
    ? [
        {
          icon: <Beaker className="h-4 w-4" aria-hidden />,
          title: 'Подбор под процесс',
          text: 'Отталкиваемся от технологии: тип процесса, смесь, режимы, требования к поверхности и прочности.',
        },
        {
          icon: <Wrench className="h-4 w-4" aria-hidden />,
          title: 'Практика участка',
          text: 'Учитываем реальные условия нанесения/смешивания и типовые точки риска при внедрении.',
        },
        {
          icon: <FileText className="h-4 w-4" aria-hidden />,
          title: 'Техдокументация',
          text: 'По запросу предоставим технические данные и рекомендации по применению.',
        },
        {
          icon: <BadgeCheck className="h-4 w-4" aria-hidden />,
          title: 'Стабильность результата',
          text: 'Цель — повторяемость на производстве, а не «разовая удача» на пробе.',
        },
      ]
    : [
        {
          icon: <Beaker className="h-4 w-4" aria-hidden />,
          title: 'Process-first selection',
          text: 'We select materials based on your technology and quality targets.',
        },
        {
          icon: <Wrench className="h-4 w-4" aria-hidden />,
          title: 'Shop-floor reality',
          text: 'We consider real mixing/application conditions and typical implementation pitfalls.',
        },
        {
          icon: <FileText className="h-4 w-4" aria-hidden />,
          title: 'Technical documents',
          text: 'Datasheets and recommendations are provided on request.',
        },
        {
          icon: <BadgeCheck className="h-4 w-4" aria-hidden />,
          title: 'Stable outcomes',
          text: 'We focus on repeatability in production, not one-off trial results.',
        },
      ];

  const helpTitle = isRu
    ? 'Поможем с внедрением и переходом на новый процесс'
    : 'We can help with implementation and process change';

  const helpLead = isRu
    ? 'Наша команда поможет с внедрением нашей продукции, сменой процесса и запуском нового производства.'
    : 'Our team can help you implement our products, change the process and launch new production.';

  const helpItems = isRu
    ? [
        'Подберём материалы под процесс и ваши требования.',
        'Объясним, как всё работает: состав системы, режимы, контроль параметров.',
        'Сопроводим внедрение и первые партии на участке.',
        'Окажем дальнейшую поддержку и поможем стабилизировать результат.',
      ]
    : [
        'We select materials for your process and requirements.',
        'We explain how it works: system, modes and control points.',
        'We support implementation and the first batches.',
        'We provide further support to stabilize the result.',
      ];

  return (
    <div className="space-y-12 lg:space-y-14">
      {/* 1) Верхний блок доверия */}
      <section className="rounded-3xl border border-[var(--header-border)] bg-muted/20 p-5 sm:p-6">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-start">
          <div className="space-y-3">
            <h2 className="mt-0 text-lg font-semibold sm:text-xl">{trustStartTitle}</h2>
            <p className="m-0 max-w-3xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {trustStartLead}
            </p>

            <p className="m-0 text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {isRu ? (
                <>
                  Вы также можете самостоятельно подобрать материал, воспользовавшись нашим{' '}
                  <InlineWikiLink href={buildPath(locale, ['catalog'])}>каталогом</InlineWikiLink>, где представлена
                  вся продукция и удобная фильтрация по процессу, назначению и основе.
                </>
              ) : (
                <>
                  You can also choose materials on your own using our{' '}
                  <InlineWikiLink href={buildPath(locale, ['catalog'])}>catalogue</InlineWikiLink> with convenient
                  filters.
                </>
              )}
            </p>
          </div>

          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {trustStartItems.map((item) => (
              <li
                key={item.title}
                className={cn(
                  'rounded-2xl border border-[var(--header-border)] bg-background/45 p-4',
                  'transition-colors duration-200 ease-out',
                  'hover:bg-background/60',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      'border border-[var(--header-border)] bg-muted/60 text-foreground',
                    )}
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  <div className="space-y-1">
                    <p className="m-0 text-sm font-semibold leading-snug">{item.title}</p>
                    <p className="m-0 text-sm leading-relaxed text-[var(--muted-foreground)]">{item.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 9) Липкая навигация по секциям */}
      <nav
        ref={navRef}
        aria-label={isRu ? 'Навигация по разделам продукции' : 'Product sections navigation'}
        className={cn(
          'sticky z-10',
          'top-[var(--header-height)]',
          'rounded-2xl border border-[var(--header-border)] backdrop-blur',
          isNavPinned
            ? 'bg-background/92 shadow-sm'
            : 'bg-background/55',
          'p-2',
        )}
      >
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {groups.map((group) => {
            const icon = ICONS[group.icon ?? 'sparkles'] ?? <Sparkles className="h-4 w-4" aria-hidden />;
            const label =
              group.title ?? (isRu ? 'Раздел продукции' : 'Product section');
            const isActive = isNavPinned && activeSection === group.id;
            const count = counts.get(group.id) ?? 0;

            return (
              <a
                key={group.id}
                href={`#${group.id}`}
                onClick={(e) => {
                  if (isModifiedEvent(e)) return;
                  e.preventDefault();
                  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
                  document
                    .getElementById(group.id)
                    ?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
                }}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium',
                  'transition-colors duration-150 ease-out',
                  isActive
                    ? cn(
                        'border border-[color:color-mix(in_srgb,var(--color-brand-600)_35%,var(--header-border))]',
                        'bg-[color:color-mix(in_srgb,var(--color-brand-600)_12%,transparent)]',
                        'text-foreground',
                      )
                    : cn(
                        'border border-[var(--header-border)] bg-transparent text-[var(--muted-foreground)]',
                        'hover:border-[color:color-mix(in_srgb,var(--color-brand-600)_22%,var(--header-border))]',
                        'hover:bg-muted/40 hover:text-foreground',
                      ),
                  focusRingBase,
                )}
              >
                {icon}
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

      {/* 6) Секции с карточками */}
      <div className="space-y-10 lg:space-y-12">
        {groups.map((group) => {
          const fallbackTitle = group.id === 'binders'
            ? isRu
              ? 'Связующие системы'
              : 'Binder systems'
            : group.id === 'coatings'
              ? isRu
                ? 'Противопригарные покрытия'
                : 'Coatings'
              : group.id === 'auxiliaries'
                ? isRu
                  ? 'Вспомогательные материалы'
                  : 'Auxiliary materials'
                : isRu
                  ? 'Раздел продукции'
                  : 'Product section';

          const fallbackDescription = group.id === 'binders'
            ? isRu
              ? 'Связующие и отвердители для основных процессов формовки и стержневого производства.'
              : 'Binders and hardeners for the main moulding and core-making processes.'
            : group.id === 'coatings'
              ? isRu
                ? 'Спиртовые покрытия и покрытия на водной основе с широкой линейкой наполнителей.'
                : 'Alcohol- and water-based coatings with a wide range of fillers.'
              : group.id === 'auxiliaries'
                ? isRu
                  ? 'Сервисные материалы для участка: разделительные составы, клеи, ремонтные пасты, шнуры, отмывающие составы, экзотермика, модификаторы.'
                  : 'Service supplies: release compounds, glues, repair pastes, sealing cords, cleaners, exothermics, modifiers.'
                : isRu
                  ? 'Подборка продуктов этой категории.'
                  : 'A curated set of product cards.';

          return (
            <ProductsSection
              key={group.id}
              id={group.id}
              title={group.title ?? fallbackTitle}
              description={group.description ?? fallbackDescription}
              items={group.cards}
            />
          );
        })}
      </div>

      {/* 2) Финальный блок "внедрение" (без CTA-кнопок) */}
      <section className="rounded-3xl border border-[var(--header-border)] bg-muted/20 p-5 sm:p-6">
        <header className="space-y-2">
          <h2 className="mt-0 text-lg font-semibold sm:text-xl">{helpTitle}</h2>
          <p className="m-0 max-w-3xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            {helpLead}
          </p>
        </header>

        <ul className="m-0 mt-5 grid list-none gap-3 p-0 md:grid-cols-2">
          {helpItems.map((item) => (
            <li
              key={item}
              className={cn(
                'rounded-2xl border border-[var(--header-border)] bg-background/45 p-4',
                'transition-colors duration-200 ease-out hover:bg-background/60',
              )}
            >
              <span className="text-sm leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>

        <p className="m-0 mt-5 text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
          {isRu ? (
            <>
              Если нужно — напишите нам через{' '}
              <InlineWikiLink href={buildPath(locale, ['contacts'])}>контакты</InlineWikiLink>, и мы предложим варианты
              под вашу задачу.
            </>
          ) : (
            <>
              If you’d like, reach us via{' '}
              <InlineWikiLink href={buildPath(locale, ['contacts'])}>contacts</InlineWikiLink> and we’ll suggest options
              for your task.
            </>
          )}
        </p>
      </section>
    </div>
  );
}
