declare module '@keystatic/core' {
  import type * as ConfigNS from './keystatic-core/src/config';
  import type * as FormApi from './keystatic-core/src/form/api';

  export const config: typeof ConfigNS.config;
  export const collection: typeof ConfigNS.collection;
  export const singleton: typeof ConfigNS.singleton;
  export const fields: typeof FormApi.fields;

  export type Config = ConfigNS.Config;
  export type Collection<Schema extends Record<string, FormApi.ComponentSchema>, SlugField extends string> = ConfigNS.Collection<Schema, SlugField>;
  export type Singleton<Schema extends Record<string, FormApi.ComponentSchema>> = ConfigNS.Singleton<Schema>;
}

declare module '@keystatic/core/reader' {
  import type * as ReaderNS from './keystatic-core/src/reader/index';

  export const createReader: typeof ReaderNS.createReader;
  export type Reader = ReaderNS.Reader;
}
