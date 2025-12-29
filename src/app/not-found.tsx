import Link from 'next/link';

import { getInterfaceDictionary } from '@/content/dictionary';
import { cn } from '@/lib/cn';
import { focusRingBase } from '@/lib/focus-ring';
import { defaultLocale } from '@/lib/i18n';
import { buildPath } from '@/lib/paths';

const dictionary = getInterfaceDictionary(defaultLocale);

export default function RootNotFound() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold text-foreground">{dictionary.errors.notFound.title}</h1>
      <p className="text-lg text-muted-foreground">{dictionary.errors.notFound.description}</p>
      <Link
        href={buildPath(defaultLocale)}
        className={cn(
          'rounded-full border border-foreground px-5 py-2 text-sm font-semibold uppercase tracking-wide text-foreground transition',
          'hover:bg-foreground hover:text-background',
          focusRingBase,
        )}
      >
        {dictionary.common.buttons.goHome}
      </Link>
    </section>
  );
}