// src/app/keystatic/layout.tsx
import type { ReactElement, ReactNode } from "react";

export default function Layout({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return <>{children}</>;
}