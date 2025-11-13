// src/app/keystatic/[[...ks]]/page.tsx
import type { ReactElement } from "react";

import KeystaticApp from "../keystatic";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page(): ReactElement {
  return <KeystaticApp />;
}