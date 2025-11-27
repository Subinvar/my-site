'use client';

// src/app/keystatic/keystatic.tsx
import { Keystatic } from '@keystatic/core/ui';
import { Suspense } from 'react';

import config from '../../../keystatic.config';
import KeystaticClientWrapper from './KeystaticClientWrapper';

export default function KeystaticApp() {
  return (
    <KeystaticClientWrapper>
      <Suspense
        fallback={
          <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
            <p className="text-base font-medium">Загружаем Keystatic…</p>
            <p className="mt-2 max-w-lg text-center text-sm text-slate-300">
              Если экран остаётся пустым, проверьте, что браузер не блокирует авторизацию по Basic Auth
              и обновите страницу.
            </p>
          </div>
        }
      >
        <Keystatic config={config} />
      </Suspense>
    </KeystaticClientWrapper>
  );
}
