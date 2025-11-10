import type { Schema } from "@markdoc/markdoc";

const figure = {
  render: "Figure",
  description: "Изображение с подписью и дополнительной атрибутикой.",
  attributes: {
    src: {
      type: String,
      required: true,
      errorLevel: "critical",
    },
    alt: {
      type: String,
      required: true,
      errorLevel: "critical",
    },
    caption: {
      type: String,
    },
    title: {
      type: String,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    credit: {
      type: String,
    },
  },
} satisfies Schema;

export default figure;