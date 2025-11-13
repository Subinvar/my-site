// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import eslintComments from "eslint-plugin-eslint-comments";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tailwind from "eslint-plugin-tailwindcss";
import tseslint from "@typescript-eslint/eslint-plugin";
import unusedImports from "eslint-plugin-unused-imports";

export default defineConfig([
  // Базовые пресеты Next (Core Web Vitals + TS)
  ...nextVitals,
  ...nextTs,

  // Явно фиксируем игноры (перекрываем дефолты next-конфига)
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // Общие жёсткие правила
  {
    linterOptions: {
      // репортим бесполезные // eslint-disable
      reportUnusedDisableDirectives: true,
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "eslint-comments": eslintComments,
      import: importPlugin,
      "jsx-a11y": jsxA11y,
      tailwindcss: tailwind,
      "unused-imports": unusedImports,
    },
    rules: {
      // Ловим ваш кейс с `await params`
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",

      // Запрет на «волшебные тряпки» без описания и безлимитные выключатели
      "eslint-comments/no-unlimited-disable": "error",
      "eslint-comments/no-unused-disable": "error",
      "eslint-comments/require-description": ["error", { ignore: [] }],

      // Чистим мусор
      "unused-imports/no-unused-imports": "error",

      // Импорты и доступность
      "import/no-unresolved": "error",
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/heading-has-content": "error",

      // Tailwind: не ругаемся на свои кастомные классы (Tailwind v4)
      "tailwindcss/no-custom-classname": "off",
    },
  },

  // Для .ts/.tsx — доп. строгость по TS-комментариям и резолвер для import-плагина
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/ban-ts-comment": ["error", {
        "ts-ignore": true,
        "ts-nocheck": true,
        "ts-expect-error": "allow-with-description" // только с внятным описанием
      }],
    },
    settings: {
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
  },
]);