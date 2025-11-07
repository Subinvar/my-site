'use client';

import { useDictionary } from '@/lib/use-dictionary';

export default function LocaleLoading() {
  const dictionary = useDictionary();
  return (
    <div className="flex items-center justify-center px-4 py-12">
      <p className="text-sm text-zinc-600" aria-live="polite">
        {dictionary.states.loading}
      </p>
    </div>
  );
}