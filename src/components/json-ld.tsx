import type { ReactElement } from 'react';

type JsonLdProps = {
  id?: string;
  data: Record<string, unknown> | Record<string, unknown>[];
};

function serialize(value: JsonLdProps['data']): string {
  return JSON.stringify(value, (_key, nested) => {
    if (nested === undefined) {
      return undefined;
    }
    return nested;
  });
}

export function JsonLd({ id, data }: JsonLdProps): ReactElement {
  const json = serialize(data);
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
      suppressHydrationWarning
    />
  );
}