import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { LineWrapText } from './line-wrap-text';

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
      <LineWrapText
        as={HeadingTag}
        variant="emphasized"
        className="text-xl font-semibold sm:text-2xl text-[var(--foreground)]"
      >
        {title}
      </LineWrapText>
      {description ? (
        <LineWrapText
          as="p"
          variant="subtle"
          className="max-w-2xl text-sm text-[var(--muted-foreground)] sm:text-base"
        >
          {description}
        </LineWrapText>
      ) : null}
    </div>
  );
}
