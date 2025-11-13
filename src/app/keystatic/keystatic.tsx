// src/app/keystatic/keystatic.ts
"use client";

import { useEffect, useRef, type ReactElement } from "react";

import { makePage } from "@keystatic/next/ui/app";

import config from "../../../keystatic.config";

const KeystaticPage = makePage(config);

type IntlFormatter = Intl.DateTimeFormat["format"] & {
  __keystaticPatched?: true;
};

const RANGE_ERROR_SIGNATURE = "invalid time value";

function patchIntlDateTimeFormat(): void {
  if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat === "undefined") {
    return;
  }

  const prototype = Intl.DateTimeFormat.prototype;
  const originalFormat = prototype.format as IntlFormatter;

  if (originalFormat.__keystaticPatched) {
    return;
  }

  const patched: Intl.DateTimeFormat["format"] = function patchedFormat(
    this: Intl.DateTimeFormat,
    value?: Parameters<Intl.DateTimeFormat["format"]>[0]
  ) {
    if (value === undefined) {
      return "";
    }

    try {
      return originalFormat.call(this, value);
    } catch (error) {
      if (
        error instanceof RangeError &&
        typeof error.message === "string" &&
        error.message.toLowerCase().includes(RANGE_ERROR_SIGNATURE)
      ) {
        return "";
      }
      throw error;
    }
  };

  (patched as IntlFormatter).__keystaticPatched = true;
  prototype.format = patched;
}

export default function KeystaticApp(): ReactElement {
  const patchedRef = useRef(false);

  useEffect(() => {
    if (!patchedRef.current) {
      patchIntlDateTimeFormat();
      patchedRef.current = true;
    }
  }, []);

  return <KeystaticPage />;
}