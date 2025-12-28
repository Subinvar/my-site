import { getNavigation, getSite } from '@/lib/keystatic';
import type { Navigation, SiteContent } from '@/lib/keystatic';
import type { Locale } from '@/lib/i18n';

export type SiteShellData = {
  site: SiteContent;
  navigation: Navigation;
  currentYear: number;
};

export async function getSiteShellData(locale: Locale): Promise<SiteShellData> {
  const [site, navigation] = await Promise.all([getSite(locale), getNavigation(locale)]);
  return { site, navigation, currentYear: new Date().getFullYear() };
}