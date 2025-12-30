'use client';

import Link from 'next/link';
import {
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Beaker,
  ChevronLeft,
  ChevronRight,
  FileText,
  PaintRoller,
  Sparkles,
  Star,
  Wrench,
  X,
} from 'lucide-react';

import { AppleHoverLift } from '@/app/(site)/shared/ui/apple-hover-lift';
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

// Motion tuning for the tile modal (feel free to tweak values).
const TILE_MODAL_MOTION = {
  backdropInMs: 650,
  backdropOutMs: 520,
  dialogInMs: 420,
  dialogOutMs: 320,
  backdropBlurPx: 18,
  dialogTranslateYPx: 12,
  dialogScaleFrom: 0.96,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

function isModifiedEvent(e: MouseEvent<HTMLAnchorElement>) {
  return e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.button !== 0;
}

function HubCard({ item }: { item: ProductsHubCard }) {
  const src = item.image?.src ?? '/placeholders/product-card.svg';
  const alt = item.image?.alt ?? '';
  const href = item.href ?? '#';

  return (
    <AppleHoverLift>
      <Link href={href} className={cn('group block h-full rounded-2xl', focusRingBase)}>
        <Card
          as="article"
          className={cn(
            'h-full overflow-hidden p-0',
            'border-[var(--header-border)] bg-background/40 shadow-none',
            'transform-none hover:shadow-none hover:-translate-y-0',
            'transition-colors duration-200 ease-out hover:bg-background/55',
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
                <span className="line-clamp-2 min-h-[2.75rem] leading-snug sm:min-h-[3.1rem]">{item.title}</span>
                <ArrowRight
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-foreground)]',
                    'transition-transform duration-200 ease-out',
                    'group-hover:translate-x-0.5',
                  )}
                  aria-hidden
                />
              </CardTitle>
              <CardDescription className="line-clamp-4 min-h-[5.2rem]">{item.description}</CardDescription>
            </CardHeader>
          </div>
        </Card>
      </Link>
    </AppleHoverLift>
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
  const hasDescription = description.trim().length > 0;

  return (
    <section
      id={id}
      className={cn('py-5 sm:py-6')}
      style={{ scrollMarginTop: 'calc(var(--header-height) + var(--products-nav-height, 0px) + 1.5rem)' }}
    >
      <header className="mb-5 space-y-2">
        <h2 className="mt-0 text-lg font-semibold sm:text-xl">{title}</h2>
        {hasDescription ? (
          <p className="m-0 max-w-3xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            {description}
          </p>
        ) : null}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <HubCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function InsightTilesCarousel({
  title,
  tiles,
  isRu,
  onOpen,
}: {
  title: string;
  tiles: InsightTile[];
  isRu: boolean;
  onOpen: (id: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const stepRef = useRef(0);
  const perPageRef = useRef(1);

  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let scrollRaf = 0;
    let measureRaf = 0;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setCanScroll({
        left: el.scrollLeft > 1,
        right: el.scrollLeft < max - 1,
      });
    };

    const measure = () => {
      const items = Array.from(el.querySelectorAll<HTMLElement>('[data-carousel-item="1"]'));

      if (items.length >= 2) stepRef.current = items[1].offsetLeft - items[0].offsetLeft;
      else if (items.length === 1) stepRef.current = items[0].offsetWidth;
      else stepRef.current = 0;

      const step = stepRef.current || 1;

      const styles = window.getComputedStyle(el);
      const padLeft = Number.parseFloat(styles.paddingLeft) || 0;
      const padRight = Number.parseFloat(styles.paddingRight) || 0;
      const innerWidth = Math.max(0, el.clientWidth - padLeft - padRight);

      perPageRef.current = Math.max(1, Math.floor((innerWidth + 1) / step));
      update();
    };

    const scheduleUpdate = () => {
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(() => {
        scrollRaf = 0;
        update();
      });
    };

    const scheduleMeasure = () => {
      if (measureRaf) return;
      measureRaf = window.requestAnimationFrame(() => {
        measureRaf = 0;
        measure();
      });
    };

    measure();
    el.addEventListener('scroll', scheduleUpdate, { passive: true });

    const ro = new ResizeObserver(scheduleMeasure);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', scheduleUpdate);
      ro.disconnect();
      if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
      if (measureRaf) window.cancelAnimationFrame(measureRaf);
    };
  }, [tiles.length]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;

    const step = stepRef.current || el.clientWidth;
    const perPage = perPageRef.current || 1;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({
      left: dir * Math.round(step * perPage),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <div className="mt-0">
      <header className="space-y-3">
        <h2 className="mt-0 text-lg font-semibold sm:text-xl">{title}</h2>

        {/* Стрелки оставляем и на мобильном: они живут строкой под заголовком */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            disabled={!canScroll.left}
            aria-label={isRu ? 'Прокрутить карточки влево' : 'Scroll cards left'}
            aria-controls="why-tiles-carousel"
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-full',
              'border border-[var(--header-border)] bg-background/70 text-[var(--muted-foreground)]',
              'hover:bg-background/90 hover:text-foreground',
              'disabled:cursor-not-allowed disabled:opacity-40',
              focusRingBase,
            )}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => scrollByDir(1)}
            disabled={!canScroll.right}
            aria-label={isRu ? 'Прокрутить карточки вправо' : 'Scroll cards right'}
            aria-controls="why-tiles-carousel"
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-full',
              'border border-[var(--header-border)] bg-background/70 text-[var(--muted-foreground)]',
              'hover:bg-background/90 hover:text-foreground',
              'disabled:cursor-not-allowed disabled:opacity-40',
              focusRingBase,
            )}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </header>

      <div className="relative mt-5">
        <div
          ref={scrollerRef}
          id="why-tiles-carousel"
          className={cn(
            // Важно: НЕ уходим в отрицательные внешние отступы.
            // На узких экранах (и при overflow-x: hidden на body) это даёт ощущение,
            // что ряд "поджимает" справа и карточки смещаются влево.
            // Вместо этого даём небольшой внутренний "safe-area" под hover-scale.
            'no-scrollbar flex w-full gap-4 overflow-x-auto pb-3 pt-1 px-1',
            'snap-x snap-mandatory scroll-smooth',
            'touch-pan-x overscroll-x-contain',
          )}
          aria-label={isRu ? 'Преимущества работы с «Интема Групп»' : 'Why work with InTema Group'}
        >
          {tiles.map((tile) => (
            <div key={tile.id} data-carousel-item="1" className="w-[280px] sm:w-[320px] shrink-0 snap-start">
              {/*
                Внутри горизонтального скролла трансформ (scale) часто делает текст "мыльным" на hover.
                Поэтому используем режим surface: масштабируем только подложку (border/bg),
                а контент остаётся без transform — текст остаётся чётким.
              */}
              <AppleHoverLift
                mode="surface"
                surfaceClassName={cn(
                  'rounded-2xl border border-[var(--header-border)]',
                  'bg-background/45 transition-colors duration-200 ease-out',
                  'group-hover:bg-background/60',
                )}
              >
                <button
                  type="button"
                  onClick={() => onOpen(tile.id)}
                  className={cn(
                    'w-full h-[168px] sm:h-[176px] rounded-2xl p-4 text-left flex flex-col',
                    'bg-transparent',
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
                      <p className="m-0 text-sm font-semibold leading-snug line-clamp-2 min-h-[2.4rem]">{tile.title}</p>
                      <p className="m-0 mt-1 text-sm leading-relaxed text-[var(--muted-foreground)] line-clamp-2 min-h-[2.9rem]">{tile.lead}</p>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-4 text-sm font-medium text-[var(--muted-foreground)] transition-colors group-hover:text-foreground">
                    <span>{isRu ? 'Подробнее' : 'Learn more'}</span>
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </div>
                </button>
              </AppleHoverLift>
            </div>
          ))}
        </div>

        
      </div>
    </div>
  );
}

