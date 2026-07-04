import { notFound } from 'next/navigation';
import DesignShowcase from './showcase-client';

// Dev-only design showcase / style guide (Oracle Design Framework C2).
// Renders every primitive + token from DESIGN.md in one route so /design-verify
// (and the /ggg design gate) have a single canonical surface to audit.
// Guarded: 404 in production so it never ships to customers.
//
// `?static=1` (C3) renders a deterministic variant: an opaque backdrop hides the
// layout's animated LiquidBackground so screenshot regression is pixel-stable.
export const dynamic = 'force-dynamic';

export default async function DesignPage({
  searchParams,
}: {
  searchParams: Promise<{ static?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  const sp = await searchParams;
  return <DesignShowcase staticMode={sp.static === '1'} />;
}
