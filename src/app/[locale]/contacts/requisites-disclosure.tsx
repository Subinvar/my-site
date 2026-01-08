import type { ReactNode } from 'react';

import { Card } from '@/app/(site)/shared/ui/card';
import { cn } from '@/lib/cn';

type RequisitesDisclosureProps = {
  /**
   * Anchor id of the section (without "#").
   * Used as the element id so quick links can jump to the block.
   */
  anchorId: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

/**
 * Static requisites block.
 *
 * Previously this was a disclosure (expand/collapse), but the contacts page
 * should stay simple and consistent with the rest of the site.
 */
export function RequisitesDisclosure({
  anchorId,
  title,
  description,
  children,
  className,
}: RequisitesDisclosureProps) {
  return (
    <Card as="section" id={anchorId} className={cn('scroll-mt-28 space-y-6', className)}>
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>

      <div className="space-y-6">{children}</div>
    </Card>
  );
}
