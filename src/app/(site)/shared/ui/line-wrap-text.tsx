import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export function LineWrapText({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('block break-words text-balance [overflow-wrap:anywhere] leading-relaxed', className)}
      {...rest}
    />
  );
}