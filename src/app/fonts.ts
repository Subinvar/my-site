// src/app/fonts.ts
import localFont from 'next/font/local';

export const geistSans = localFont({
  src: [{ path: '../../public/fonts/geist/GeistVF.woff2', style: 'normal', weight: '100 900' }],
  variable: '--font-geist-sans',
  display: 'swap',
});

export const geistMono = localFont({
  src: [{ path: '../../public/fonts/geist/GeistMonoVF.woff2', style: 'normal', weight: '100 900' }],
  variable: '--font-geist-mono',
  display: 'swap',
});