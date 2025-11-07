'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { UiDictionary } from './keystatic';

const DictionaryContext = createContext<UiDictionary | null>(null);

type DictionaryProviderProps = {
  value: UiDictionary;
  children: ReactNode;
};

export function DictionaryProvider({ value, children }: DictionaryProviderProps) {
  return <DictionaryContext.Provider value={value}>{children}</DictionaryContext.Provider>;
}

export function useDictionary() {
  const dictionary = useContext(DictionaryContext);
  if (!dictionary) {
    throw new Error('DictionaryProvider is not available');
  }
  return dictionary;
}