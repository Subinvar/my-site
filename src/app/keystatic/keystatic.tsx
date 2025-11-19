// src/app/keystatic/keystatic.tsx
'use client';

import { makePage } from '@keystatic/next/ui/app';

import config from '../../../keystatic.config';

const KeystaticPage = makePage(config);

export default function KeystaticApp() {
  return <KeystaticPage />;
}