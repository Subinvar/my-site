import type { Config } from "../config.d.ts";
export declare function readToDirEntries(baseDir: string): Promise<import("../app/trees.d.ts").TreeEntry[]>;
export declare function getAllowedDirectories(config: Config): string[];
