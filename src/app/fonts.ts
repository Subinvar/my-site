import { Montserrat, Open_Sans } from 'next/font/google';

export const headingFont = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

export const bodyFont = Open_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});