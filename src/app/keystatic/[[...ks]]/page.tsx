// src/app/keystatic/[[...ks]]/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import KeystaticApp from '../keystatic';

export default function KeystaticCatchAllPage({ params }: { params: { ks?: string[] } }) {
  return <KeystaticApp params={params} />;
}