import Link from 'next/link';
import { localizePath, type Locale } from '@/lib/i18n';
import type { UiDictionary } from '@/lib/keystatic';

export type BreadcrumbItem = {
  label: string;
  slug?: string;
};

type BreadcrumbsProps = {
  locale: Locale;
  items: BreadcrumbItem[];
  dictionary: UiDictionary['common']['breadcrumbs'];
};

export function Breadcrumbs({ locale, items, dictionary }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  const trail = [
    {
      label: dictionary.rootLabel,
      href: localizePath(locale, ''),
    },
    ...items.slice(0, -1).map((item) => ({
      label: item.label,
      href: item.slug ? localizePath(locale, item.slug) : undefined,
    })),
  ];
  const current = items[items.length - 1];

  return (
    <nav aria-label={dictionary.ariaLabel} className="text-xs text-zinc-500">
      <ol className="flex flex-wrap items-center gap-2">
        {trail.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href ? (
              <Link href={item.href} className="transition hover:text-zinc-900">
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
            <span aria-hidden="true">/</span>
          </li>
        ))}
        <li aria-current="page" className="font-medium text-zinc-700">
          {current.label}
        </li>
      </ol>
    </nav>
  );
}