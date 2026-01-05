import { cn } from "@/lib/cn";
import { focusRingBase } from "@/lib/focus-ring";

/**
 * Единые классы для «кнопок/пилюль» в шапке, подвале и мобильном меню.
 * Основание — контакты в десктопной шапке.
 *
 * Важно: типографика (размер/интерлиньяж) задаётся родителем через
 * --header-ui-fs / --header-ui-leading.
 */

export const headerButtonBase = cn(
  // ✅ Важно: border остаётся прозрачным (чтобы не менять геометрию),
  // а видимую обводку рисуем на 1px ВНУТРИ через after:inset-px.
  "relative inline-flex items-center rounded-lg border border-transparent bg-transparent",
  "after:pointer-events-none after:absolute after:inset-px after:rounded-[11px] after:border after:border-[var(--header-border)] after:content-['']",
  "transition-colors duration-200 ease-out",
  "after:transition-colors after:duration-200 after:ease-out",
  focusRingBase,
  "motion-reduce:transition-none motion-reduce:duration-0",
);

export const pillBase = cn(
  "relative inline-flex h-10 w-full items-center justify-center rounded-lg px-3 border border-transparent bg-transparent",
  "after:pointer-events-none after:absolute after:inset-px after:rounded-[11px] after:border after:border-transparent after:content-['']",
  "after:transition-colors after:duration-200 after:ease-out",
  "text-muted-foreground no-underline transition-colors duration-200 ease-out",
  "hover:after:border-[var(--header-border)] hover:bg-transparent hover:text-foreground",
  "focus-visible:after:border-[var(--header-border)]",
  focusRingBase,
  "truncate motion-reduce:transition-none motion-reduce:duration-0",
);
