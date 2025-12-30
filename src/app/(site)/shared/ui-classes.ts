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
  "inline-flex items-center rounded-xl border border-[var(--header-border)] bg-transparent",
  "transition-colors duration-200 ease-out",
  "focus-visible:border-[var(--header-border)]",
  focusRingBase,
  "motion-reduce:transition-none motion-reduce:duration-0",
);

export const pillBase = cn(
  "inline-flex h-10 w-full items-center justify-center rounded-xl",
  "px-3 border border-transparent bg-transparent",
  "text-muted-foreground no-underline",
  "transition-colors duration-200 ease-out",
  "hover:border-[var(--header-border)] hover:bg-transparent hover:text-foreground",
  "focus-visible:border-[var(--header-border)]",
  focusRingBase,
  "truncate motion-reduce:transition-none motion-reduce:duration-0",
);
