const PROTOCOL_PATTERN = /^[a-z][a-z\d+.-]*:\/\//i;

function stripTrailingSlashes(pathname: string): string {
  return pathname.replace(/\/+$/, "");
}

/**
 * Normalizes optional base URL strings coming from CMS settings.
 * - Adds an https:// prefix when the value doesn't include a protocol.
 * - Trims whitespace and ignores empty strings.
 * - Preserves any explicit pathname while removing trailing slashes.
 * - Drops query strings and hashes.
 */
export function normalizeBaseUrl(baseUrl: string | null | undefined): string | null {
  if (!baseUrl) {
    return null;
  }
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = PROTOCOL_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    url.hash = "";
    url.search = "";
    const strippedPath = stripTrailingSlashes(url.pathname);
    const pathname = strippedPath === "" || strippedPath === "/" ? "" : strippedPath;
    const normalizedPath = pathname.startsWith("/") ? pathname : pathname ? `/${pathname}` : "";
    return `${url.origin}${normalizedPath}`;
  } catch {
    return null;
  }
}

export function resolvePublicBaseUrl(
  baseUrl: string | null | undefined,
  { fallbackHost }: { fallbackHost?: string | null } = {},
): string {
  const candidates = [baseUrl, fallbackHost ?? null, process.env.NEXT_PUBLIC_SITE_URL ?? null];

  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  throw new Error("Public base URL is required to build absolute URLs.");
}

/**
 * Normalizes a pathname for active-link checks.
 * - Removes query/hash
 * - Removes trailing slashes
 * - Guarantees a non-empty pathname ("/")
 */
export function normalizePathname(value: string): string {
  const [pathWithoutQuery] = value.split("?");
  const [path] = (pathWithoutQuery ?? "").split("#");
  const trimmed = (path ?? "/").replace(/\/+$/, "");
  return trimmed.length ? trimmed : "/";
}

/**
 * Safe href normalizer:
 * - Trims whitespace
 * - Guarantees a non-empty href ("/")
 */
export function resolveHref(href: string | null | undefined): string {
  const normalized = (href ?? "").trim();
  return normalized.length ? normalized : "/";
}

export function isExternalHref(href: string | null | undefined): boolean {
  const normalized = resolveHref(href);
  return (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("//") ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("tel:")
  );
}
