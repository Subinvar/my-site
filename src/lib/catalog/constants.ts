export const CATALOG_CATEGORIES = ['Связующие', 'Покрытия', 'Вспомогательные'] as const;

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

export const CATALOG_PROCESSES = [
  'альфа-сет',
  'фуран',
  'Колд-Бокс',
  'Резол-CO₂',
  'ЖСС',
  'Пеп-сет',
  'кронинг',
  'ПГС',
  'ЛГМ',
  'кокиль',
] as const;

export type CatalogProcess = (typeof CATALOG_PROCESSES)[number];

export const CATALOG_BASES = ['водное', 'спиртовое'] as const;

export type CatalogBase = (typeof CATALOG_BASES)[number];

export const CATALOG_FILLERS = ['циркон', 'алюмосиликат', 'графит', 'магнезит', 'хромит'] as const;

export type CatalogFiller = (typeof CATALOG_FILLERS)[number];