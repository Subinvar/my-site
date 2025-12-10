import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

import { AnimatedWords } from './animated-words';

interface SectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  description?: string;
  as?: 'h1' | 'h2' | 'h3';
}

export function SectionHeading({ eyebrow, title, description, as = 'h2', className, ...rest }: SectionHeadingProps) {
  const HeadingTag = as;
  return (
    <div className={cn('space-y-2', className)} {...rest}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{eyebrow}</p>
      ) : null}
      <HeadingTag className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
        <AnimatedWords text={title} />
      </HeadingTag>
      {description ? (
        <p className="max-w-2xl text-sm text-[var(--muted-foreground)] sm:text-base">
          <AnimatedWords text={description} />
        </p>
      ) : null}
    </div>
  );
}
