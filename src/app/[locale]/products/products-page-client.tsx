'use client';

import Link from 'next/link';
import {
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
  useId,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BadgeCheck,
  Beaker,
  ChevronLeft,
  ChevronRight,
  Boxes,
  FileLock,
  FileText,
  HandCoins,
  HandHelping,
  Handshake,
  Leaf,
  Repeat2,
  Target,
  PaintRoller,
  Sparkles,
  Star,
  Truck,
  Wrench,
  X,
  Plus,
} from 'lucide-react';

import { AppleHoverLift } from '@/app/(site)/shared/ui/apple-hover-lift';
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/(site)/shared/ui/card';
import { cn } from '@/lib/cn';
import { focusRingBase } from '@/lib/focus-ring';
import type { Locale } from '@/lib/i18n';
import type { ProductsHubCard, ProductsHubGroup, ProductsHubInsight } from '@/lib/content/products-hub';

type ProductsPageClientProps = {
  locale: Locale;
  groups: ProductsHubGroup[];
  insights: ProductsHubInsight[];
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
  'file-text': <FileText className="h-4 w-4" aria-hidden />,
  'badge-check': <BadgeCheck className="h-4 w-4" aria-hidden />,
  roller: <PaintRoller className="h-4 w-4" aria-hidden />,
  sparkles: <Sparkles className="h-4 w-4" aria-hidden />,
  wrench: <Wrench className="h-4 w-4" aria-hidden />,
  star: <Star className="h-4 w-4" aria-hidden />,
  target: <Target className="h-4 w-4" aria-hidden />,
  'hand-helping': <HandHelping className="h-4 w-4" aria-hidden />,
  'repeat-2': <Repeat2 className="h-4 w-4" aria-hidden />,
  'hand-coins': <HandCoins className="h-4 w-4" aria-hidden />,
  handshake: <Handshake className="h-4 w-4" aria-hidden />,
  leaf: <Leaf className="h-4 w-4" aria-hidden />,
  boxes: <Boxes className="h-4 w-4" aria-hidden />,
  truck: <Truck className="h-4 w-4" aria-hidden />,
  'file-lock': <FileLock className="h-4 w-4" aria-hidden />,
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
          <div className="relative aspect-[16/6] w-full overflow-hidden bg-muted/40">
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

          <div className="p-4 sm:p-5">
            <CardHeader className="mb-0 gap-1.5">
              <CardTitle className="m-0 text-base font-semibold leading-snug sm:text-lg">
                <span className="line-clamp-2 min-h-[2.4rem] sm:min-h-[2.7rem]">{item.title}</span>
              </CardTitle>
              <CardDescription className="line-clamp-3 min-h-[3.9rem]">{item.description}</CardDescription>
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
      style={{
        scrollMarginTop:
          'calc(var(--header-height, var(--header-height-initial)) + var(--products-nav-height, 0px) + 1rem)',
      }}
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
  onOpen: (id: string, trigger: HTMLElement, restoreFocus: boolean) => void;
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

    const getPads = () => {
      const styles = window.getComputedStyle(el);
      const padLeft = Number.parseFloat(styles.paddingLeft) || 0;
      const padRight = Number.parseFloat(styles.paddingRight) || 0;
      return { padLeft, padRight };
    };

    const update = () => {
      const { padLeft, padRight } = getPads();
      const max = el.scrollWidth - el.clientWidth;
      setCanScroll({
        left: el.scrollLeft > padLeft + 2,
        right: el.scrollLeft < max - padRight - 2,
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

      // IMPORTANT: we intentionally keep scroller padding = 0,
      // so the cards align with the main content container from the first paint
      // (no hydration "jump" caused by late-applied padding).

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
              'cursor-pointer disabled:cursor-default disabled:opacity-40',
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
              'cursor-pointer disabled:cursor-default disabled:opacity-40',
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
            // Горизонтальные паддинги НЕ добавляем — карточки должны совпадать с краями контентного контейнера.
            'no-scrollbar flex w-full gap-4 overflow-x-auto pb-3 pt-2',
            'snap-x snap-mandatory scroll-smooth',
            'touch-pan-x overscroll-x-contain',
          )}
          aria-label={isRu ? 'Преимущества работы с «Интема Групп»' : 'Why work with InTema Group'}
        >
          {tiles.map((tile) => (
            <div key={tile.id} data-carousel-item="1" className="w-[280px] sm:w-[320px] shrink-0 snap-start">
              <AppleHoverLift strength="xs" className="hover:z-40 focus-within:z-40">
                <button
                  type="button"
                  onClick={(e) => onOpen(tile.id, e.currentTarget, e.detail === 0)}
                  aria-label={isRu ? `Открыть: ${tile.title}` : `Open: ${tile.title}`}
                  aria-haspopup="dialog"
                  className={cn(
                    'group relative w-full h-[240px] sm:h-[248px] cursor-pointer rounded-2xl border border-[var(--header-border)]',
                    'bg-background/45 p-4 text-left flex flex-col',
                    'transition-colors duration-200 ease-out hover:bg-background/60',
                    focusRingBase,
                  )}
                >
                  <div className="flex items-start">
                    <span
                      className={cn(
                        'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                        'border border-[var(--header-border)] bg-muted/60 text-foreground',
                      )}
                      aria-hidden
                    >
                      {tile.icon}
                    </span>
                  </div>

                  <div className="mt-1.5 min-w-0 pr-8">
                    <p className="m-0 text-sm font-semibold leading-snug line-clamp-2 min-h-[2.6rem]">
                      {tile.title}
                    </p>
                    <p className="m-0 mt-1 text-sm leading-normal text-[var(--muted-foreground)] line-clamp-4">
                      {tile.lead}
                    </p>
                  </div>

                  <Plus
                    className={cn(
                      'absolute bottom-4 right-4 h-4 w-4 text-[var(--muted-foreground)]',
                      'transition-[color,transform] duration-200 ease-out',
                      'group-hover:text-foreground group-hover:scale-[1.06]',
                      'motion-reduce:transition-none motion-reduce:transform-none',
                    )}
                    aria-hidden
                  />
                </button>
              </AppleHoverLift>
            </div>
          ))}
        </div>

        {/* Edge fade hints: subtle “there is more” signal (Apple-like). */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:w-10',
            'bg-muted',
            'transition-opacity duration-200 ease-out motion-reduce:transition-none',
            canScroll.left ? 'opacity-100' : 'opacity-0',
          )}
          style={{
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,0))',
            maskImage: 'linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,0))',
          } as CSSProperties}
        />
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:w-10',
            'bg-muted',
            'transition-opacity duration-200 ease-out motion-reduce:transition-none',
            canScroll.right ? 'opacity-100' : 'opacity-0',
          )}
          style={{
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))',
          } as CSSProperties}
        />

      </div>
    </div>
  );
}

