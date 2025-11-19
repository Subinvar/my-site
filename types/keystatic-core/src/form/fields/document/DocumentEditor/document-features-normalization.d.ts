import type { Text, Element, NodeEntry, Editor } from 'slate';
import type { DocumentFeatures } from "./document-features.d.ts";
export declare function areArraysEqual(a: readonly unknown[], b: readonly unknown[]): boolean;
export declare function normalizeTextBasedOnInlineMarksAndSoftBreaks([node, path]: NodeEntry<Text>, editor: Editor, inlineMarks: DocumentFeatures['formatting']['inlineMarks'], softBreaks: boolean): boolean;
export type DocumentFeaturesForNormalization = Omit<DocumentFeatures, 'formatting'> & {
    formatting: Omit<DocumentFeatures['formatting'], 'inlineMarks' | 'softBreaks'>;
};
export declare function normalizeInlineBasedOnLinks([node, path]: NodeEntry<Element>, editor: Editor, links: boolean): boolean;
export declare function normalizeElementBasedOnDocumentFeatures([node, path]: NodeEntry<Element>, editor: Editor, { formatting, dividers, layouts, links, images, tables, }: DocumentFeaturesForNormalization): boolean;
export declare function withDocumentFeaturesNormalization(documentFeatures: DocumentFeatures, editor: Editor): Editor;
