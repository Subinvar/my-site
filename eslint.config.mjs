// eslint.config.mjs
import eslintCss from "@eslint/css";
import tailwind from "@poupe/eslint-plugin-tailwindcss";
import { fileURLToPath } from "node:url";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintComments from "eslint-plugin-eslint-comments";
import unusedImports from "eslint-plugin-unused-imports";
import eslintCss from "@eslint/css";
import tailwind from "@poupe/eslint-plugin-tailwindcss";

const tsconfigRootDir = fileURLToPath(new URL(".", import.meta.url));

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
    "eslint.config.mjs",
  ]),

  // Общие жёсткие правила
  {
    linterOptions: {
      // репортим бесполезные // eslint-disable
      reportUnusedDisableDirectives: true,
    },
    plugins: {
      "eslint-comments": eslintComments,
      "unused-imports": unusedImports,
      "@eslint/css": eslintCss,
      tailwindcss: tailwind,
    },
    rules: {
      // Запрет на «волшебные тряпки» без описания и безлимитные выключатели
      "eslint-comments/no-unlimited-disable": "error",
      "eslint-comments/no-unused-disable": "error",
      "eslint-comments/require-description": ["error", { ignore: [] }],

      // Подсказки по стилям и Tailwind-классам
      "@eslint/css/selector-complexity": "warn",
      "tailwindcss/no-conflicting-utilities": "warn",

      // Чистим мусор
      "unused-imports/no-unused-imports": "error",

      // Импорты и доступность
      "import/no-unresolved": "error",
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/heading-has-content": "error",

    },
  },

  // Для .ts/.tsx — доп. строгость по TS-комментариям и резолвер для import-плагина
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Ловим ваш кейс с `await params`
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
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