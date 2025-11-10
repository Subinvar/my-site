export function resolveSiteOrigin(domain?: string | null): URL {
  if (domain) {
    try {
      return new URL(domain.startsWith('http') ? domain : `https://${domain}`);
    } catch {
      // fall through
    }
  }
  const fallback = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return new URL(fallback);
}