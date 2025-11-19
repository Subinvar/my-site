import type { Node as MarkdocNode } from "../../../markdoc.d.ts";
import type { AssetsFormField, ContentFormField } from "../../api.d.ts";
import type { EditorState } from 'prosemirror-state';
import type { ContentComponent } from "../../../content-components.d.ts";
import type { MDXEditorOptions, MarkdocEditorOptions } from "./config.d.ts";
export declare function markdoc({ label, description, options, components, extension, }: {
    label: string;
    description?: string;
    options?: MarkdocEditorOptions;
    extension?: 'mdoc' | 'md';
    components?: Record<string, ContentComponent>;
}): markdoc.Field;
export declare namespace markdoc {
    var createMarkdocConfig: typeof import("./markdoc-config.d.ts").createMarkdocConfig;
    var inline: ({ label, description, options, components, }: {
        label: string;
        description?: string;
        options?: MarkdocEditorOptions;
        components?: Record<string, ContentComponent>;
    }) => markdoc.inline.Field;
}
export declare namespace markdoc {
    type Field = ContentFormField<EditorState, EditorState, {
        node: MarkdocNode;
    }>;
}
export declare namespace markdoc.inline {
    type Field = AssetsFormField<EditorState, EditorState, {
        node: MarkdocNode;
    }>;
}
export declare function mdx({ label, description, options, components, extension, }: {
    label: string;
    description?: string;
    options?: MDXEditorOptions;
    extension?: 'mdx' | 'md';
    components?: Record<string, ContentComponent>;
}): mdx.Field;
export declare namespace mdx {
    var inline: ({ label, description, options, components, }: {
        label: string;
        description?: string;
        options?: MDXEditorOptions;
        components?: Record<string, ContentComponent>;
    }) => mdx.inline.Field;
}
export declare namespace mdx {
    type Field = ContentFormField<EditorState, EditorState, string>;
}
export declare namespace mdx.inline {
    type Field = AssetsFormField<EditorState, EditorState, string>;
}
