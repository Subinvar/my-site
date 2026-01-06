import type { FilterState } from '@/app/(site)/shared/catalog-filtering';

function toSlugInternal(value: string, { preserveIShort }: { preserveIShort: boolean }): string {
  const input = value.trim();
  if (!input) return '';

  // Normalize unicode (e.g. CO₂ subscript digits) and keep URLs stable.
  // NOTE: NFKD decomposes "й" → "и" + combining breve. If we remove combining marks blindly,
  // we lose the distinction between "и" and "й" which breaks URL slugs (e.g. "клей" → "klei").
  let s = input
    .normalize('NFKD')
    // Restore decomposed "й"/"Й" BEFORE stripping combining marks.
    .replace(/И\u0306/g, 'Й')
    .replace(/и\u0306/g, 'й')
    // Remove remaining combining marks produced by NFKD (e.g. accents).
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (match) => {
      const map: Record<string, string> = {
        '₀': '0',
        '₁': '1',
        '₂': '2',
        '₃': '3',
        '₄': '4',
        '₅': '5',
        '₆': '6',
        '₇': '7',
        '₈': '8',
        '₉': '9',
      };
      return map[match] ?? '';
    });

  if (!preserveIShort) {
    // Legacy behaviour (kept for backwards-compatible slug matching):
    // treat "й" the same as "и".
    s = s.replace(/Й/g, 'И').replace(/й/g, 'и');
  }

  // Lowercase early.
  s = s.toLowerCase();

  // Fix common mixed-alphabet mistakes: latin "c" used instead of cyrillic "с".
  // This keeps slugs stable even if the source value contains lookalike characters.
  s = s.replace(/c([а-яё])/gi, 'с$1').replace(/([а-яё])c/gi, '$1с');

  const cyrMap: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  };

  // Transliterate Cyrillic → Latin.
  s = s.replace(/[а-яё]/gi, (char) => cyrMap[char.toLowerCase()] ?? '');

  // Replace any remaining non-url-safe characters with hyphens.
  s = s.replace(/[^a-z0-9]+/g, '-');
  s = s.replace(/-+/g, '-').replace(/^-|-$/g, '');

  return s;
}

export function toSlug(value: string): string {
  return toSlugInternal(value, { preserveIShort: true });
}

function toSlugLegacy(value: string): string {
  return toSlugInternal(value, { preserveIShort: false });
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function matchOptionBySlug<T extends { value: string }>(
  options: ReadonlyArray<Readonly<T>>,
  slug: string
): Readonly<T> | null {
  const decodedSlug = safeDecodeURIComponent(slug);
  const direct = options.find((option) => option.value === decodedSlug || option.value === slug);
  if (direct) return direct;

  const normalizedSlug = toSlug(decodedSlug || slug);
  if (!normalizedSlug) return null;

  const canonicalMatch = options.find((option) => toSlug(option.value) === normalizedSlug);
  if (canonicalMatch) return canonicalMatch;

  // Backwards-compatibility: accept legacy slugs that were generated when "й" was
  // incorrectly collapsed into "и" during NFKD + combining-mark stripping.
  return options.find((option) => toSlugLegacy(option.value) === normalizedSlug) ?? null;
}

export function sortByOrderAndLabel<T extends { order?: number | null; label: string }>(
  a: T,
  b: T
): number {
  const orderA = typeof a.order === 'number' ? a.order : Number.POSITIVE_INFINITY;
  const orderB = typeof b.order === 'number' ? b.order : Number.POSITIVE_INFINITY;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return a.label.localeCompare(b.label);
}

export function toFilter<T extends string>(values: readonly T[]): FilterState['category'] {
  return { values: [...values], lookup: new Set(values) } as FilterState['category'];
}