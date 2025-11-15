import Link from 'next/link';
import { buildPath } from '@/lib/paths';
import { defaultLocale } from '@/lib/i18n';
import { getInterfaceDictionary } from '@/content/dictionary';

const dictionary = getInterfaceDictionary(defaultLocale);

export default function RootNotFound() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold text-zinc-900">{dictionary.errors.notFound.title}</h1>
      <p className="text-lg text-zinc-600">{dictionary.errors.notFound.description}</p>
      <Link
        href={buildPath(defaultLocale)}
        className="rounded-full border border-zinc-900 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-zinc-900 transition hover:bg-zinc-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {dictionary.common.buttons.goHome}
      </Link>
    </section>
  );
}