export function ProductsPageClient({ locale, groups, insights }: ProductsPageClientProps) {
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

  const whyTiles: InsightTile[] = useMemo(() => {
    const fallbackTitle = isRu ? 'Без названия' : 'Untitled';

    return insights.map((tile) => ({
      id: tile.id,
      icon: ICONS[tile.icon ?? 'sparkles'] ?? ICONS.sparkles,
      title: tile.title ?? fallbackTitle,
      lead: tile.lead ?? '',
      details: tile.details ?? [],
    }));
  }, [insights, isRu]);

  const [openTileId, setOpenTileId] = useState<string | null>(null);
  const activeTile = whyTiles.find((t) => t.id === openTileId) ?? null;

  const [renderedTile, setRenderedTile] = useState<InsightTile | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const modalTitleId = useId();
  const modalBodyId = useId();
  const closeTimerRef = useRef<number | null>(null);
  const openRaf1Ref = useRef<number | null>(null);
  const openRaf2Ref = useRef<number | null>(null);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  const openTileModal = useCallback((id: string, trigger: HTMLElement, restoreFocus: boolean) => {
    // For pointer opens we intentionally do NOT restore focus on close.
    // Otherwise the tile can "stick" in the lifted (focus-within) state.
    restoreFocusRef.current = restoreFocus ? trigger : null;
    setOpenTileId(id);
  }, []);

  const closeTileModal = useCallback(() => {
    // Важно: сбрасываем openTileId СРАЗУ, чтобы можно было тут же открыть ту же плитку повторно.
    // Саму модалку держим в DOM через renderedTile, чтобы анимация закрытия была плавной.
    setOpenTileId(null);

    // Снимаем инертность фона сразу же при закрытии.
    // Иначе страница остаётся некликабельной на время fade-out.
    const page = pageRef.current;
    if (page) {
      page.removeAttribute('aria-hidden');
      page.removeAttribute('inert');
      (page as unknown as { inert?: boolean }).inert = false;
    }

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

      const target = restoreFocusRef.current;
      restoreFocusRef.current = null;

      if (target && document.contains(target)) {
        // Restore focus back to the tile only for keyboard-driven opens.
        window.requestAnimationFrame(() => target.focus());
      }
    }, delay);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!activeTile) return;

    // Если модалка была в процессе закрытия — отменяем размонтирование.
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    // Отменяем любые запланированные кадры открытия.
    if (openRaf1Ref.current) window.cancelAnimationFrame(openRaf1Ref.current);
    if (openRaf2Ref.current) window.cancelAnimationFrame(openRaf2Ref.current);
    openRaf1Ref.current = null;
    openRaf2Ref.current = null;

    // Стартуем из "скрытого" состояния (асинхронно, чтобы избежать sync setState в эффекте).
    const hideTimer = window.setTimeout(() => setIsModalVisible(false), 0);

    // Важно: создаём новый объект, чтобы анимация открытия сработала даже если
    // пользователь повторно открывает ту же плитку, пока предыдущая ещё не размонтировалась (состояние closing).
    const renderTimer = window.setTimeout(() => {
      setRenderedTile({
        ...activeTile,
        details: [...activeTile.details],
      });
    }, 0);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(renderTimer);
    };
  }, [activeTile]);

  // When the dialog becomes visible, move focus inside it.
  useEffect(() => {
    if (!renderedTile) return;
    if (!isModalVisible) return;

    const t = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(t);
  }, [renderedTile, isModalVisible]);

  useEffect(() => {
    if (!renderedTile) return;

    // Для reduce-motion просто показываем сразу.
    if (prefersReducedMotion) {
      const instantShowTimer = window.setTimeout(() => setIsModalVisible(true), 0);
      return () => window.clearTimeout(instantShowTimer);
    }

    // Критично: при открытии нельзя включать "visible" в том же кадре,
    // иначе браузер увидит элемент уже в финальном состоянии и перехода не будет.
    // Делаем double-rAF: 1-й кадр — элемент уже в DOM в opacity:0 / blur:0,
    // 2-й кадр — включаем видимость и запускаем transition.
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
  }, [renderedTile, prefersReducedMotion]);


  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (openRaf1Ref.current) window.cancelAnimationFrame(openRaf1Ref.current);
      if (openRaf2Ref.current) window.cancelAnimationFrame(openRaf2Ref.current);
    };
  }, []);

  // Блокируем прокрутку фона (без "прыжка" ширины из-за пропажи scrollbar).
  useEffect(() => {
    if (!renderedTile) return;

    const body = document.body;
    const html = document.documentElement;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;

    // Компенсируем исчезновение scrollbar, чтобы модалка не выглядела «дёрганой»
    // из‑за микро‑layout shift на десктопе.
    // Но: если браузер поддерживает scrollbar-gutter: stable, то место под скроллбар
    // уже зарезервировано и добавление paddingRight приведёт к видимому «сжатию».
    const gutter = window.getComputedStyle(html).getPropertyValue('scrollbar-gutter');
    const hasStableGutter = gutter.includes('stable');
    const scrollbarWidth = window.innerWidth - html.clientWidth;

    if (scrollbarWidth > 0 && !hasStableGutter) {
      const computedPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${computedPaddingRight + scrollbarWidth}px`;
    }

    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [renderedTile]);

  // Делаем фон инертным и ловим ESC/Tab только пока модалка ВИДИМА.
  // В момент закрытия сразу снимаем блокировку фона, чтобы можно было
  // мгновенно повторно кликнуть по плитке (не ждать завершения fade-out).
  useEffect(() => {
    if (!renderedTile) return;
    if (!isModalVisible) return;

    // Make the background inert for both pointer and assistive tech navigation.
    const page = pageRef.current;
    if (page) {
      page.setAttribute('aria-hidden', 'true');
      page.setAttribute('inert', '');
      (page as unknown as { inert?: boolean }).inert = true;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeTileModal();
        return;
      }

      if (e.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),iframe,object,embed,[contenteditable="true"],[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);

      if (focusable.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const isInside = active ? dialog.contains(active) : false;

      if (e.shiftKey) {
        if (!isInside || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (!isInside || active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      if (page) {
        page.removeAttribute('aria-hidden');
        page.removeAttribute('inert');
        (page as unknown as { inert?: boolean }).inert = false;
      }
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [renderedTile, isModalVisible, closeTileModal]);

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

    let raf = 0;

    const update = () => {
      raf = 0;

      // --header-height живёт на SiteShell (не на :root). На первом скролле
      // переменная может ещё не быть проставлена, из-за чего навигация успевает
      // «заехать» под шапку перед тем как стать фиксированной.
      //
      // Поэтому:
      // 1) читаем --header-height
      // 2) если пусто — берём --header-height-initial
      // 3) если и он не доступен — меряем фактический DOM-элемент шапки.
      const slotStyles = window.getComputedStyle(slot);
      const headerHeightVar = Number.parseFloat(slotStyles.getPropertyValue('--header-height')) || 0;
      const headerHeightInitial = Number.parseFloat(slotStyles.getPropertyValue('--header-height-initial')) || 0;

      const headerEl = document.querySelector<HTMLElement>('[data-site-header]');
      const headerHeightMeasured = headerEl ? headerEl.getBoundingClientRect().height : 0;

      const headerHeight = headerHeightVar || headerHeightInitial || headerHeightMeasured || 0;

      // Порог с небольшим запасом, чтобы не «дребезжало» на полпикселя.
      const pinned = slot.getBoundingClientRect().top <= headerHeight + 0.5;

      setIsNavPinned((prev) => (prev === pinned ? prev : pinned));

      if (!pinned) {
        setActiveSection((prev) => (prev === null ? prev : null));
        return;
      }

      const rootFontSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
      // Делаем "линию якоря" согласованной с scroll-margin-top у секций.
      // Это даёт корректную активную вкладку сразу после клика по навигации
      // (scrollIntoView учитывает scroll-margin) и убирает расхождения.
      const extraOffset = rootFontSize * 1; // 1rem
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
        className="space-y-12 lg:space-y-14 -mt-2 sm:-mt-6 lg:-mt-8"
        style={{ '--products-nav-height': `${navLayout?.height ?? 0}px` } as CSSProperties}
      >
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
                    top: 'var(--header-height, var(--header-height-initial))',
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

                      const hash = `#${group.id}`;
                      // Preserve native anchor semantics: deep links, share/copy, and back/forward navigation.
                      if (window.location.hash !== hash) {
                        window.history.pushState(null, '', hash);
                      } else {
                        window.history.replaceState(null, '', hash);
                      }

                      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
                      document
                        .getElementById(group.id)
                        ?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
                    }}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-xl px-3 py-3 text-sm font-medium text-left',
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
                    <span className="mt-0.5 shrink-0" aria-hidden>
                      {icon}
                    </span>

                    <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{label}</span>
                    <span
                      className={cn(
                        'ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium sm:text-sm',
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

        {/* Блок с преимуществами — ниже каталога, чтобы не мешать поиску раздела */}
        <section className="rounded-3xl border border-[var(--header-border)] bg-muted p-5 sm:p-6">
          <InsightTilesCarousel title={whyTitle} tiles={whyTiles} isRu={isRu} onOpen={openTileModal} />
        </section>
      </div>

      {/* Модалка для плиток */}
      {renderedTile ? (
        <div
          className={cn(
            // Always center the dialog — including the smallest mobile breakpoints.
            'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6',
            // While the dialog is visible, we block interaction with the page.
            // On close we immediately release pointer events so the user can
            // re-open the same tile without waiting for the fade-out to finish.
            isModalVisible ? 'pointer-events-auto' : 'pointer-events-none',
          )}
        >
          <button
            type="button"
            aria-label={isRu ? 'Закрыть' : 'Close'}
            tabIndex={-1}
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
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            aria-describedby={modalBodyId}
            tabIndex={-1}
            className="relative w-full max-w-2xl rounded-3xl border border-[var(--header-border)] bg-background p-5 shadow-none sm:p-6"
            style={
              prefersReducedMotion
                ? {
                    opacity: 1,
                    transform: 'translateY(0px)',
                  }
                : {
                    opacity: isModalVisible ? 1 : 0,
                    transform: isModalVisible
                      ? 'translateY(0px)'
                      : `translateY(${TILE_MODAL_MOTION.dialogTranslateYPx}px)`,
                    transitionProperty: 'opacity, transform',
                    transitionDuration: `${isModalVisible ? TILE_MODAL_MOTION.dialogInMs : TILE_MODAL_MOTION.dialogOutMs}ms`,
                    transitionTimingFunction: TILE_MODAL_MOTION.easing,
                  }
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="m-0 text-sm font-medium text-[var(--muted-foreground)]">
                  {isRu ? 'Подробности' : 'Details'}
                </p>
                <h3 id={modalTitleId} className="mt-1 text-lg font-semibold leading-snug sm:text-xl">
                  {renderedTile.title}
                </h3>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeTileModal}
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-xl',
                  'border border-[var(--header-border)] bg-muted/20 text-foreground',
                  'cursor-pointer',
                  'transition-colors duration-150 ease-out hover:bg-muted/35',
                  focusRingBase,
                )}
                aria-label={isRu ? 'Закрыть окно' : 'Close dialog'}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div
              id={modalBodyId}
              className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base"
            >
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
