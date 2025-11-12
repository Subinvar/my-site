import { redirect } from 'next/navigation';

export const dynamic = 'force-static';

import { defaultLocale } from '@/lib/i18n';

export default function RootRedirectPage() {
  redirect(`/${defaultLocale}`);
}