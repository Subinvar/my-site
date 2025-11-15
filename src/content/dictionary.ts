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
  navigation?: {
    headerLabel?: LocalizedRecord;
    footerLabel?: LocalizedRecord;
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
  navigation: {
    headerLabel: string;
    footerLabel: string;
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
  keyPath: string
): string {
  const localized = record?.[locale];
  if (localized && typeof localized === 'string' && localized.trim()) {
    return localized;
  }
  const defaultValue = record?.[defaultLocale];
  if (defaultValue && typeof defaultValue === 'string' && defaultValue.trim()) {
    return defaultValue;
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[dictionary] Missing localized value for "${keyPath}" (requested locale: ${locale}).`
    );
  }
  return '';
}

function resolveSwitchTo(
  record: SwitchToRecord | null | undefined,
  locale: Locale,
  keyPath: string
): Record<Locale, string> {
  const result: Partial<Record<Locale, string>> = {};
  for (const target of ['ru', 'en'] as const) {
    const value = record?.[target];
    const label = pickLocalized(value ?? null, locale, `${keyPath}.${target}`);
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
  const navigation = dictionaryData.navigation ?? {};

  return {
    common: {
      skipToContent: pickLocalized(common.skipToContent, locale, 'common.skipToContent'),
      emptyValue: pickLocalized(common.emptyValue, locale, 'common.emptyValue'),
      buttons: {
        goHome: pickLocalized(buttons.goHome, locale, 'common.buttons.goHome'),
        retry: pickLocalized(buttons.retry, locale, 'common.buttons.retry'),
      },
    },
    navigation: {
      headerLabel: pickLocalized(navigation.headerLabel, locale, 'navigation.headerLabel'),
      footerLabel: pickLocalized(navigation.footerLabel, locale, 'navigation.footerLabel'),
    },
    languageSwitcher: {
      switchTo: resolveSwitchTo(languageSwitcher.switchTo, locale, 'languageSwitcher.switchTo'),
    },
    errors: {
      notFound: {
        title: pickLocalized(errors.notFound?.title, locale, 'errors.notFound.title'),
        description: pickLocalized(
          errors.notFound?.description,
          locale,
          'errors.notFound.description'
        ),
      },
      generic: {
        title: pickLocalized(errors.generic?.title, locale, 'errors.generic.title'),
        description: pickLocalized(
          errors.generic?.description,
          locale,
          'errors.generic.description'
        ),
      },
    },
    catalog: {
      attributes: {
        category: pickLocalized(attributes.category, locale, 'catalog.attributes.category'),
        process: pickLocalized(attributes.process, locale, 'catalog.attributes.process'),
        base: pickLocalized(attributes.base, locale, 'catalog.attributes.base'),
        filler: pickLocalized(attributes.filler, locale, 'catalog.attributes.filler'),
        auxiliary: pickLocalized(attributes.auxiliary, locale, 'catalog.attributes.auxiliary'),
      },
      summaryLabel: pickLocalized(catalog.summaryLabel, locale, 'catalog.summaryLabel'),
    },
  } satisfies InterfaceDictionary;
}
