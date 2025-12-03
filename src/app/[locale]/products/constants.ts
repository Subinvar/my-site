import type {
  CatalogAuxiliary,
  CatalogBase,
  CatalogCategory,
  CatalogProcess,
} from '@/lib/catalog/constants';

export const PRODUCT_CATEGORIES: Record<
  'auxiliaries' | 'coatings' | 'binders',
  CatalogCategory
> = {
  auxiliaries: 'Вспомогательные материалы',
  coatings: 'Противопригарные покрытия',
  binders: 'Связующие',
};

export const ALLOWED_AUXILIARIES: CatalogAuxiliary[] = [
  'Клей',
  'Модификатор',
  'Отмывающий состав',
  'Разделительный состав',
  'Ремонтная паста',
  'Уплотнительный шнур',
  'Экзотермическая смесь',
];

export const ALLOWED_COATING_BASES: CatalogBase[] = ['Водное', 'Спиртовое'];

export const ALLOWED_BINDER_PROCESSES: CatalogProcess[] = [
  'Альфа-cет',
  'ЖСС',
  'Колд-Бокс',
  'Кронинг',
  'Резол-CO₂',
  'Фуран',
];
