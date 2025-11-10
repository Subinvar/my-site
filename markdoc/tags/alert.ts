import type { Schema } from "@markdoc/markdoc";

const alert = {
  render: "Alert",
  description: "Семантическое предупреждение для важных сообщений.",
  attributes: {
    tone: {
      type: String,
      matches: ["info", "success", "warning", "error"],
      default: "info",
    },
    title: {
      type: String,
    },
    dismissible: {
      type: Boolean,
      default: false,
    },
  },
} satisfies Schema;

export default alert;