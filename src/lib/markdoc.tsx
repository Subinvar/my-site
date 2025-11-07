import Markdoc from '@markdoc/markdoc';
import type { Node as MarkdocNode } from '@markdoc/markdoc';
import type { ReactNode } from 'react';
import React from 'react';

const calloutConfig = {
  render: 'Callout',
  attributes: {
    type: {
      type: String,
      default: 'note',
    },
  },
};

const markdocConfig = {
  tags: {
    callout: calloutConfig,
  },
};

type MarkdocContent = { node: unknown } | null | undefined;

type RenderedMarkdoc = ReactNode | null;

function Callout({ type, children }: { type?: string; children?: ReactNode }) {
  const palette = {
    note: 'border-sky-500 bg-sky-50 text-sky-900',
    warning: 'border-amber-500 bg-amber-50 text-amber-900',
    info: 'border-zinc-500 bg-zinc-50 text-zinc-900',
  } as const;

  const variant = (type && type in palette ? type : 'note') as keyof typeof palette;

  return (
    <aside className={`mt-6 rounded-md border-l-4 px-4 py-3 text-sm ${palette[variant]}`}>
      {children}
    </aside>
  );
}

const components = { Callout };

export function renderMarkdoc(content: MarkdocContent): RenderedMarkdoc {
  if (!content || typeof content !== 'object' || content === null) {
    return null;
  }

  const node = (content as { node?: unknown }).node;
  if (!node) {
    return null;
  }

  const transformed = Markdoc.transform(node as MarkdocNode, markdocConfig);
  return Markdoc.renderers.react(transformed, React, { components });
}