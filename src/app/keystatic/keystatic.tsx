// src/app/keystatic/keystatic.ts
"use client";

import type { ReactElement } from "react";

import { makePage } from "@keystatic/next/ui/app";

import config from "../../../keystatic.config";

const KeystaticPage = makePage(config);

export default function KeystaticApp(): ReactElement {
  return <KeystaticPage />;
}