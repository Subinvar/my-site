import type { Config, NodeType } from "../../../markdoc.d.ts";
import type { MarkdocEditorOptions } from "./config.d.ts";
import type { ContentComponent } from "../../../content-components.d.ts";
export declare function createMarkdocConfig<Components extends Record<string, ContentComponent>>(opts: {
    options?: MarkdocEditorOptions;
    components?: Components;
    render?: {
        tags?: {
            [_ in keyof Components]?: string;
        };
        nodes?: {
            [_ in NodeType]?: string;
        };
    };
}): Config;
