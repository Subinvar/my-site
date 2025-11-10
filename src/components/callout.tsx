import type { ReactNode } from "react";

export type CalloutLabels = {
  title?: string | null;
  note?: string | null;
  info?: string | null;
  warning?: string | null;
  success?: string | null;
};

type CalloutProps = {
  type?: "note" | "info" | "warning" | "success";
  title?: string;
  children?: ReactNode;
  labels?: CalloutLabels;
};

const palette = {
  note: "border-sky-300/60 bg-sky-50 text-sky-900 dark:border-sky-400/50 dark:bg-sky-900/20 dark:text-sky-100",
  info: "border-blue-300/60 bg-blue-50 text-blue-900 dark:border-blue-400/50 dark:bg-blue-900/20 dark:text-blue-100",
  warning: "border-amber-400/70 bg-amber-50 text-amber-900 dark:border-amber-300/60 dark:bg-amber-900/20 dark:text-amber-100",
  success: "border-emerald-300/60 bg-emerald-50 text-emerald-900 dark:border-emerald-400/50 dark:bg-emerald-900/20 dark:text-emerald-100",
} as const;

export function Callout({ type = "info", title, children, labels }: CalloutProps) {
  const variant = type in palette ? type : "info";
  const variantLabel = labels?.[variant] ?? labels?.info ?? labels?.note ?? undefined;
  const heading = title ?? (labels?.title && variantLabel ? `${labels.title}: ${variantLabel}` : variantLabel);

  return (
    <aside
      className={`callout mt-6 rounded-xl border px-5 py-4 text-sm shadow-sm transition-colors ${palette[variant]}`}
      role="note"
      aria-label={heading ?? undefined}
    >
      {heading ? <p className="font-semibold tracking-tight">{heading}</p> : null}
      <div className="mt-2 space-y-3 text-pretty leading-relaxed">{children}</div>
    </aside>
  );
}