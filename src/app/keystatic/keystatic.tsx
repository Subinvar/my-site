// src/app/keystatic/keystatic.tsx
'use client';

import { Component, type ReactNode } from 'react';
import { makePage } from '@keystatic/next/ui/app';

import config from '../../../keystatic.config';

const KeystaticPage = makePage(config);

class KeystaticErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('Keystatic failed to render', error);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-slate-50">
        <h1 className="mb-2 text-2xl font-semibold">Не удалось открыть Keystatic</h1>
        <p className="max-w-xl text-sm text-slate-200">
          {this.state.error instanceof RangeError && /Invalid time value/i.test(this.state.error.message)
            ? 'Один из датавых полей содержит некорректное значение. Проверьте даты публикации/обновления в контентных JSON-файлах и убедитесь, что они записаны в ISO-формате.'
            : 'Во время загрузки административной панели произошла ошибка. Подробности — в консоли.'}
        </p>
      </div>
    );
  }
}

export default function KeystaticApp() {
  return (
    <KeystaticErrorBoundary>
      <KeystaticPage />
    </KeystaticErrorBoundary>
  );
}