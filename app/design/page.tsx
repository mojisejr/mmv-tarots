import { notFound } from 'next/navigation';
import DesignShowcase from './showcase-client';

// Dev-only design showcase / style guide (Oracle Design Framework C2).
// Renders every primitive + token from DESIGN.md in one route so /design-verify
// (and the /ggg design gate) have a single canonical surface to audit.
// Guarded: 404 in production so it never ships to customers.
export const dynamic = 'force-static';

export default function DesignPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return <DesignShowcase />;
}
