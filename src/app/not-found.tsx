import Link from 'next/link';
import { getDictionary } from '@/lib/keystatic';
import { defaultLocale, localizePath } from '@/lib/i18n';

export default async function NotFound() {
  const dictionary = await getDictionary(defaultLocale);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-16 text-center">
      <div className="space-y-3" role="status" aria-live="polite">
        <h1 className="text-3xl font-bold text-zinc-900">{dictionary.messages.errors.notFoundTitle}</h1>
        <p className="text-base text-zinc-600">{dictionary.messages.errors.notFoundDescription}</p>
      </div>
      <Link
        href={localizePath(defaultLocale, '')}
        aria-label={dictionary.header.homeAriaLabel}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
      >
        {dictionary.common.buttons.goHome}
      </Link>
    </div>
  );
}