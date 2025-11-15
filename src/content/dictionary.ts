import dictionarySource from '../../content/dictionary/index.json';
import { defaultLocale, type Locale } from '@/lib/i18n';

type LocalizedRecord = Partial<Record<Locale, string | null | undefined>>;

type SwitchToRecord = Partial<Record<Locale, LocalizedRecord | null | undefined>>;

type DictionarySource = {
  common?: {
    skipToContent?: LocalizedRecord;
    emptyValue?: LocalizedRecord;
    buttons?: {
      goHome?: LocalizedRecord;
      retry?: LocalizedRecord;
    };
  };
  languageSwitcher?: {
    switchTo?: SwitchToRecord;
  };
  errors?: {
    notFound?: {
      title?: LocalizedRecord;
      description?: LocalizedRecord;
    };
    generic?: {
      title?: LocalizedRecord;
      description?: LocalizedRecord;
    };
  };
  catalog?: {
    attributes?: {
      category?: LocalizedRecord;
      process?: LocalizedRecord;
      base?: LocalizedRecord;
      filler?: LocalizedRecord;
      auxiliary?: LocalizedRecord;
    };
    summaryLabel?: LocalizedRecord;
  };
};

type InterfaceDictionary = {
  common: {
    skipToContent: string;
    emptyValue: string;
    buttons: {
      goHome: string;
      retry: string;
    };
  };
  languageSwitcher: {
    switchTo: Record<Locale, string>;
  };
  errors: {
    notFound: {
      title: string;
      description: string;
    };
    generic: {
      title: string;
      description: string;
    };
  };
  catalog: {
    attributes: {
      category: string;
      process: string;
      base: string;
      filler: string;
      auxiliary: string;
    };
    summaryLabel: string;
  };
};

const dictionaryData = dictionarySource as DictionarySource;

function pickLocalized(
  record: LocalizedRecord | null | undefined,
  locale: Locale,
  fallback: string
): string {
  const localized = record?.[locale];
  if (localized && typeof localized === 'string' && localized.trim()) {
    return localized;
  }
  const defaultValue = record?.[defaultLocale];
  if (defaultValue && typeof defaultValue === 'string' && defaultValue.trim()) {
    return defaultValue;
  }
  return fallback;
}

function resolveSwitchTo(
  record: SwitchToRecord | null | undefined,
  locale: Locale
): Record<Locale, string> {
  const result: Partial<Record<Locale, string>> = {};
  for (const target of ['ru', 'en'] as const) {
    const value = record?.[target];
    const label = pickLocalized(value ?? null, locale, target.toUpperCase());
    result[target] = label;
  }
  return result as Record<Locale, string>;
}

export function getInterfaceDictionary(locale: Locale): InterfaceDictionary {
  const common = dictionaryData.common ?? {};
  const buttons = common.buttons ?? {};
  const errors = dictionaryData.errors ?? {};
  const catalog = dictionaryData.catalog ?? {};
  const attributes = catalog.attributes ?? {};
  const languageSwitcher = dictionaryData.languageSwitcher ?? {};

  return {
    common: {
      skipToContent: pickLocalized(common.skipToContent, locale, 'Skip to content'),
      emptyValue: pickLocalized(common.emptyValue, locale, '—'),
      buttons: {
        goHome: pickLocalized(buttons.goHome, locale, 'Back to home'),
        retry: pickLocalized(buttons.retry, locale, 'Try again'),
      },
    },
    languageSwitcher: {
      switchTo: resolveSwitchTo(languageSwitcher.switchTo, locale),
    },
    errors: {
      notFound: {
        title: pickLocalized(errors.notFound?.title, locale, 'Page not found'),
        description: pickLocalized(
          errors.notFound?.description,
          locale,
          'We could not find this page.'
        ),
      },
      generic: {
        title: pickLocalized(errors.generic?.title, locale, 'Something went wrong'),
        description: pickLocalized(
          errors.generic?.description,
          locale,
          'We could not load this page.'
        ),
      },
    },
    catalog: {
      attributes: {
        category: pickLocalized(attributes.category, locale, 'Category'),
        process: pickLocalized(attributes.process, locale, 'Processes'),
        base: pickLocalized(attributes.base, locale, 'Bases'),
        filler: pickLocalized(attributes.filler, locale, 'Fillers'),
        auxiliary: pickLocalized(attributes.auxiliary, locale, 'Auxiliary supplies'),
      },
      summaryLabel: pickLocalized(catalog.summaryLabel, locale, 'Product summary'),
    },
  } satisfies InterfaceDictionary;
}
