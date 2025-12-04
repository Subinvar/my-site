import type { Schema } from "@markdoc/markdoc";

const callout = {
  render: "callout",
  description: "Визуальный блок для вынесенных примечаний или подсказок.",
  attributes: {
    type: {
      type: String,
      matches: ["note", "info", "warning", "success"],
      default: "info",
    },
    title: {
      type: String,
    },
  },
} satisfies Schema;

export default callout;