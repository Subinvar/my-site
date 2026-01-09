"use client";

import Link from 'next/link';

import { cn } from '@/lib/cn';
import { useInView } from '@/lib/use-in-view';
import { AppleHoverLift } from '@/app/(site)/shared/ui/apple-hover-lift';
import { Card } from '@/app/(site)/shared/ui/card';
import type { PostPreview } from './NewsPreview';

export type NewsPreviewContentProps = {
  title: string;
  description: string;
  viewAllLabel: string;
  viewPostLabel: string;
  viewAllHref: string;
  posts: PostPreview[];
};

export function NewsPreviewContent({
  title,
  description,
  viewAllLabel,
  viewPostLabel,
  viewAllHref,
  posts,
}: NewsPreviewContentProps) {
  const { ref, inView } = useInView({ rootMargin: '-20% 0px' });

  return (
    <section
      ref={ref}
      className={cn('py-16 lg:py-20', 'motion-fade-in-up')}
      data-in-view={inView ? 'true' : 'false'}
    >
      <div className="container mx-auto px-4">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div className="space-y-2 motion-fade-in-up" data-in-view={inView ? 'true' : 'false'}>
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-primary motion-fade-in-up"
            data-in-view={inView ? 'true' : 'false'}
          >
            {viewAllLabel}
          </Link>
        </header>

        <div className="space-y-4">
          {posts.map((post) => {
            const displayDate = post.formattedDate ?? post.date;

            return (
              <AppleHoverLift key={post.id} strength="xs">
                <Card
                  as="article"
                  className={cn(
                    'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
                    // Keep the preview list airy, but still “card-like”.
                    'bg-[var(--card)]/80',
                    'motion-fade-in-up',
                  )}
                  data-in-view={inView ? 'true' : 'false'}
                >
                  <div>
                    {displayDate ? (
                      <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                        {displayDate}
                      </div>
                    ) : null}
                    <Link href={post.href} className="text-base font-medium hover:text-primary">
                      {post.title}
                    </Link>
                    {post.excerpt ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                    ) : null}
                  </div>

                  <Link
                    href={post.href}
                    className="text-sm font-medium text-primary"
                  >
                    {viewPostLabel}
                  </Link>
                </Card>
              </AppleHoverLift>
            );
          })}
        </div>
      </div>
    </section>
  );
}