export function ProductsPageClient({ locale, groups }: ProductsPageClientProps) {
  const isRu = locale === 'ru';

  const [isNavPinned, setIsNavPinned] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const navSlotRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const sectionsRef = useRef<HTMLElement[]>([]);
  const [navLayout, setNavLayout] = useState<{ height: number; width: number; left: number } | null>(null);

  const sectionIds = useMemo(() => groups.map((group) => group.id), [groups]);

  // Список DOM-узлов секций нужен для быстрого и предсказуемого подсчёта активной вкладки.
  // (IntersectionObserver по ratio здесь плохо подходит: короткая секция может «перебивать» длинную.)
  useEffect(() => {
    sectionsRef.current = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
  }, [sectionIds]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    groups.forEach((group) => {
      map.set(group.id, group.cards.length);
    });
    return map;
  }, [groups]);

  const whyTitle = isRu ? 'Почему удобно работать с «Интема Групп»' : 'Why work with InTema Group';

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

  const [renderedTile, setRenderedTile] = useState<InsightTile | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const openRaf1Ref = useRef<number | null>(null);
  const openRaf2Ref = useRef<number | null>(null);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  const closeTileModal = () => {
    // Важно: сбрасываем openTileId СРАЗУ, чтобы можно было тут же открыть ту же плитку повторно.
    // Саму модалку держим в DOM через renderedTile, чтобы анимация закрытия была плавной.
    setOpenTileId(null);

    if (openRaf1Ref.current) window.cancelAnimationFrame(openRaf1Ref.current);
    if (openRaf2Ref.current) window.cancelAnimationFrame(openRaf2Ref.current);
    openRaf1Ref.current = null;
    openRaf2Ref.current = null;

    setIsModalVisible(false);

    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);

    const delay = prefersReducedMotion
      ? 0
      : Math.max(TILE_MODAL_MOTION.backdropOutMs, TILE_MODAL_MOTION.dialogOutMs) + 40;

    closeTimerRef.current = window.setTimeout(() => {
      setRenderedTile(null);
    }, delay);
  };

  useEffect(() => {
    if (!activeTile) return;

    // Если модалка была в процессе закрытия — отменяем размонтирование.
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setRenderedTile(activeTile);

    // Для reduce-motion просто показываем сразу.
    if (prefersReducedMotion) {
      setIsModalVisible(true);
      return;
    }

    // Критично: при открытии нельзя включать "visible" в том же кадре,
    // иначе браузер увидит элемент уже в финальном состоянии и перехода не будет.
    // Делаем double-rAF: 1-й кадр — монтируем в opacity:0 / blur:0,
    // 2-й кадр — включаем видимость и запускаем transition.
    setIsModalVisible(false);

    if (openRaf1Ref.current) window.cancelAnimationFrame(openRaf1Ref.current);
    if (openRaf2Ref.current) window.cancelAnimationFrame(openRaf2Ref.current);

    openRaf1Ref.current = window.requestAnimationFrame(() => {
      openRaf2Ref.current = window.requestAnimationFrame(() => {
        setIsModalVisible(true);
      });
    });

    return () => {
      if (openRaf1Ref.current) window.cancelAnimationFrame(openRaf1Ref.current);
      if (openRaf2Ref.current) window.cancelAnimationFrame(openRaf2Ref.current);
      openRaf1Ref.current = null;
      openRaf2Ref.current = null;
    };
  }, [activeTile, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (openRaf1Ref.current) window.cancelAnimationFrame(openRaf1Ref.current);
      if (openRaf2Ref.current) window.cancelAnimationFrame(openRaf2Ref.current);
    };
  }, []);

  // Блокируем прокрутку фона и закрываем по ESC, пока открыта модалка плитки.
  useEffect(() => {
    if (!renderedTile) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTileModal();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [renderedTile]);

  // --- Полностью переписанная логика «липкой» навигации ---
  // Почему так: position: sticky часто ломается, если у любого родителя есть overflow
  // (например overflow-x: hidden/clip) или если скролл идёт не по viewport.
  // Поэтому делаем предсказуемый вариант: обычная навигация в потоке +
  // переключение на position: fixed, когда её слот доезжает до шапки.
  useLayoutEffect(() => {
    const page = pageRef.current;
    const slot = navSlotRef.current;
    const nav = navRef.current;
    if (!slot || !nav) return;

    let raf = 0;

    const measure = () => {
      raf = 0;
      const slotRect = slot.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      const height = Math.max(0, Math.round(navRect.height));

      // CSS-переменная нужна для корректного scroll-margin-top у секций.
      // Задаём на корневом контейнере страницы, чтобы наследовалась.
      page?.style.setProperty('--products-nav-height', `${height}px`);

      setNavLayout({
        height,
        width: Math.max(0, Math.round(slotRect.width)),
        left: Math.round(slotRect.left),
      });
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('resize', schedule);

    return () => {
      window.removeEventListener('resize', schedule);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // Пин + активная секция: считаем по положению заголовков относительно «линии якоря».
  // Это стабильнее IO по intersectionRatio (короткие секции иначе часто остаются «активными» слишком долго).
  useEffect(() => {
    const slot = navSlotRef.current;
    if (!slot) return;

    const headerEl = document.querySelector<HTMLElement>('[data-site-header]');

    let raf = 0;

    const update = () => {
      raf = 0;

      // --header-height живёт на SiteShell (не на :root), поэтому читаем переменную у элемента внутри дерева.
      const headerHeight = headerEl
        ? Math.round(headerEl.getBoundingClientRect().height)
        : (() => {
          const headerHeightRaw = window.getComputedStyle(slot).getPropertyValue('--header-height');
          const parsed = Number.parseFloat(headerHeightRaw);
          return Number.isFinite(parsed) ? parsed : 0;
        })();

      // Порог с небольшим запасом, чтобы не «дребезжало» на полпикселя.
      const pinned = slot.getBoundingClientRect().top <= headerHeight + 0.5;

      setIsNavPinned((prev) => (prev === pinned ? prev : pinned));

      if (!pinned) {
        setActiveSection((prev) => (prev === null ? prev : null));
        return;
      }

      const rootFontSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
      const extraOffset = rootFontSize * 1.5; // соответствует +1.5rem в scrollMarginTop у секций
      const navHeight = navLayout?.height ?? navRef.current?.getBoundingClientRect().height ?? 0;
      const anchorLine = headerHeight + navHeight + extraOffset + 0.5;

      const nodes = sectionsRef.current;
      if (!nodes.length) return;

      let nextActive: string | null = null;
      let bestTop = -Infinity;

      for (const node of nodes) {
        const top = node.getBoundingClientRect().top;
        if (top <= anchorLine && top > bestTop) {
          bestTop = top;
          nextActive = node.id;
        }
      }

      setActiveSection((prev) => (prev === nextActive ? prev : nextActive));
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
  }, [navLayout?.height]);

  return (
    <>
      <div
        ref={pageRef}
        className="space-y-12 lg:space-y-14 mt-[calc(-1*clamp(0.5rem,2vw,2rem))]"
        style={{ '--products-nav-height': `${navLayout?.height ?? 0}px` } as CSSProperties}
      >
        {/* Apple-style: интерактивные плитки + модалка (перенесены вверх страницы) */}
        <section className="py-5 sm:py-6">
          <InsightTilesCarousel
            title={whyTitle}
            tiles={whyTiles}
            isRu={isRu}
            onOpen={setOpenTileId}
          />
        </section>

        {/* Навигация по секциям (JS-fixed вместо sticky, чтобы работало в любой разметке) */}
        <div ref={navSlotRef} className="relative">
          {/* Плейсхолдер — удерживает место, когда навигация становится fixed */}
          {isNavPinned ? (
            <div aria-hidden style={{ height: navLayout?.height ?? 0 }} />
          ) : null}

          <nav
            ref={navRef}
            aria-label={isRu ? 'Навигация по разделам продукции' : 'Product sections navigation'}
            className={cn('z-50 py-2')}
            style={
              (isNavPinned
                ? {
                    position: 'fixed',
                    top: 'var(--header-height)',
                    left: navLayout?.left ?? 0,
                    width: navLayout?.width ?? '100%',
                  }
                : undefined) as CSSProperties
            }
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
                      'bg-background/80 transition-colors duration-150 ease-out',
                      isActive
                        ? cn(
                            'border border-[color:color-mix(in_srgb,var(--color-brand-600)_35%,var(--header-border))]',
                            'bg-[color:color-mix(in_srgb,var(--color-brand-600)_18%,var(--background))]',
                            'text-foreground',
                          )
                        : cn(
                            'border border-[var(--header-border)] text-[var(--muted-foreground)]',
                            'hover:border-[color:color-mix(in_srgb,var(--color-brand-600)_22%,var(--header-border))]',
                            'hover:text-foreground',
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
                          : 'border-[var(--header-border)] bg-muted/80 text-[var(--muted-foreground)]',
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
        </div>

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
                  ? ''
                  : ''
                : group.id === 'coatings'
                  ? isRu
                    ? ''
                    : ''
                  : group.id === 'auxiliaries'
                    ? isRu
                      ? ''
                      : ''
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
      {renderedTile ? (
        <div
          className={cn(
            'fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6',
            // Пока модалка открывается/закрывается (isModalVisible=false),
            // не блокируем клики по странице — это позволяет повторно открыть плитку сразу.
            isModalVisible ? 'pointer-events-auto' : 'pointer-events-none',
          )}
        >
          <button
            type="button"
            aria-label={isRu ? 'Закрыть' : 'Close'}
            className="absolute inset-0 bg-background/55"
            style={
              prefersReducedMotion
                ? {
                    opacity: 1,
                    backdropFilter: `blur(${TILE_MODAL_MOTION.backdropBlurPx}px)`,
                    WebkitBackdropFilter: `blur(${TILE_MODAL_MOTION.backdropBlurPx}px)`,
                  }
                : {
                    opacity: isModalVisible ? 1 : 0,
                    backdropFilter: isModalVisible
                      ? `blur(${TILE_MODAL_MOTION.backdropBlurPx}px)`
                      : 'blur(0px)',
                    WebkitBackdropFilter: isModalVisible
                      ? `blur(${TILE_MODAL_MOTION.backdropBlurPx}px)`
                      : 'blur(0px)',
                    transitionProperty: 'opacity, backdrop-filter, -webkit-backdrop-filter',
                    transitionDuration: `${isModalVisible ? TILE_MODAL_MOTION.backdropInMs : TILE_MODAL_MOTION.backdropOutMs}ms`,
                    transitionTimingFunction: TILE_MODAL_MOTION.easing,
                  }
            }
            onClick={closeTileModal}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={renderedTile.title}
            className="relative w-full max-w-2xl rounded-3xl border border-[var(--header-border)] bg-background p-5 shadow-none sm:p-6"
            style={
              prefersReducedMotion
                ? {
                    opacity: 1,
                    transform: 'translateY(0px) scale(1)',
                  }
                : {
                    opacity: isModalVisible ? 1 : 0,
                    transform: isModalVisible
                      ? 'translateY(0px) scale(1)'
                      : `translateY(${TILE_MODAL_MOTION.dialogTranslateYPx}px) scale(${TILE_MODAL_MOTION.dialogScaleFrom})`,
                    transitionProperty: 'opacity, transform',
                    transitionDuration: `${isModalVisible ? TILE_MODAL_MOTION.dialogInMs : TILE_MODAL_MOTION.dialogOutMs}ms`,
                    transitionTimingFunction: TILE_MODAL_MOTION.easing,
                  }
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="m-0 text-xs font-semibold text-[var(--muted-foreground)]">
                  {isRu ? 'Подробности' : 'Details'}
                </p>
                <h3 className="mt-1 text-lg font-semibold leading-snug sm:text-xl">{renderedTile.title}</h3>
              </div>

              <button
                type="button"
                onClick={closeTileModal}
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
              {renderedTile.details.map((p) => (
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
