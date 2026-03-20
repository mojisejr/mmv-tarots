import { cn } from '@/lib/shared/utils';

/**
 * PageShell — Standard mobile-safe page wrapper.
 *
 * Provides consistent max-width, horizontal padding, and top spacing
 * for all standard surfaces under BottomNav.
 *
 * Bottom clearance is handled globally by the root layout `<main>`
 * via `--mobile-bottom-clearance` token. Pages do NOT need to add
 * their own bottom-nav reserve padding.
 *
 * Immersive pages (e.g. /submitted, result) that hide BottomNav
 * should NOT use PageShell — they manage their own viewport.
 */

const maxWidthMap = {
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
} as const;

type MaxWidth = keyof typeof maxWidthMap;

interface PageShellProps {
  children: React.ReactNode;
  maxWidth?: MaxWidth;
  className?: string;
}

export function PageShell({ children, maxWidth = '4xl', className }: PageShellProps) {
  return (
    <div className={cn(maxWidthMap[maxWidth], 'mx-auto px-4 pt-10', className)}>
      {children}
    </div>
  );
}
