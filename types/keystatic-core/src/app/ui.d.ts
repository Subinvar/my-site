import type { Config } from "../config.d.ts";
export declare function Keystatic(props: {
    config: Config;
    appSlug?: {
        envName: string;
        value: string | undefined;
    };
}): import("react").JSX.Element;
