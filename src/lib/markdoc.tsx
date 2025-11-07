import Markdoc from '@markdoc/markdoc';
import type { Node as MarkdocNode } from '@markdoc/markdoc';
import type { ReactNode } from 'react';
import React from 'react';
import type { UiDictionary } from './keystatic';

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

type RenderOptions = {
  dictionary?: UiDictionary;
};

const defaultCalloutDictionary: UiDictionary['markdoc'] = {
  calloutTitle: 'Callout',
  noteLabel: 'Note',
  warningLabel: 'Warning',
  infoLabel: 'Info',
};

function createCalloutComponent(dictionary: UiDictionary['markdoc']) {
  return function Callout({ type, children }: { type?: string; children?: ReactNode }) {
    const palette = {
      note: 'border-sky-500 bg-sky-50 text-sky-900',
      warning: 'border-amber-500 bg-amber-50 text-amber-900',
      info: 'border-zinc-500 bg-zinc-50 text-zinc-900',
    } as const;

    const labels = {
      note: dictionary.noteLabel || defaultCalloutDictionary.noteLabel,
      warning: dictionary.warningLabel || defaultCalloutDictionary.warningLabel,
      info: dictionary.infoLabel || defaultCalloutDictionary.infoLabel,
    } as const;

    const variant = (type && type in palette ? type : 'note') as keyof typeof palette;
    const variantLabel = labels[variant];
    const heading = dictionary.calloutTitle
      ? `${dictionary.calloutTitle}: ${variantLabel}`
      : variantLabel;

    return (
      <aside
        className={`mt-6 rounded-md border-l-4 px-4 py-3 text-sm ${palette[variant]}`}
        aria-label={heading}
        role="note"
      >
        <p className="mb-2 font-semibold">{heading}</p>
        <div className="space-y-2">{children}</div>
      </aside>
    );
  };
}

export function renderMarkdoc(content: MarkdocContent, options: RenderOptions = {}): RenderedMarkdoc {
  if (!content || typeof content !== 'object' || content === null) {
    return null;
  }

  const node = (content as { node?: unknown }).node;
  if (!node) {
    return null;
  }

  const transformed = Markdoc.transform(node as MarkdocNode, markdocConfig);
  const markdocDictionary = options.dictionary?.markdoc ?? defaultCalloutDictionary;
  const components = {
    Callout: createCalloutComponent(markdocDictionary),
  };
  return Markdoc.renderers.react(transformed, React, { components });
}