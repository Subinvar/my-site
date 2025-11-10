import type { Config } from "@markdoc/markdoc";
import { nodes as defaultNodes, tags as defaultTags } from "@markdoc/markdoc";
import alert from "./tags/alert";
import callout from "./tags/callout";
import figure from "./tags/figure";

const config: Config = {
  nodes: {
    ...defaultNodes,
  },
  tags: {
    ...defaultTags,
    alert,
    callout,
    figure,
  },
};

export default config;