'use client';

import Link from 'next/link';
import { type MouseEvent, type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, Beaker, FileText, PaintRoller, Sparkles, Star, Wrench, X } from 'lucide-react';

import { Card, CardDescription, CardHeader, CardTitle } from '@/app/(site)/shared/ui/card';
import { cn } from '@/lib/cn';
import { focusRingBase } from '@/lib/focus-ring';
import type { Locale } from '@/lib/i18n';
import type { ProductsHubCard, ProductsHubGroup } from '@/lib/content/products-hub';

type ProductsPageClientProps = {
  locale: Locale;
  groups: ProductsHubGroup[];
};

type InsightTile = {
  id: string;
  icon: ReactElement;
  title: string;
  lead: string;
  details: string[];
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

function HubCard({ item }: { item: ProductsHubCard }) {
  const src = item.image?.src ?? '/placeholders/product-card.svg';
  const alt = item.image?.alt ?? '';
  const href = item.href ?? '#';

  return (
    <Link href={href} className={cn('group block h-full rounded-2xl', focusRingBase)}>
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
            <CardDescription className="line-clamp-3 min-h-[3.9rem]">{item.description}</CardDescription>
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
    <section id={id} className={cn('scroll-mt-[calc(var(--header-height)+4rem)]', 'p-5 sm:p-6')}>
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

  const whyTitle = isRu ? 'Почему удобно работать с «Интема Групп»' : 'Why work with InTema Group';
  const whyLead = isRu
    ? 'Как и у Apple, здесь плитки — это короткие тезисы. Нажмите, чтобы открыть подробности.'
    : 'Like Apple’s tiles, these are short claims. Click to open details.';

  const whyTiles: InsightTile[] = useMemo(
    () =>
      isRu
        ? [
            {
              id: 'process',
              icon: <Beaker className="h-4 w-4" aria-hidden />,
              title: 'Подбор под процесс',
              lead: 'Отталкиваемся от технологии, а не от “любимого продукта”.',
              details: [
                'Учитываем процесс формовки/стержневой, тип смеси, режимы, требования к поверхности и прочности.',
                'Помогаем сузить выбор до рабочих вариантов и объясняем, почему они подходят.',
                'Если нужно — согласуем контрольные параметры для стабильного результата.',
              ],
            },
            {
              id: 'docs',
              icon: <FileText className="h-4 w-4" aria-hidden />,
              title: 'Документы и рекомендации',
              lead: 'Техданные и безопасное применение — без лишней бюрократии.',
              details: [
                'По запросу предоставим технические данные (TDS) и паспорт безопасности (SDS), а также рекомендации по применению.',
                'Подскажем, какие параметры важны на участке (вязкость, плотность, режимы сушки/отверждения и т.д.).',
              ],
            },
            {
              id: 'stability',
              icon: <BadgeCheck className="h-4 w-4" aria-hidden />,
              title: 'Повторяемость на производстве',
              lead: 'Цель — стабильность в партии, а не разовый “идеальный” тест.',
              details: [
                'Смотрим на внедрение как на процесс: проба → корректировки → закрепление режима.',
                'Обсуждаем типовые риски (сушка, газование, нанесение, хранение, смешивание) заранее.',
              ],
            },
            {
              id: 'support',
              icon: <Wrench className="h-4 w-4" aria-hidden />,
              title: 'Сопровождение внедрения',
              lead: 'Помогаем перейти на новый материал или процесс без хаоса.',
              details: [
                'Согласуем план внедрения: что замеряем, какие критерии “успеха”, в каком порядке меняем параметры.',
                'На старте даём “короткие правила” для участка: что критично, а что вторично.',
              ],
            },
          ]
        : [
            {
              id: 'process',
              icon: <Beaker className="h-4 w-4" aria-hidden />,
              title: 'Process-first selection',
              lead: 'We start from your technology, not from a “favorite product”.',
              details: [
                'We consider the process, sand mix, modes, surface requirements and strength targets.',
                'We help narrow down options and explain why they fit.',
                'If needed, we agree on control points for stable results.',
              ],
            },
            {
              id: 'docs',
              icon: <FileText className="h-4 w-4" aria-hidden />,
              title: 'Documents & guidance',
              lead: 'Technical and safe application without extra friction.',
              details: [
                'On request, we provide TDS/SDS and practical application recommendations.',
                'We highlight key shop-floor parameters: viscosity, density, curing/drying modes, etc.',
              ],
            },
            {
              id: 'stability',
              icon: <BadgeCheck className="h-4 w-4" aria-hidden />,
              title: 'Production repeatability',
              lead: 'Stable batches matter more than a one-off perfect trial.',
              details: [
                'We treat implementation as a process: trial → adjustments → stabilized modes.',
                'We discuss typical risks (drying, gassing, application, storage, mixing) upfront.',
              ],
            },
            {
              id: 'support',
              icon: <Wrench className="h-4 w-4" aria-hidden />,
              title: 'Implementation support',
              lead: 'A controlled transition to a new material or process.',
              details: [
                'We align the plan: what to measure, success criteria, and the order of changes.',
                'We provide shop-floor “quick rules”: what is critical and what is secondary.',
              ],
            },
          ],
    [isRu],
  );

  const [openTileId, setOpenTileId] = useState<string | null>(null);
  const activeTile = whyTiles.find((t) => t.id === openTileId) ?? null;

  // Блокируем прокрутку фона и закрываем по ESC, пока открыта модалка плитки.
  useEffect(() => {
    if (!openTileId) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenTileId(null);
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openTileId]);

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
        rootMargin: '-32% 0px -58% 0px',
        threshold: [0.12, 0.2, 0.35, 0.55],
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [isNavPinned, sectionIds]);

  return (
    <>
      <div className="space-y-12 lg:space-y-14">
        {/* Apple-style: интерактивные плитки + модалка (перенесены вверх страницы) */}
        <section className="rounded-3xl border border-[var(--header-border)] bg-muted/20 p-5 sm:p-6">
          <header className="space-y-2">
            <h2 className="mt-0 text-lg font-semibold sm:text-xl">{whyTitle}</h2>
            <p className="m-0 max-w-3xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {whyLead}
            </p>
          </header>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyTiles.map((tile) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => setOpenTileId(tile.id)}
                className={cn(
                  'group w-full rounded-2xl border border-[var(--header-border)] bg-background/45 p-4 text-left',
                  'transition-[transform,background-color,box-shadow] duration-200 ease-out',
                  'hover:-translate-y-0.5 hover:bg-background/60 hover:shadow-md',
                  focusRingBase,
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
                    {tile.icon}
                  </span>

                  <div className="min-w-0">
                    <p className="m-0 text-sm font-semibold leading-snug">{tile.title}</p>
                    <p className="m-0 mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">{tile.lead}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors group-hover:text-foreground">
                  <span>{isRu ? 'Подробнее' : 'Learn more'}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Липкая навигация по секциям */}
        <nav
          ref={navRef}
          aria-label={isRu ? 'Навигация по разделам продукции' : 'Product sections navigation'}
          className={cn('sticky z-10', 'top-[var(--header-height)]', 'p-2')}
        >
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
            {groups.map((group) => {
              const icon = ICONS[group.icon ?? 'sparkles'] ?? <Sparkles className="h-4 w-4" aria-hidden />;
              const label = group.title ?? (isRu ? 'Раздел продукции' : 'Product section');
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

        {/* Секции с карточками */}
        <div className="space-y-10 lg:space-y-12">
          {groups.map((group) => {
            const fallbackTitle =
              group.id === 'binders'
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

            const fallbackDescription =
              group.id === 'binders'
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
      </div>

      {/* Модалка для плиток */}
      {activeTile ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label={isRu ? 'Закрыть' : 'Close'}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setOpenTileId(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={activeTile.title}
            className={cn(
              'relative w-full max-w-2xl rounded-3xl border border-[var(--header-border)] bg-background p-5 shadow-lg',
              'sm:p-6',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="m-0 text-xs font-semibold text-[var(--muted-foreground)]">
                  {isRu ? 'Подробности' : 'Details'}
                </p>
                <h3 className="mt-1 text-lg font-semibold leading-snug sm:text-xl">{activeTile.title}</h3>
              </div>

              <button
                type="button"
                onClick={() => setOpenTileId(null)}
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-xl',
                  'border border-[var(--header-border)] bg-muted/20 text-foreground',
                  'transition-colors duration-150 ease-out hover:bg-muted/35',
                  focusRingBase,
                )}
                aria-label={isRu ? 'Закрыть окно' : 'Close dialog'}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {activeTile.details.map((p) => (
                <p key={p} className="m-0">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
