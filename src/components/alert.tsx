import type { ReactNode } from "react";

type AlertTone = "info" | "success" | "warning" | "error";

type AlertProps = {
  tone?: AlertTone;
  title?: string;
  dismissible?: boolean;
  children?: ReactNode;
};

const toneStyles: Record<AlertTone, string> = {
  info: "border-blue-400/60 bg-blue-50 text-blue-900 dark:border-blue-400/40 dark:bg-blue-900/20 dark:text-blue-100",
  success: "border-emerald-400/60 bg-emerald-50 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-900/20 dark:text-emerald-100",
  warning: "border-amber-400/70 bg-amber-50 text-amber-900 dark:border-amber-300/50 dark:bg-amber-900/20 dark:text-amber-100",
  error: "border-rose-400/70 bg-rose-50 text-rose-900 dark:border-rose-400/40 dark:bg-rose-900/20 dark:text-rose-100",
};

export function Alert({ tone = "info", title, dismissible, children }: AlertProps) {
  const variant = toneStyles[tone] ? tone : "info";

  return (
    <div
      className={`alert relative mt-6 flex flex-col gap-2 rounded-xl border px-5 py-4 text-sm shadow-sm transition-colors ${toneStyles[variant]}`}
      role="alert"
      aria-live={tone === "error" || tone === "warning" ? "assertive" : "polite"}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 text-pretty">
          {title ? <p className="font-semibold tracking-tight">{title}</p> : null}
          <div className="space-y-3 leading-relaxed">{children}</div>
        </div>
        {dismissible ? (
          <span aria-hidden="true" className="select-none text-lg font-semibold">
            ×
          </span>
        ) : null}
      </div>
    </div>
  );
}