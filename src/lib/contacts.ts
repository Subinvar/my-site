export function formatTelegramHandle(url?: string | null): string | null {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
  const withoutDomain = withoutProtocol
    .replace(/^t\.me\//i, '')
    .replace(/^telegram\.me\//i, '')
    .replace(/^\/+/, '');

  const normalized = withoutDomain.split(/[?#]/)[0]?.replace(/^@+/, '') ?? '';
  if (!normalized) {
    return null;
  }

  return `@${normalized}`;
}
