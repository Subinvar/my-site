// src/app/keystatic/layout.tsx
import type { ReactElement, ReactNode } from 'react';

const currentYear = new Date().getFullYear();

export default function Layout({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              Intema Group Admin
            </p>
            <p className="text-xs text-slate-400">Управление контентом сайта</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            На сайт
          </a>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="rounded-2xl border border-slate-800 bg-white/5 p-4 shadow-lg shadow-slate-950/20 backdrop-blur">
            {children}
          </div>
        </div>
      </main>
      <footer className="border-t border-slate-800 bg-slate-900">
        <div className="mx-auto w-full max-w-6xl px-6 py-4 text-xs text-slate-400">
          © {currentYear} Intema Group. Доступ только для сотрудников.
        </div>
      </footer>
    </div>
  );
}