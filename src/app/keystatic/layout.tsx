// src/app/keystatic/layout.tsx
import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';

export default function Layout({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      {/* Плавающая кнопка "На сайт" — не влияет на высоту Keystatic */}
      <Link
        href="/"
        className="fixed bottom-4 right-4 z-50 inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-lg shadow-slate-900/40 transition hover:border-slate-500 hover:bg-slate-800"
      >
        На сайт
      </Link>

      {children}
    </div>
  );
}